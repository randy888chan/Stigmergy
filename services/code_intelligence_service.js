import neo4j from "neo4j-driver";
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import babelParser from "@babel/parser";
import traverse from "@babel/traverse";

class CodeIntelligenceService {
  constructor() {
    this.driver = null;
  }

  initializeDriver() {
    if (process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD) {
      this.driver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
      );
    } else {
      console.warn("[CodeIntelligence] Neo4j credentials not set. Service is disabled.");
    }
  }

  async _runQuery(query, params) {
    if (!this.driver) {
      this.initializeDriver();
    }
    if (!this.driver) throw new Error("Neo4j driver not initialized or credentials not set.");

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
          const type = astPath.node.type
            .replace("Declaration", "")
            .replace("Declarator", "Variable");
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
          if (type === "Class") {
            const superClass = astPath.get("superClass");
            if (superClass.isIdentifier()) {
              relationships.push({
                source: nodeId,
                targetName: superClass.node.name,
                type: "EXTENDS",
              });
            }
          }
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
      for (const relType in relsByType) {
        const query = `UNWIND $rels AS r MATCH (s:Symbol {id: r.source}), (t:Symbol {id: r.target}) MERGE (s)-[:${relType}]->(t)`;
        await session.run(query, { rels: relsByType[relType] });
      }
    } finally {
      await session.close();
    }
  }

  async scanAndIndexProject(projectPath) {
    await this._clearDatabase();
    console.log("[CodeIntelligence] Starting project scan...");
    const files = await this._findSourceFiles(projectPath);
    console.log(`[CodeIntelligence] Found ${files.length} files to index.`);
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
    return this._runQuery(
      `MATCH (s)-[:CALLS]->(t {name: $symbolName}) RETURN s.name AS user, s.file as file, s.startLine as line`,
      { symbolName }
    );
  }

  async getDefinition({ symbolName }) {
    const results = await this._runQuery(
      `MATCH (n {name: $symbolName}) RETURN n.id as id, n.file as file, n.startLine as startLine, n.endLine as endLine, n.language as language LIMIT 1`,
      { symbolName }
    );
    if (results.length === 0) return null;
    const node = results[0];
    const fullPath = path.join(process.cwd(), node.file);
    if (!(await fs.pathExists(fullPath))) return { ...node, definition: "File not found." };
    const content = await fs.readFile(fullPath, "utf8");
    const lines = content.split("\n");
    return {
      ...node,
      definition: lines.slice(node.startLine.low - 1, node.endLine.low).join("\n"),
    };
  }

  async getModuleDependencies({ filePath }) {
    const results = await this._runQuery(
      `MATCH (:Symbol {id: $filePath})-[:IMPORTS]->(dep:Symbol) RETURN dep.id as dependency`,
      { filePath }
    );
    return results.map((record) => record.dependency);
  }

  async calculateCKMetrics({ className }) {
    const wmcQuery = `MATCH (c:Symbol {name: $className, type: 'Class'})-[:DEFINES]->(m:Symbol {type: 'Function'}) RETURN count(m) as value`;
    const ditQuery = `MATCH (c:Symbol {name: $className, type: 'Class'})-[:EXTENDS*0..]->(p:Symbol) RETURN count(p) - 1 as value`;
    const nocQuery = `MATCH (c:Symbol {name: $className, type: 'Class'})<-[:EXTENDS]-(child:Symbol) RETURN count(child) as value`;
    const cboQuery = `MATCH (c:Symbol {name: $className, type: 'Class'})-[]-(other:Symbol) WHERE other.type IN ['Class', 'Interface'] AND other.name <> $className RETURN count(DISTINCT other) as value`;

    const [wmcRes, ditRes, nocRes, cboRes] = await Promise.all([
      this._runQuery(wmcQuery, { className }),
      this._runQuery(ditQuery, { className }),
      this._runQuery(nocQuery, { className }),
      this._runQuery(cboQuery, { className }),
    ]);

    const metrics = {
      wmc: wmcRes[0]?.value?.low || 0,
      dit: ditRes[0]?.value?.low || 0,
      noc: nocRes[0]?.value?.low || 0,
      cbo: cboRes[0]?.value?.low || 0,
      rfc: 0,
      lcom: 0,
    };

    return metrics;
  }
}

export default new CodeIntelligenceService();
