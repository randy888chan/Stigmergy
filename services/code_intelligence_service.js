import neo4j from "neo4j-driver";
import { vol } from "memfs";
import { setTimeout } from "timers/promises";
import "dotenv/config.js";
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import * as babelParser from "@babel/parser";
import traverse from "@babel/traverse";
import config from "../stigmergy.config.js";
import chokidar from "chokidar";
import ignore from "ignore";
import NodeCache from "node-cache";

// A very simple mock driver for in-memory testing
const createInMemoryDriver = () => {
  const fs = vol;
  fs.fromJSON({ "/databases": "" });

  return {
    session: () => ({
      run: async (query) => {
        if (query.startsWith("CREATE DATABASE stigmergy")) {
          if (!fs.existsSync("/databases/stigmergy")) {
            fs.mkdirSync("/databases/stigmergy");
          }
          return { records: [] };
        }
        if (query.startsWith("MATCH (n) DETACH DELETE n")) {
          // In a real mock, you'd clear the in-memory store.
          // For now, we do nothing.
          return { records: [] };
        }
        // Return empty results for other queries
        return { records: [] };
      },
      close: async () => {},
    }),
    close: async () => {},
  };
};

class CodeIntelligenceService {
  constructor() {
    this.driver = null;
    this.isMemory = false;
    this.watcher = null;
    this.ig = ignore().add(["node_modules/**", "dist/**", ".*"]);
    this.projectRoot = null;
    const cacheConfig = config.features?.cache || {};
    this.cache = new NodeCache({
      stdTTL: cacheConfig.ttl || 600,
      checkperiod: cacheConfig.checkperiod || 120,
    });
  }

