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
  
  // ... (existing functions like _clearDatabase, _findSourceFiles, _parseFile, _loadDataIntoGraph, scanAndIndexProject remain here)

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
    const fullPath = path.join(process.cwd(), node.n.properties.file);
    if (!(await fs.pathExists(fullPath)))
      return { ...node.n.properties, definition: "File not found." };
    const content = await fs.readFile(fullPath, "utf8");
    const lines = content.split("\n");
    return {
      ...node.n.properties,
      definition: lines.slice(node.n.properties.startLine - 1, node.n.properties.endLine).join("\n"),
    };
  }

  // --- NEW: REAL IMPLEMENTATIONS OF ADVANCED QUERIES ---

  async getModuleDependencies({ filePath }) {
    if (!this.driver) return [];
    const results = await this._runQuery(
        `MATCH (:Symbol {id: $filePath})-[:IMPORTS]->(dep:Symbol) RETURN dep.id as dependency`,
        { filePath }
    );
    return results.map(record => record.dependency);
  }

  async calculateCKMetrics({ className }) {
    if (!this.driver) return { wmc: 0, dit: 0, noc: 0, cbo: 0, rfc: 0, lcom: 0 };
    
    // WMC: Weighted Methods per Class (number of methods)
    const wmcQuery = `MATCH (c:Symbol {name: $className, type: 'Class'})-[:DEFINES]->(m:Symbol {type: 'Function'}) RETURN count(m) as wmc`;
    const wmcResult = await this._runQuery(wmcQuery, { className });
    const wmc = wmcResult[0] ? wmcResult[0].wmc.low : 0;
    
    // DIT: Depth of Inheritance Tree
    const ditQuery = `MATCH (c:Symbol {name: $className, type: 'Class'})-[:EXTENDS*0..]->(p:Symbol) RETURN count(p) - 1 as dit`;
    const ditResult = await this._runQuery(ditQuery, { className });
    const dit = ditResult[0] ? ditResult[0].dit.low : 0;

    // NOC: Number of Children
    const nocQuery = `MATCH (c:Symbol {name: $className, type: 'Class'})<-[:EXTENDS]-(child:Symbol) RETURN count(child) as noc`;
    const nocResult = await this._runQuery(nocQuery, { className });
    const noc = nocResult[0] ? nocResult[0].noc.low : 0;

    // CBO: Coupling Between Objects
    const cboQuery = `MATCH (c:Symbol {name: $className, type: 'Class'})-[]-(other:Symbol) WHERE other.type IN ['Class', 'Interface'] AND other.name <> $className RETURN count(DISTINCT other) as cbo`;
    const cboResult = await this._runQuery(cboQuery, { className });
    const cbo = cboResult[0] ? cboResult[0].cbo.low : 0;

    return { wmc, dit, noc, cbo, rfc: 0, lcom: 0 }; // rfc and lcom are more complex, placeholder for now
  }
}

export default new CodeIntelligenceService();
