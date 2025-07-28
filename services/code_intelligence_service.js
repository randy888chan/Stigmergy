import neo4j from "neo4j-driver";
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import babelParser from "@babel/parser";
import traverse from "@babel/traverse";

class CodeIntelligenceService {
  constructor() {
    this.driver = null;
    this.initializeDriver();
  }

  initializeDriver() {
    if (process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD) {
      this.driver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
      );
    } else {
      console.warn("[CodeIntelligence] Neo4j credentials not set. Service disabled.");
    }
  }

  async _runQuery(query, params) {
    if (!this.driver) throw new Error("Neo4j driver not initialized.");
    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map((record) => record.toObject());
    } finally {
      await session.close();
    }
  }

  async _clearDatabase() {
    await this._runQuery("MATCH (n) DETACH DELETE n");
  }

  async _findSourceFiles(projectPath) {
    return glob("**/*.{js,jsx,ts,tsx}", {
      cwd: projectPath,
      ignore: ["node_modules/**", "dist/**", "build/**", ".*/**"],
      absolute: true,
    });
  }

  async _parseFile(filePath, projectRoot) {
    const code = await fs.readFile(filePath, "utf8");
    const relativePath = path.relative(projectRoot, filePath);
    const nodes = new Map();
    const relationships = [];
    nodes.set(relativePath, {
      id: relativePath,
      type: "File",
      name: path.basename(relativePath),
      path: relativePath,
      language: path.extname(filePath).substring(1),
    });

    const ast = babelParser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      errorRecovery: true,
    });

    traverse(ast, {
      ImportDeclaration: (astPath) => {
        const source = astPath.node.source.value;
        if (source.startsWith(".")) {
          const targetPath = path.relative(
            projectRoot,
            path.resolve(path.dirname(filePath), source)
          );
          relationships.push({ source: relativePath, target: targetPath, type: "IMPORTS" });
        }
      },
      "FunctionDeclaration|ClassDeclaration|VariableDeclarator": (astPath) => {
        let nameNode = astPath.get("id");
        if (Array.isArray(nameNode)) nameNode = nameNode[0];
        if (nameNode && nameNode.isIdentifier()) {
          const name = nameNode.node.name;
          const type = astPath.node.type.replace("Declaration", "").replace("Declarator", "");
          const nodeId = `${relativePath}#${name}`;
          nodes.set(nodeId, {
            id: nodeId,
            type,
            name,
            file: relativePath,
            startLine: astPath.node.loc.start.line,
            endLine: astPath.node.loc.end.line,
          });
          relationships.push({ source: relativePath, target: nodeId, type: "DEFINES" });
        }
      },
      CallExpression: (astPath) => {
        const callee = astPath.get("callee");
        if (callee.isIdentifier()) {
          const functionName = callee.node.name;
          const parentFunc = astPath.findParent((p) => p.isFunction());
          if (parentFunc && parentFunc.node.id) {
            const callerId = `${relativePath}#${parentFunc.node.id.name}`;
            relationships.push({ source: callerId, targetName: functionName, type: "CALLS" });
          }
        }
      },
    });
    return { nodes: Array.from(nodes.values()), relationships };
  }

  async _loadDataIntoGraph({ nodes, relationships }) {
    if (nodes.length === 0 && relationships.length === 0) return;
    const session = this.driver.session();
    try {
      await session.run(`UNWIND $nodes AS n MERGE (s:Symbol {id: n.id}) SET s += n`, { nodes });
      const relsByType = relationships.reduce((acc, r) => {
        (acc[r.type] = acc[r.type] || []).push(r);
        return acc;
      }, {});
      if (relsByType.DEFINES)
        await session.run(
          `UNWIND $rels AS r MATCH (s:Symbol {id: r.source}), (t:Symbol {id: r.target}) MERGE (s)-[:DEFINES]->(t)`,
          { rels: relsByType.DEFINES }
        );
      if (relsByType.IMPORTS)
        await session.run(
          `UNWIND $rels AS r MATCH (s:Symbol {id: r.source}), (t:Symbol {id: r.target}) MERGE (s)-[:IMPORTS]->(t)`,
          { rels: relsByType.IMPORTS }
        );
      if (relsByType.CALLS)
        await session.run(
          `UNWIND $rels AS r MATCH (s:Symbol {id: r.source}), (t:Symbol {name: r.targetName}) MERGE (s)-[:CALLS]->(t)`,
          { rels: relsByType.CALLS }
        );
    } finally {
      await session.close();
    }
  }

  async scanAndIndexProject(projectPath) {
    if (!this.driver) return console.warn("Scan skipped: Neo4j not configured.");
    await this._clearDatabase();
    console.log("[CodeIntelligence] Starting project scan...");
    const files = await this._findSourceFiles(projectPath);
    console.log(`[CodeIntelligence] Found ${files.length} files.`);
    let allNodes = [],
      allRelationships = [];
    for (const file of files) {
      try {
        const { nodes, relationships } = await this._parseFile(file, projectPath);
        allNodes.push(...nodes);
        allRelationships.push(...relationships);
      } catch (e) {
        console.error(`[CodeIntelligence] Failed to parse ${file}: ${e.message}`);
      }
    }
    await this._loadDataIntoGraph({ nodes: allNodes, relationships: allRelationships });
    console.log("[CodeIntelligence] Project scan complete.");
  }

  async findUsages({ symbolName }) {
    if (!this.driver) return [];
    return this._runQuery(
      `MATCH (s)-[:CALLS]->(t {name: $symbolName}) RETURN s.name AS user, s.file as file, s.startLine as line`,
      { symbolName }
    );
  }

  async getDefinition({ symbolName }) {
    if (!this.driver) return null;
    const results = await this._runQuery(
      `MATCH (n {name: $symbolName}) RETURN n.id, n.file, n.startLine, n.endLine, n.language LIMIT 1`,
      { symbolName }
    );
    if (results.length === 0) return null;
    const node = results[0];
    const fullPath = path.join(process.cwd(), node.get("file"));
    if (!(await fs.pathExists(fullPath)))
      return { ...node.toObject(), definition: "File not found." };
    const content = await fs.readFile(fullPath, "utf8");
    const lines = content.split("\n");
    return {
      ...node.toObject(),
      definition: lines.slice(node.get("startLine") - 1, node.get("endLine")).join("\n"),
    };
  }
}

export default new CodeIntelligenceService();