  async enableIncrementalIndexing(projectPath) {
    if (this.watcher) return;

    this.projectRoot = projectPath;

    this.watcher = chokidar.watch(projectPath, {
      ignored: (p) => {
        const relativePath = path.relative(projectPath, p);
        if (relativePath === "") return false;
        return this.ig.ignores(relativePath);
      },
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on("add", (path) => this.indexFile(path))
      .on("change", (path) => this.updateFile(path))
      .on("unlink", (path) => this.removeFile(path));
  }

  async indexFile(filePath) {
    if (!this.projectRoot) return;
    try {
      console.log(`[CodeIntelligence] Indexing new file: ${filePath}`);
      const { nodes, relationships } = await this._parseFile(filePath, this.projectRoot);
      if (nodes.length > 0) {
        await this._loadDataIntoGraph({ nodes, relationships });
        console.log(`[CodeIntelligence] Successfully indexed file: ${filePath}`);
      }
    } catch (error) {
      console.error(`[CodeIntelligence] Error indexing file ${filePath}:`, error);
    }
  }

  async updateFile(filePath) {
    if (!this.projectRoot) return;
    console.log(`[CodeIntelligence] Queued update for file: ${filePath}`);
    await this.removeFile(filePath);
    await this.indexFile(filePath);
  }

  async removeFile(filePath) {
    if (!this.projectRoot) return;
    try {
      const relativePath = path.relative(this.projectRoot, filePath);
      if (this.ig.ignores(relativePath)) return;
      console.log(`[CodeIntelligence] Removing file from index: ${relativePath}`);
      const query = `
        MATCH (f:File { id: $id })
        OPTIONAL MATCH (f)-[:CONTAINS]->(contained)
        DETACH DELETE f, contained
      `;
      await this._runQuery(query, { id: relativePath });
      console.log(`[CodeIntelligence] Successfully removed file: ${relativePath}`);
    } catch (error) {
      console.error(`[CodeIntelligence] Error removing file ${filePath}:`, error);
    }
  }

  initializeDriver() {
    const neo4jFeature = config.features?.neo4j;

    // Handle memory mode first
    if (neo4jFeature === "memory") {
      console.log("[CodeIntelligence] Using in-memory Neo4j driver (mocked).");
      this.driver = createInMemoryDriver();
      this.isMemory = true;
      this.connectionStatus = "MEMORY";
      return;
    }

    // Check if Neo4j is required or optional
    const isRequired = neo4jFeature === "required";

    // Only attempt connection if credentials exist
    if (process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD) {
      try {
        this.driver = neo4j.driver(
          process.env.NEO4J_URI,
          neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
          { disableLosslessIntegers: true }
        );
        this.connectionStatus = "INITIALIZED";
        console.log("[CodeIntelligence] Neo4j driver initialized (pending connection test)");
        return;
      } catch (error) {
        console.warn(`[CodeIntelligence] Failed to initialize Neo4j driver: ${error.message}`);
        this.connectionStatus = "FAILED_INITIALIZATION";
      }
    } else {
      const status = isRequired ? "REQUIRED_MISSING" : "OPTIONAL_MISSING";
      this.connectionStatus = status;
      if (isRequired) {
        console.error("[CodeIntelligence] Neo4j is required but credentials are missing in .env");
      } else {
        console.log("[CodeIntelligence] Neo4j credentials not set. Service is disabled (optional)");
      }
    }
  }

  async detectNeo4jLimitations() {
    if (!this.driver || this.isMemory) {
      return {}; // No limitations to check for non-persistent DB
    }
    try {
      const session = this.driver.session();
      const result = await session.run(
        "CALL dbms.components() YIELD versions, edition UNWIND versions AS version RETURN edition, version"
      );
      await session.close();

      if (result.records.length === 0) {
        return { error: "Could not determine Neo4j edition." };
      }

      const record = result.records[0];
      if (record.get("edition") === "community") {
        return {
          warning: "Neo4j Community Edition detected",
          limitation: "Database size limited to 4GB",
          recommendation: "Upgrade to Enterprise for large projects",
        };
      }
      return {}; // Enterprise or other, no specific limitations to warn about
    } catch (error) {
      // This can fail if the procedure doesn't exist (e.g., AuraDB free tier)
      console.warn(`[CodeIntelligence] Neo4j limitation check failed: ${error.message}`);
      return { error: "Limitation check failed" };
    }
  }

  async testConnection(retries = 3, baseDelay = 1000) {
    // Return cached status if recently checked
    if (this.lastConnectionCheck && Date.now() - this.lastConnectionCheck < 5000) {
      return this.lastConnectionStatus;
    }

    if (!this.driver) this.initializeDriver();

    // Handle different connection status scenarios
    switch (this.connectionStatus) {
      case "MEMORY":
        this.lastConnectionStatus = { success: true, type: "memory" };
        this.lastConnectionCheck = Date.now();
        return this.lastConnectionStatus;

      case "REQUIRED_MISSING":
        const errorMsg = "Neo4j is required but credentials are missing in .env";
        this.lastConnectionStatus = { success: false, error: errorMsg, type: "required_missing" };
        this.lastConnectionCheck = Date.now();
        return this.lastConnectionStatus;

      case "OPTIONAL_MISSING":
        this.lastConnectionStatus = {
          success: false,
          error: "Neo4j credentials not configured",
          type: "optional_missing",
          warning: "Code intelligence features will be limited",
        };
        this.lastConnectionCheck = Date.now();
        return this.lastConnectionStatus;

      case "FAILED_INITIALIZATION":
        this.lastConnectionStatus = {
          success: false,
          error: "Failed to initialize Neo4j driver",
          type: "initialization_failed",
        };
        this.lastConnectionCheck = Date.now();
        return this.lastConnectionStatus;
    }

    // Only attempt connection if driver exists
    if (!this.driver) {
      const errorMsg =
        config.features?.neo4j === "required"
          ? "Neo4j is required, but the driver could not be initialized. Check your .env credentials."
          : "Neo4j driver not initialized. Service is disabled.";
      this.lastConnectionStatus = { success: false, error: errorMsg, type: "no_driver" };
      this.lastConnectionCheck = Date.now();
      return this.lastConnectionStatus;
    }

    try {
      const session = this.driver.session();
      await session.run("RETURN 1 AS test");
      await session.close();

      // Check for limitations after successful connection
      const limitations = await this.detectNeo4jLimitations();

      this.lastConnectionStatus = {
        success: true,
        type: "connected",
        limitations: limitations,
      };
      this.lastConnectionCheck = Date.now();
      return this.lastConnectionStatus;
    } catch (error) {
      // Implement exponential backoff retry logic
      if (retries > 0) {
        const delay = baseDelay * Math.pow(2, 3 - retries);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.testConnection(retries - 1, baseDelay);
      }

      // Store detailed error information
      const errorType = this._categorizeConnectionError(error);
      const errorMsg = this._formatConnectionError(error, errorType);

      this.lastConnectionStatus = {
        success: false,
        error: errorMsg,
        errorType: errorType,
        type: "connection_failed",
      };
      this.lastConnectionCheck = Date.now();
      return this.lastConnectionStatus;
    }
  }

  async _runQuery(query, params) {
    if (!this.driver) this.initializeDriver();
    if (!this.driver) {
      if (config.features?.neo4j === "required") {
        throw new Error("Neo4j is required, but the driver is not initialized.");
      }
      return []; // Silently fail if not required and not initialized
    }

    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map((record) => record.toObject());
    } finally {
      await session.close();
    }
  }

  async initializeDefaultDatabase() {
    if (this.isMemory) return; // Not applicable for in-memory
    try {
      await this._runQuery("CREATE DATABASE stigmergy IF NOT EXISTS");
      console.log("[CodeIntelligence] 'stigmergy' database ensured.");
    } catch (error) {
      // Ignore errors if the database already exists or if user lacks permissions
      if (!error.message.includes("already exists")) {
        console.warn(
          `[CodeIntelligence] Could not create default database. This may be fine if it already exists or due to permissions. Error: ${error.message}`
        );
      }
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

  async _getGraphFiles() {
    const query = `
      MATCH (f:File)
      RETURN f.path AS path, f.lastModified AS lastModified
    `;
    const records = await this._runQuery(query);
    // Convert to a Map for efficient lookups
    const fileMap = new Map();
    records.forEach((record) => {
      fileMap.set(record.path, record.lastModified);
    });
    return fileMap;
  }

  async _parseFile(filePath, projectRoot) {
    const code = await fs.readFile(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);
    const stats = await fs.stat(filePath);

    if (this.ig.ignores(relativePath)) {
      return { nodes: [], relationships: [] };
    }

    const ast = babelParser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "classProperties", "objectRestSpread"],
      errorRecovery: true,
    });

    const nodes = [];
    const relationships = [];

    const fileId = relativePath;
    nodes.push({
      id: fileId,
      type: "File",
      properties: {
        name: path.basename(relativePath),
        path: relativePath,
        lastModified: stats.mtime.getTime(),
      },
    });

    traverse(ast, {
      ImportDeclaration: (astPath) => {
        const source = astPath.node.source.value;
        if (source.startsWith(".")) {
          const targetPath = path.resolve(path.dirname(filePath), source);
          const targetRelativePath = path.relative(projectRoot, targetPath);
          relationships.push({
            sourceId: fileId,
            targetId: targetRelativePath,
            type: "IMPORTS",
          });
        }
      },
      FunctionDeclaration: (astPath) => {
        if (astPath.node.id) {
          const functionName = astPath.node.id.name;
          const functionId = `${relativePath}#${functionName}`;
          nodes.push({
            id: functionId,
            type: "Function",
            properties: { name: functionName, file: relativePath },
          });
          relationships.push({
            sourceId: fileId,
            targetId: functionId,
            type: "CONTAINS",
          });
        }
      },
      ClassDeclaration: (astPath) => {
        if (astPath.node.id) {
          const className = astPath.node.id.name;
          const classId = `${relativePath}#${className}`;
          nodes.push({
            id: classId,
            type: "Class",
            properties: { name: className, file: relativePath },
          });
          relationships.push({
            sourceId: fileId,
            targetId: classId,
            type: "CONTAINS",
          });
        }
      },
    });

    return { nodes, relationships };
  }

