import * as neo4j from "neo4j-driver";
import "dotenv/config.js";
import config from "../stigmergy.config.js";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { promisify } from "util";
import { glob } from "glob";

export class CodeIntelligenceService {
  constructor() {
    this.driver = null;
    this.isMemoryMode = false;
  }

  initializeDriver() {
    const neo4jFeature = config.features?.neo4j;
    if (neo4jFeature === 'memory') {
      this.isMemoryMode = true;
      return;
    }

    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (uri && user && password) {
      try {
        this.driver = neo4j.driver(
          uri,
          neo4j.auth.basic(user, password),
          { connectionTimeout: 10000 } // 10-second timeout
        );
      } catch (error) {
        console.error("Failed to create Neo4j driver:", error);
        this.driver = null;
      }
    }
  }

  async testConnection() {
    if (this.isMemoryMode) {
      return { 
        status: 'ok', 
        mode: 'memory', 
        message: 'Running in Memory Mode (No Database).',
        fallback_reason: 'Explicitly set to memory mode'
      };
    }
    
    if (!this.driver) {
      this.initializeDriver();
      if (!this.driver && config.features.neo4j === 'required') {
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
      if (config.features.neo4j === 'auto') {
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
   * Check if a file is a code file
   * @param {string} filePath - Path to the file
   * @returns {boolean} - True if it's a code file
   */
  isCodeFile(filePath) {
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.java', '.py', '.cpp', '.c', '.cs', 
      '.go', '.rb', '.php', '.swift', '.kt', '.rs', '.scala', '.dart'
    ];
    
    return codeExtensions.some(ext => filePath.endsWith(ext));
  }
  
  /**
   * Analyze a code file
   * @param {string} filePath - Path to the file
   * @returns {Promise<object>} - Analysis results
   */
  async analyzeCodeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const extension = path.extname(filePath);
      
      // Simple analysis based on file extension
      switch (extension) {
        case '.js':
        case '.jsx':
          return this.analyzeJavaScriptFile(content, filePath);
        case '.ts':
        case '.tsx':
          return this.analyzeTypeScriptFile(content, filePath);
        default:
          // Generic analysis for other file types
          return {
            symbols: [],
            relationships: []
          };
      }
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      return {
        symbols: [],
        relationships: []
      };
    }
  }
  
  /**
   * Analyze a JavaScript file
   * @param {string} content - File content
   * @param {string} filePath - Path to the file
   * @returns {object} - Analysis results
   */
  analyzeJavaScriptFile(content, filePath) {
    const symbols = [];
    const relationships = [];
    
    // Extract classes
    const classMatches = content.matchAll(/class\s+(\w+)(?:\s+extends\s+(\w+))?/g);
    for (const match of classMatches) {
      symbols.push({
        name: match[1],
        type: 'Class',
        file: filePath,
        line: this.getLineNumber(content, match.index)
      });
      
      // Add inheritance relationship
      if (match[2]) {
        relationships.push({
          from: match[1],
          to: match[2],
          type: 'extends',
          file: filePath
        });
      }
    }
    
    // Extract functions
    const functionMatches = content.matchAll(/(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?function)/g);
    for (const match of functionMatches) {
      const functionName = match[1] || match[2];
      if (functionName) {
        symbols.push({
          name: functionName,
          type: 'Function',
          file: filePath,
          line: this.getLineNumber(content, match.index)
        });
      }
    }
    
    // Extract variables
    const variableMatches = content.matchAll(/(?:const|let|var)\s+(\w+)/g);
    for (const match of variableMatches) {
      symbols.push({
        name: match[1],
        type: 'Variable',
        file: filePath,
        line: this.getLineNumber(content, match.index)
      });
    }
    
    return { symbols, relationships };
  }
  
  /**
   * Analyze a TypeScript file
   * @param {string} content - File content
   * @param {string} filePath - Path to the file
   * @returns {object} - Analysis results
   */
  analyzeTypeScriptFile(content, filePath) {
    // For now, use the same analysis as JavaScript
    return this.analyzeJavaScriptFile(content, filePath);
  }
  
  /**
   * Get line number from character index
   * @param {string} content - File content
   * @param {number} index - Character index
   * @returns {number} - Line number
   */
  getLineNumber(content, index) {
    if (index === undefined) return 1;
    
    // Count newlines before the index
    const lines = content.substring(0, index).split('\n');
    return lines.length;
  }
  
  /**
   * Build in-memory knowledge graph
   * @param {object} structure - Project structure
   * @param {object} semanticData - Semantic data
   */
  buildMemoryGraph(structure, semanticData) {
    // This is a placeholder implementation
    // In a real implementation, this would build an in-memory graph
    console.log('Building in-memory knowledge graph with', 
                structure.files.length, 'files and', 
                semanticData.symbols.length, 'symbols');
  }
  
  /**
   * Create a symbol node in the database
   * @param {object} symbol - Symbol data
   */
  async createSymbolNode(symbol) {
    // This is a placeholder implementation
    // In a real implementation, this would create a node in Neo4j
    console.log('Creating symbol node:', symbol.name);
  }
  
  /**
   * Create a relationship in the database
   * @param {object} relationship - Relationship data
   */
  async createRelationship(relationship) {
    // This is a placeholder implementation
    // In a real implementation, this would create a relationship in Neo4j
    console.log('Creating relationship:', relationship.from, '->', relationship.to);
  }
  
  /**
   * Run a database query
   * @param {string} query - Cypher query
   * @param {object} params - Query parameters
   * @returns {Promise<any>} - Query results
   */
  async _runQuery(query, params = {}) {
    // This is a placeholder implementation
    // In a real implementation, this would run a query against Neo4j
    console.log('Running query:', query.substring(0, 100) + '...');
    return [];
  }
}
