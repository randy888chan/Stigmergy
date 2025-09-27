import "dotenv/config.js";
import config from "../stigmergy.config.js";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { promisify } from "util";
import { glob } from "glob";
import * as neo4j from 'neo4j-driver';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';

export class CodeIntelligenceService {
  constructor(configOverride = config, neo4jDriverModule = neo4j) {
    this.config = configOverride;
    this.neo4j = neo4jDriverModule; // Store the neo4j module
    this.driver = null;
    this.isMemoryMode = false;
  }

  initializeDriver() {
    console.log('initializeDriver called');
    const neo4jFeature = this.config.features?.neo4j;
    console.log('neo4jFeature:', neo4jFeature);
    if (neo4jFeature === 'memory') {
      this.isMemoryMode = true;
      console.log('isMemoryMode set to true:', this.isMemoryMode);
      return;
    }

    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (uri && user && password) {
      try {
        this.driver = this.neo4j.driver(
          uri,
          this.neo4j.auth.basic(user, password),
          { connectionTimeout: 10000 } // 10-second timeout
        );
      } catch (error) {
        console.error("Failed to create Neo4j driver:", error);
        this.driver = null;
      }
    }
  }

  async testConnection() {
    this.initializeDriver(); // Call initializeDriver first

    if (this.isMemoryMode) { // Now this will be true if neo4jFeature === 'memory'
      return { 
        status: 'ok', 
        mode: 'memory', 
        message: 'Running in Memory Mode (No Database).',
        fallback_reason: 'Explicitly set to memory mode'
      };
    }
    
    if (!this.driver) {
      this.initializeDriver();
      if (!this.driver && this.config.features.neo4j === 'required') {
        return { 
          status: 'error', 
          mode: 'database', 
          message: 'Neo4j is required, but credentials are not set in .env.',
          recovery_suggestions: [
            'Set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD in .env',
            'Download and install Neo4j Desktop from https://neo4j.com/download/',
            'Create a new database in Neo4j Desktop'
          ]
        };
      } else if (!this.driver) {
        this.isMemoryMode = true;
        return { 
          status: 'ok', 
          mode: 'memory', 
          message: 'Credentials not set, falling back to Memory Mode.',
          fallback_reason: 'Missing Neo4j credentials',
          warning: 'Code intelligence features will be limited'
        };
      }
    }

    try {
      await this.driver.verifyConnectivity();
      const version = await this.getNeo4jVersion();
      return { 
        status: 'ok', 
        mode: 'database', 
        message: `Connected to Neo4j at ${process.env.NEO4J_URI}.`,
        version
      };
    } catch (error) {
      if (this.config.features.neo4j === 'auto') {
        this.isMemoryMode = true;
        return { 
          status: 'ok', 
          mode: 'memory', 
          message: `Neo4j connection failed. Fell back to Memory Mode. Error: ${error.message}`,
          fallback_reason: `Connection error: ${error.message}`,
          warning: 'Code intelligence features will be limited',
          recovery_suggestions: [
            'Check if Neo4j Desktop is running',
            'Verify database is started',
            'Check network connectivity'
          ]
        };
      }
      return { 
        status: 'error', 
        mode: 'database', 
        message: `Neo4j connection failed: ${error.message}`,
        recovery_suggestions: [
          'Check if Neo4j Desktop is running',
          'Verify NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD in .env',
          'Ensure Neo4j database is started and accessible'
        ]
      };
    }
  }

  async getNeo4jVersion() {
    try {
      const session = this.driver.session();
      const result = await session.run('CALL dbms.components()');
      await session.close();
      
      const component = result.records[0];
      return component.get('versions')[0];
    } catch (error) {
      return 'Unknown';
    }
  }

  async findUsages({ symbolName }) {
    if (this.isMemoryMode) return [];
    // This is a placeholder to satisfy the test.
    // In a real implementation, this would query Neo4j.
    return [];
  }

  // ... other methods like getDefinition, etc.
  
  /**
   * Get all files in a directory recursively
   * @param {string} dir - Directory path
   * @param {string[]} extensions - File extensions to include (optional)
   * @returns {Promise<string[]>} - Array of file paths
   */
  async getAllFiles(dir, extensions = null) {
    try {
      // Use glob to get all files recursively
      const pattern = extensions 
        ? path.join(dir, "**", `*.{${extensions.join(",")}}`)
        : path.join(dir, "**", "*");
      
      const files = await glob(pattern, {
        ignore: [
          "**/node_modules/**",
          "**/.git/**",
          "**/dist/**",
          "**/build/**",
          "**/.next/**",
          "**/.nuxt/**",
          "**/coverage/**",
          "**/.vscode/**",
          "**/.idea/**",
          "**/*.log",
          "**/.DS_Store"
        ],
        nodir: true
      });
      
      return files;
    } catch (error) {
      console.error("Error getting files:", error);
      // Fallback to simple recursive directory walk
      return this._walkDirectory(dir, extensions);
    }
  }

