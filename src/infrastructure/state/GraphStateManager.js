import * as neo4j from "neo4j-driver";
import "dotenv/config.js";
import { EventEmitter } from "events";
import path from "path";
import fs from "fs-extra";

export class GraphStateManager extends EventEmitter {
  constructor(projectRoot) {
    super();
    this.projectRoot = projectRoot || process.cwd();
    this.driver = null;
    this.connectionStatus = "UNINITIALIZED";
    this.projectConfig = null;
    this.initializeDriver();
  }

  initializeDriver() {
    const neo4jUri = process.env.NEO4J_URI;
    const neo4jUser = process.env.NEO4J_USER;
    const neo4jPassword = process.env.NEO4J_PASSWORD;

    if (!neo4jUri || !neo4jUser || !neo4jPassword) {
      this.connectionStatus = "REQUIRED_MISSING";
      throw new Error("GraphStateManager: Neo4j is required, but credentials are not fully set in the environment.");
    }

    try {
      this.driver = neo4j.driver(
        neo4jUri,
        neo4j.auth.basic(neo4jUser, neo4jPassword)
      );
      this.connectionStatus = "INITIALIZED";
      console.log("GraphStateManager: Neo4j driver initialized.");
    } catch (e) {
      this.connectionStatus = "FAILED_INITIALIZATION";
      throw new Error(`GraphStateManager: Failed to initialize Neo4j driver. ${e.message}`);
    }
  }

  async testConnection() {
    if (!this.driver || this.connectionStatus !== 'INITIALIZED') {
      return { status: 'error', message: 'Neo4j driver not initialized' };
    }

    const session = this.driver.session();
    try {
      await session.run('RETURN 1');
      console.log("GraphStateManager: Neo4j connection test successful.");
      return { status: 'ok', message: 'Neo4j connection successful' };
    } catch (error) {
      this.connectionStatus = "CONNECTION_FAILED";
      console.error("GraphStateManager: Neo4j connection test failed:", error.message);
      return { status: 'error', message: `Neo4j connection failed: ${error.message}` };
    } finally {
      await session.close();
    }
  }

  async getState(projectName = "default") {
    const defaultState = {
      project_name: projectName,
      project_status: "NEEDS_INITIALIZATION",
      project_manifest: { tasks: [] },
      history: [],
    };

    if (this.connectionStatus !== 'INITIALIZED') {
      throw new Error("GraphStateManager: Cannot get state, Neo4j driver not initialized.");
    }

    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (p:Project {name: $projectName}) RETURN p',
        { projectName }
      );

      if (result.records.length === 0) {
        return defaultState;
      }

      const projectNode = result.records[0].get('p').properties;
      
      if (projectNode.project_manifest && typeof projectNode.project_manifest === 'string') {
        projectNode.project_manifest = JSON.parse(projectNode.project_manifest);
      }
      if (projectNode.history && typeof projectNode.history === 'string') {
        projectNode.history = JSON.parse(projectNode.history);
      }

      return { ...defaultState, ...projectNode };
    } catch (error) {
      console.error("GraphStateManager: Error getting state from Neo4j:", error.message);
      this.connectionStatus = "CONNECTION_FAILED";
      // Re-throw the error to ensure the application fails fast.
      throw new Error(`Failed to get state from Neo4j: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  async updateState(event) {
    if (this.connectionStatus !== 'INITIALIZED') {
      throw new Error("GraphStateManager: Cannot update state, Neo4j driver not initialized.");
    }

    const session = this.driver.session();
    const projectName = event.project_name || 'default';
    
    const propertiesToSet = { ...event };
    delete propertiesToSet.type;
    propertiesToSet.name = projectName;
    
    if (propertiesToSet.project_manifest) {
      propertiesToSet.project_manifest = JSON.stringify(propertiesToSet.project_manifest, null, 2);
    }
    if (propertiesToSet.history) {
      propertiesToSet.history = JSON.stringify(propertiesToSet.history, null, 2);
    }

    try {
      await session.run(
        `MERGE (p:Project {name: $projectName})
         SET p += $properties`,
        { projectName, properties: propertiesToSet }
      );
      
      const newState = await this.getState(projectName);
      this.emit("stateChanged", newState);
      return newState;
    } catch (error) {
      console.error("GraphStateManager: Error updating state in Neo4j:", error.message);
      this.connectionStatus = "CONNECTION_FAILED";
      // Re-throw the error to ensure the application fails fast.
      throw new Error(`Failed to update state in Neo4j: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  async updateStatus({ newStatus, message = '' }) {
    const event = {
      type: 'STATUS_UPDATE',
      project_status: newStatus,
      message: message,
      last_updated: new Date().toISOString()
    };
    return this.updateState(event);
  }

  async initializeProject(goal) {
    const event = { type: "PROJECT_INITIALIZED", goal, project_status: "ENRICHMENT_PHASE" };
    return this.updateState(event);
  }

  subscribeToChanges(callback) {
    this.on("stateChanged", callback);
  }

  async closeDriver() {
    if (this.driver) {
      console.log("GraphStateManager: Closing Neo4j driver.");
      await this.driver.close();
      this.driver = null;
      this.connectionStatus = "CLOSED";
    }
  }

  getDriver() {
    return this.driver;
  }
}