  async _loadDataIntoGraph({ nodes, relationships }) {
    if (!this.driver || this.isMemory) return;

    const session = this.driver.session({ database: "stigmergy" });
    const tx = session.beginTransaction();
    try {
      const nodesByType = nodes.reduce((acc, node) => {
        if (!acc[node.type]) {
          acc[node.type] = [];
        }
        acc[node.type].push({ id: node.id, properties: node.properties });
        return acc;
      }, {});

      for (const type in nodesByType) {
        const query = `
          UNWIND $nodes AS node
          MERGE (n:${type} { id: node.id })
          SET n += node.properties
        `;
        await tx.run(query, { nodes: nodesByType[type] });
      }

      const relsByType = relationships.reduce((acc, rel) => {
        if (!acc[rel.type]) {
          acc[rel.type] = [];
        }
        acc[rel.type].push({ sourceId: rel.sourceId, targetId: rel.targetId });
        return acc;
      }, {});

      for (const type in relsByType) {
        const query = `
          UNWIND $rels AS rel
          MATCH (a { id: rel.sourceId }), (b { id: rel.targetId })
          MERGE (a)-[:${type}]->(b)
        `;
        await tx.run(query, { rels: relsByType[type] });
      }

      await tx.commit();
    } catch (error) {
      console.error("[CodeIntelligence] Error loading data into graph:", error);
      await tx.rollback();
    } finally {
      await session.close();
    }
  }

