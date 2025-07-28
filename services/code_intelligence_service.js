const neo4j = require('neo4j-driver');
const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * The Code Intelligence Service, inspired by jonnoc-coderag.
 * This service is responsible for creating and querying a rich knowledge graph of the user's codebase.
 */
class CodeIntelligenceService {
  constructor() {
    this.driver = null;
    this.initializeDriver();
  }

  initializeDriver() {
    if (process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD) {
      try {
        this.driver = neo4j.driver(
          process.env.NEO4J_URI,
          neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
        );
        console.log('[CodeIntelligence] Neo4j driver initialized.');
      } catch (error) {
        console.error('[CodeIntelligence] Failed to initialize Neo4j driver:', error);
      }
    } else {
      console.warn('[CodeIntelligence] Neo4j credentials not set. Code intelligence will be disabled.');
    }
  }

  async _runQuery(query, params) {
    if (!this.driver) throw new Error("Neo4j driver not initialized.");
    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }

  async _clearDatabase() {
    console.log('[CodeIntelligence] Clearing existing graph data...');
    await this._runQuery('MATCH (n) DETACH DELETE n');
  }

  async _findSourceFiles(projectPath) {
    const patterns = '**/*.{js,jsx,ts,tsx}';
    const ignorePatterns = ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', '.*/**'];
    return glob(patterns, { cwd: projectPath, ignore: ignorePatterns, absolute: true });
  }
  
  async _parseFile(filePath, projectRoot) {
    const code = await fs.readFile(filePath, 'utf8');
    const relativePath = path.relative(projectRoot, filePath);
    const nodes = [];
    const relationships = [];

    nodes.push({ id: relativePath, type: 'File', name: path.basename(relativePath), path: relativePath, language: path.extname(filePath).substring(1) });

    const ast = babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      errorRecovery: true,
    });

    traverse(ast, {
      ImportDeclaration: (astPath) => {
        const importSource = astPath.node.source.value;
        if (importSource.startsWith('.')) { // Only handle relative imports for now
          const resolvedPath = path.relative(projectRoot, path.resolve(path.dirname(filePath), importSource));
          relationships.push({ source: relativePath, target: resolvedPath, type: 'IMPORTS' });
        }
      },
      'FunctionDeclaration|ClassDeclaration|VariableDeclarator': (astPath) => {
        let name;
        if (astPath.node.id && astPath.node.id.type === 'Identifier') {
          name = astPath.node.id.name;
        } else {
          return; // Skip anonymous declarations for now
        }
        
        const type = astPath.node.type.replace('Declaration', '').replace('Declarator', '');
        const nodeId = `${relativePath}#${name}`;
        
        nodes.push({
          id: nodeId,
          type,
          name,
          file: relativePath,
          startLine: astPath.node.loc.start.line,
          endLine: astPath.node.loc.end.line,
        });
        
        relationships.push({ source: relativePath, target: nodeId, type: 'DEFINES' });
      },
      CallExpression: (astPath) => {
        const callee = astPath.node.callee;
        if (callee.type === 'Identifier') {
          const functionName = callee.name;
          const callerNode = astPath.findParent((p) => p.isFunctionDeclaration() || p.isClassMethod());
          
          if (callerNode && (callerNode.node.id || callerNode.node.key)) {
            const callerName = (callerNode.node.id || callerNode.node.key).name;
            const callerId = `${relativePath}#${callerName}`;
            
            relationships.push({ source: callerId, targetName: functionName, type: 'CALLS' });
          }
        }
      },
    });

    return { nodes, relationships };
  }
  
  async _loadDataIntoGraph({ nodes, relationships }) {
    if (nodes.length === 0 && relationships.length === 0) return;
    console.log(`[CodeIntelligence] Loading ${nodes.length} nodes and ${relationships.length} relationships into graph...`);

    const session = this.driver.session();
    try {
      await session.run(
        `UNWIND $nodes AS node_data
         MERGE (n:Symbol {id: node_data.id})
         SET n += node_data, n.type = node_data.type`,
        { nodes }
      );

      const relationshipQueries = [
        { type: 'DEFINES', query: 'MERGE (source)-[:DEFINES]->(target)' },
        { type: 'IMPORTS', query: 'MERGE (source)-[:IMPORTS]->(target)' }
      ];

      for (const { type, query } of relationshipQueries) {
        const rels = relationships.filter(r => r.type === type);
        if (rels.length > 0) {
          await session.run(
            `UNWIND $rels AS rel_data
             MATCH (source:Symbol {id: rel_data.source})
             MATCH (target:Symbol {id: rel_data.target})
             ${query}`,
            { rels }
          );
        }
      }
      
      const callRels = relationships.filter(r => r.type === 'CALLS');
      if(callRels.length > 0) {
        await session.run(
            `UNWIND $rels AS rel_data
             MATCH (source:Symbol {id: rel_data.source})
             MATCH (target:Symbol {name: rel_data.targetName})
             MERGE (source)-[:CALLS]->(target)`,
            { rels: callRels }
        );
      }
    } finally {
      await session.close();
    }
  }

  async scanAndIndexProject(projectPath) {
    if (!this.driver) {
      console.warn('[CodeIntelligence] Scan skipped: Neo4j not configured.');
      return;
    }
    await this._clearDatabase();
    console.log('[CodeIntelligence] Starting full project scan...');
    
    const files = await this._findSourceFiles(projectPath);
    console.log(`[CodeIntelligence] Found ${files.length} files to parse.`);
    
    let allNodes = new Map();
    let allRelationships = [];

    for (const file of files) {
      try {
        const { nodes, relationships } = await this._parseFile(file, projectPath);
        nodes.forEach(node => allNodes.set(node.id, node));
        allRelationships.push(...relationships);
      } catch (e) {
        console.error(`[CodeIntelligence] Failed to parse ${file}:`, e.message);
      }
    }
    
    await this._loadDataIntoGraph({ nodes: Array.from(allNodes.values()), relationships: allRelationships });
    console.log('[CodeIntelligence] Project scan and indexing complete.');
  }

  async findUsages({ symbolName }) {
    if (!this.driver) return [];
    const query = `
      MATCH (target {name: $symbolName})<-[r:CALLS]-(source)
      RETURN source.name AS user, source.file as file, source.startLine as line
    `;
    return this._runQuery(query, { symbolName });
  }

  async getDefinition({ symbolName }) {
    if (!this.driver) return null;
    const query = `
      MATCH (n {name: $symbolName})
      RETURN n.id as id, n.file as file, n.startLine as startLine, n.endLine as endLine, n.language as language
      LIMIT 1
    `;
    const results = await this._runQuery(query, { symbolName });
    if (results.length === 0) return null;
    
    const node = results[0].n;
    const projectRoot = process.cwd(); // Assume project root is CWD
    const fullPath = path.join(projectRoot, node.file);
    if (!await fs.pathExists(fullPath)) return { ...node, definition: "Source file not found." };
    
    const fileContent = await fs.readFile(fullPath, 'utf8');
    const lines = fileContent.split('\n');
    const definition = lines.slice((node.startLine || 1) - 1, node.endLine).join('\n');
    
    return { ...node, definition };
  }
}

module.exports = new CodeIntelligenceService();
