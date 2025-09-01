import { CodeIntelligenceService } from './code_intelligence_service.js';
import fs from 'fs-extra';
import path from 'path';

export class CodeRAGIntegration extends CodeIntelligenceService {
  constructor() {
    super();
    this.projectMetadata = new Map();
    this.semanticIndex = new Map();
  }

  async initializeCodeRAG(projectPath) {
    console.log(`🔍 Initializing CodeRAG for project: ${projectPath}`);
    
    const projectStructure = await this.scanProjectStructure(projectPath);
    const semanticData = await this.extractSemanticInformation(projectPath);
    await this.buildKnowledgeGraph(projectStructure, semanticData);
    
    console.log(`✅ CodeRAG initialization complete`);
    return {
      files_indexed: projectStructure.files.length,
      symbols_extracted: semanticData.symbols.length,
      relationships_created: semanticData.relationships.length
    };
  }

  async scanProjectStructure(projectPath) {
    const structure = {
      files: [],
      technologies: [],
      dependencies: {}
    };

    const files = await this.getAllFiles(projectPath);
    structure.files = files.map(file => ({
      path: file,
      relativePath: path.relative(projectPath, file),
      extension: path.extname(file),
      size: fs.statSync(file).size
    }));

    structure.technologies = await this.detectTechnologies(projectPath);
    structure.dependencies = await this.parseDependencies(projectPath);

    return structure;
  }

  async extractSemanticInformation(projectPath) {
    const semanticData = {
      symbols: [],
      relationships: []
    };

    const files = await this.getAllFiles(projectPath);
    
    for (const file of files) {
      if (this.isCodeFile(file)) {
        const fileData = await this.analyzeCodeFile(file);
        semanticData.symbols.push(...fileData.symbols);
        semanticData.relationships.push(...fileData.relationships);
      }
    }

    return semanticData;
  }

  async buildKnowledgeGraph(structure, semanticData) {
    if (this.isMemoryMode) {
      console.log('Building in-memory knowledge graph...');
      this.buildMemoryGraph(structure, semanticData);
      return;
    }

    // Create project node
    const projectQuery = `
      MERGE (p:Project {name: $projectName})
      SET p.file_count = $fileCount,
          p.symbol_count = $symbolCount,
          p.last_indexed = datetime()
    `;

    await this._runQuery(projectQuery, {
      projectName: path.basename(process.cwd()),
      fileCount: structure.files.length,
      symbolCount: semanticData.symbols.length
    });

    for (const symbol of semanticData.symbols) {
      await this.createSymbolNode(symbol);
    }

    for (const relationship of semanticData.relationships) {
      await this.createRelationship(relationship);
    }
  }

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

    return { symbols, relationships };
  }

  async semanticSearch(query, options = {}) {
    const { limit = 20 } = options;

    if (this.isMemoryMode) {
      return this.memorySemanticSearch(query, options);
    }

    const cypherQuery = `
      MATCH (s:Symbol)
      WHERE s.name CONTAINS $query 
      WITH s, 
           CASE 
             WHEN s.name CONTAINS $query THEN 3
             ELSE 1
           END as relevance_score
      RETURN s, relevance_score
      ORDER BY relevance_score DESC
      LIMIT $limit
    `;

    const results = await this._runQuery(cypherQuery, { 
      query: query.toLowerCase(), 
      limit 
    });

    return {
      results: results.map(record => ({
        symbol: record.s.properties,
        relevance: record.relevance_score
      })),
      total: results.length
    };
  }
}

export async function initialize_coderag({ projectPath = process.cwd() }) {
  const coderag = new CodeRAGIntegration();
  return await coderag.initializeCodeRAG(projectPath);
}

export async function semantic_search({ query, options = {} }) {
  const coderag = new CodeRAGIntegration();
  return await coderag.semanticSearch(query, options);
}