  async scanAndIndexProject(projectPath) {
    if (!this.driver) {
      console.warn("[CodeIntelligence] Driver not initialized. Skipping project scan.");
      return;
    }
    console.log("[CodeIntelligence] Starting project sync...");
    this.projectRoot = projectPath;

    // 1. Get graph and filesystem state
    const graphFilesMap = await this._getGraphFiles();
    const projectFilePaths = await this._findSourceFiles(projectPath);

    const projectFilesWithStats = await Promise.all(
      projectFilePaths.map(async (filePath) => {
        const relativePath = path.relative(projectPath, filePath);
        const stats = await fs.stat(filePath);
        return { filePath, relativePath, lastModified: stats.mtime.getTime() };
      })
    );

    const projectFilesMap = new Map(projectFilesWithStats.map((f) => [f.relativePath, f]));

    // 2. Identify changes
    const filesToIndex = [];
    const filesToUpdate = [];

    for (const [relativePath, fileData] of projectFilesMap.entries()) {
      if (!graphFilesMap.has(relativePath)) {
        filesToIndex.push(fileData.filePath);
      } else {
        const graphLastModified = graphFilesMap.get(relativePath);
        if (fileData.lastModified > graphLastModified) {
          filesToUpdate.push(fileData.filePath);
        }
      }
    }

    const filesToRemove = [];
    for (const graphFilePath of graphFilesMap.keys()) {
      if (!projectFilesMap.has(graphFilePath)) {
        filesToRemove.push(path.join(projectPath, graphFilePath));
      }
    }

    // 3. Process changes
    if (filesToIndex.length > 0 || filesToUpdate.length > 0 || filesToRemove.length > 0) {
      console.log(
        `[CodeIntelligence] Syncing... ${filesToIndex.length} new, ${filesToUpdate.length} modified, ${filesToRemove.length} deleted.`
      );

      const indexPromises = filesToIndex.map((file) => this.indexFile(file));
      const updatePromises = filesToUpdate.map((file) => this.updateFile(file));
      const removePromises = filesToRemove.map((file) => this.removeFile(file));

      await Promise.all([...indexPromises, ...updatePromises, ...removePromises]);

      console.log("[CodeIntelligence] Project sync complete.");
    } else {
      console.log("[CodeIntelligence] Project is already up to date.");
    }

    // Enable incremental indexing for future changes
    await this.enableIncrementalIndexing(projectPath);
    console.log("[CodeIntelligence] Incremental indexing enabled.");
  }