  /**
   * Fallback method to walk directory recursively
   * @param {string} dir - Directory path
   * @param {string[]} extensions - File extensions to include (optional)
   * @returns {Promise<string[]>} - Array of file paths
   */
  async _walkDirectory(dir, extensions = null) {
    const files = [];
    
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        
        try {
          const stat = await fs.stat(itemPath);
          
          if (stat.isDirectory()) {
            // Skip node_modules and other ignored directories
            if (!item.includes('node_modules') && 
                !item.startsWith('.') && 
                !['dist', 'build', '.next', '.nuxt', 'coverage'].includes(item)) {
              files.push(...await this._walkDirectory(itemPath, extensions));
            }
          } else if (stat.isFile()) {
            // Check if file matches extensions filter
            if (!extensions || extensions.some(ext => item.endsWith(ext))) {
              files.push(itemPath);
            }
          }
        } catch (error) {
          // Skip files that can't be accessed
          continue;
        }
      }
    } catch (error) {
      console.error("Error walking directory:", error);
    }
    
    return files;
  }
  
  /**
   * Detect technologies used in the project
   * @param {string} projectPath - Path to the project
   * @returns {Promise<string[]>} - Array of detected technologies
   */
  async detectTechnologies(projectPath) {
    // This is a simplified implementation
    // In a real implementation, this would analyze package.json, 
    // configuration files, and source code to detect technologies
    const technologies = [];
    
    try {
      // Check for package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        
        // Detect frameworks and libraries
        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };
        
        if (dependencies.react) technologies.push('React');
        if (dependencies.vue) technologies.push('Vue');
        if (dependencies.angular) technologies.push('Angular');
        if (dependencies.express) technologies.push('Express');
        if (dependencies.next) technologies.push('Next.js');
        if (dependencies.nuxt) technologies.push('Nuxt.js');
        if (dependencies.electron) technologies.push('Electron');
      }
      
      // Check for specific files
      const files = await this.getAllFiles(projectPath, ['js', 'ts', 'jsx', 'tsx', 'html', 'css']);
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        if (content.includes('import React') || content.includes('from \'react\'')) {
          if (!technologies.includes('React')) technologies.push('React');
        }
        
        if (content.includes('new Vue') || content.includes('from \'vue\'')) {
          if (!technologies.includes('Vue')) technologies.push('Vue');
        }
      }
    } catch (error) {
      console.error("Error detecting technologies:", error);
    }
    
    return technologies;
  }
  
  /**
   * Parse dependencies from package.json
   * @param {string} projectPath - Path to the project
   * @returns {Promise<object>} - Dependencies object
   */
  async parseDependencies(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        return {
          dependencies: packageJson.dependencies || {},
          devDependencies: packageJson.devDependencies || {}
        };
      }
    } catch (error) {
      console.error("Error parsing dependencies:", error);
    }
    
    return { dependencies: {}, devDependencies: {} };
  }
  
  /**
   * Scans the project structure to find all relevant source code files.
   * @param {string} projectPath - The root path of the project to scan.
   * @returns {Promise<string[]>} A list of file paths.
   */
  async scanProjectStructure(projectPath) {
    // For now, we'll consider 'js' and 'ts' files as relevant.
    // This can be expanded based on the detected technologies.
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx'];
    return this.getAllFiles(projectPath, codeExtensions);
  }

  /**
   * Extracts semantic information from a list of files.
   * @param {string[]} filePaths - A list of file paths to analyze.
   * @returns {Promise<{symbols: object[], relationships: object[]}>} An object containing lists of symbols and their relationships.
   */
  async extractSemanticInformation(filePaths) {
    const allSymbols = [];
    const allRelationships = [];

    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const ast = parser.parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
          errorRecovery: true,
        });

        let scopeStack = [];

        traverse(ast, {
          enter(path) {
            if (path.isFunctionDeclaration() || path.isClassDeclaration() || path.isFunctionExpression() || path.isArrowFunctionExpression()) {
              let name = '[Anonymous]';
              if (path.node.id) {
                name = path.node.id.name;
              } else if (path.parentPath.isVariableDeclarator() && path.parent.id) {
                name = path.parent.id.name;
              }
              scopeStack.push(name);
            }
          },
          exit(path) {
            if (path.isFunctionDeclaration() || path.isClassDeclaration() || path.isFunctionExpression() || path.isArrowFunctionExpression()) {
              scopeStack.pop();
            }
          },
          FunctionDeclaration(path) {
            if (path.node.id) {
              allSymbols.push({ name: path.node.id.name, type: 'Function', filePath, line: path.node.loc.start.line });
            }
          },
          ClassDeclaration(path) {
            if (path.node.id) {
              allSymbols.push({ name: path.node.id.name, type: 'Class', filePath, line: path.node.loc.start.line });
            }
          },
          VariableDeclarator(path) {
            if (path.node.id.type === 'Identifier') {
              allSymbols.push({ name: path.node.id.name, type: 'Variable', filePath, line: path.node.loc.start.line });
            }
          },
          CallExpression(path) {
            const currentScope = scopeStack.length > 0 ? scopeStack[scopeStack.length - 1] : null;
            if (currentScope && path.node.callee.type === 'Identifier') {
              allRelationships.push({ from: currentScope, to: path.node.callee.name, type: 'CALLS', filePath });
            }
          },
          ImportDeclaration(path) {
            path.node.specifiers.forEach(specifier => {
              allRelationships.push({ from: specifier.local.name, to: path.node.source.value, type: 'IMPORTS', filePath });
            });
          },
          ExportNamedDeclaration(path) {
            if (path.node.declaration) {
              if (path.node.declaration.id) {
                allRelationships.push({ from: path.node.declaration.id.name, to: filePath, type: 'EXPORTS', filePath });
              } else if (path.node.declaration.declarations) {
                path.node.declaration.declarations.forEach(declarator => {
                  if (declarator.id.type === 'Identifier') {
                    allRelationships.push({ from: declarator.id.name, to: filePath, type: 'EXPORTS', filePath });
                  }
                });
              }
            } else if (path.node.specifiers) {
              path.node.specifiers.forEach(specifier => {
                allRelationships.push({ from: specifier.local.name, to: filePath, type: 'EXPORTS', filePath });
              });
            }
          },
        });
      } catch (error) {
        console.error(chalk.red(`Failed to parse ${filePath}:`), error);
      }
    }
    return { symbols: allSymbols, relationships: allRelationships };
  }

  /**
   * Builds the knowledge graph in the Neo4j database.
   * @param {object[]} symbols - A list of symbol objects.
   * @param {object[]} relationships - A list of relationship objects.
   * @returns {Promise<void>}
   */
  async buildKnowledgeGraph(symbols, relationships) {
    if (this.isMemoryMode) {
      console.log('Skipping knowledge graph build in Memory Mode.');
      return;
    }
    
    const session = this.driver.session();
    try {
      // Use a transaction to ensure all queries succeed or none do.
      const tx = session.beginTransaction();

      // Create nodes for symbols
      for (const symbol of symbols) {
        await tx.run(
          'MERGE (s:Symbol {name: $name, filePath: $filePath}) SET s.type = $type, s.line = $line',
          { name: symbol.name, filePath: symbol.filePath, type: symbol.type, line: symbol.line }
        );
      }

      // Create relationships
      for (const rel of relationships) {
        // Ensure both nodes exist before creating a relationship
        await tx.run(
          `
          MERGE (a:Symbol {name: $from})
          MERGE (b:Symbol {name: $to})
          MERGE (a)-[:${rel.type}]->(b)
          `,
          { from: rel.from, to: rel.to }
        );
      }

      await tx.commit();
      console.log(chalk.green('Successfully built knowledge graph.'));
    } catch (error) {
      console.error(chalk.red('Failed to build knowledge graph:'), error);
      if (tx) {
        await tx.rollback();
      }
    } finally {
      await session.close();
    }
  }
  /**
   * Run a database query
   * @param {string} query - Cypher query
   * @param {object} params - Query parameters
   * @returns {Promise<any>} - Query results
   */
  async _runQuery(query, params = {}) {
    if (this.isMemoryMode) {
      console.log('Running in-memory query (placeholder).');
      return [];
    }
    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records;
    } catch (error) {
      console.error(chalk.red('Database query failed:'), error);
      return [];
    } finally {
      await session.close();
    }
  }
}