  async findUsages({ symbolName }) {
    const cacheKey = `findUsages:${symbolName}`;
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) return cachedResult;

    const query = `
      MATCH (symbolNode)
      WHERE symbolNode.name = $symbolName
      WITH symbolNode
      // Find the file containing the original symbol
      MATCH (definingFile:File)-[:CONTAINS]->(symbolNode)
      // Find files that import the defining file
      MATCH (importer:File)-[:IMPORTS]->(definingFile)
      RETURN importer.path AS importingFile, symbolNode.type AS symbolType
      LIMIT 100
    `;
    const result = await this._runQuery(query, { symbolName });
    this.cache.set(cacheKey, result);
    return result;
  }

  async getDefinition({ symbolName }) {
    const cacheKey = `getDefinition:${symbolName}`;
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) return cachedResult;

    const query = `
      MATCH (symbolNode)
      WHERE symbolNode.name = $symbolName
      RETURN symbolNode.file AS file, symbolNode.type AS type, symbolNode.id AS id
      LIMIT 1
    `;
    const result = await this._runQuery(query, { symbolName });
    this.cache.set(cacheKey, result);
    return result.length > 0 ? result[0] : null;
  }

  async getModuleDependencies({ filePath }) {
    const cacheKey = `getModuleDependencies:${filePath}`;
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) return cachedResult;

    const query = `
      MATCH (f:File {id: $filePath})-[:IMPORTS]->(dep:File)
      RETURN dep.path AS dependency
      LIMIT 100
    `;
    const result = await this._runQuery(query, { filePath });
    this.cache.set(cacheKey, result);
    return result;
  }

  async calculateCKMetrics({ className }) {
    const cacheKey = `calculateCKMetrics:${className}`;
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) return cachedResult;

    // This is a simplified version. A full implementation would be more complex.
    const query = `
      MATCH (c:Class {name: $className})
      // WMC: Count methods in the class
      OPTIONAL MATCH (c)-[:CONTAINS]->(m:Function)
      WITH c, count(m) AS wmc
      // DIT: Depth of Inheritance Tree (simplified)
      OPTIONAL MATCH p=(c)-[:EXTENDS*0..]->()
      WITH c, wmc, size(nodes(p)) - 1 AS dit
      // NOC: Number of Children
      OPTIONAL MATCH (child)-[:EXTENDS]->(c)
      RETURN c.name AS className, wmc, dit, count(child) AS noc
      LIMIT 1
    `;
    const result = await this._runQuery(query, { className });
    const metrics = result.length > 0 ? result[0] : {};
    this.cache.set(cacheKey, metrics);
    return metrics;
  }
  // Helper method to categorize connection errors
  _categorizeConnectionError(error) {
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return "connection_refused";
    } else if (
      error.code === "Neo.ClientError.Security.Unauthorized" ||
      error.message.includes("authentication failed")
    ) {
      return "authentication_failed";
    } else if (error.message.includes("timeout")) {
      return "connection_timeout";
    }
    return "unknown_error";
  }

  // Helper method to format user-friendly error messages
  _formatConnectionError(error, errorType) {
    const messages = {
      connection_refused:
        "Cannot connect to Neo4j server. Check if Neo4j Desktop is running and the URI is correct.",
      authentication_failed:
        "Authentication failed. Check your Neo4j username and password in .env file.",
      connection_timeout:
        "Connection timed out. Check your network connection and Neo4j server status.",
      unknown_error: `Connection failed: ${error.message}`,
    };

    return messages[errorType] || messages.unknown_error;
  }
}

export default new CodeIntelligenceService();
