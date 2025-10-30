import * as neo4j from "neo4j-driver";
import "dotenv/config.js";
import { EventEmitter } from "events";
import path from "path";
import fs from "fs-extra";

export class GraphStateManager extends EventEmitter {
  constructor(projectRoot, driver = null) {
    super();
    this.projectRoot = projectRoot || process.cwd();
    this.driver = driver;
    this.connectionStatus = "UNINITIALIZED";
    this.projectConfig = null;

    if (this.driver) {
      this.connectionStatus = "INITIALIZED";
      console.log("GraphStateManager: Using pre-configured Neo4j driver.");
    } else {
      this.initializeDriver();
    }
  }

  initializeDriver() {
    const neo4jUri = process.env.NEO4J_URI;
    const neo4jUser = process.env.NEO4J_USER;
    const neo4jPassword = process.env.NEO4J_PASSWORD;

    this.fallback_mode = false;
    this.memory_state = {};

    if (!neo4jUri || !neo4jUser || !neo4jPassword) {
      console.warn(
        "GraphStateManager: Neo4j credentials not fully set. Falling back to in-memory state management."
      );
      this.connectionStatus = "FALLBACK_MODE";
      this.fallback_mode = true;
      return;
    }

    try {
      const driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword), {
        connectionTimeout: 5000, // 5 seconds
      });

      const connectionTest = async () => {
        const session = driver.session();
        try {
          await session.run("RETURN 1");
          return true;
        } finally {
          await session.close();
        }
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Neo4j connection timed out')), 5000)
      );

      await Promise.race([connectionTest(), timeoutPromise]);

      this.driver = driver;
      this.connectionStatus = "INITIALIZED";
      console.log("GraphStateManager: Neo4j driver initialized and connection verified.");

    } catch (e) {
      console.warn(
        `GraphStateManager: Failed to initialize or connect to Neo4j driver. Falling back to in-memory state. Error: ${e.message}`
      );
      this.connectionStatus = "FALLBACK_MODE";
      this.fallback_mode = true;
    }
  }

  async testConnection() {
    if (!this.driver || this.connectionStatus !== "INITIALIZED") {
      return { status: "error", message: "Neo4j driver not initialized" };
    }

    const session = this.driver.session();
    try {
      await session.run("RETURN 1");
      console.log("GraphStateManager: Neo4j connection test successful.");
      return { status: "ok", message: "Neo4j connection successful" };
    } catch (error) {
      this.connectionStatus = "CONNECTION_FAILED";
      console.error("GraphStateManager: Neo4j connection test failed:", error.message);
      return { status: "error", message: `Neo4j connection failed: ${error.message}` };
    } finally {
      await session.close();
    }
  }

  async getState(projectName = "default") {
    if (this.fallback_mode) {
      return (
        this.memory_state[projectName] || {
          project_name: projectName,
          project_status: "NEEDS_INITIALIZATION",
          project_manifest: { tasks: [] },
          history: [],
        }
      );
    }
    const defaultState = {
      project_name: projectName,
      project_status: "NEEDS_INITIALIZATION",
      project_manifest: { tasks: [] },
      history: [],
    };

    if (this.connectionStatus !== "INITIALIZED") {
      throw new Error("GraphStateManager: Cannot get state, Neo4j driver not initialized.");
    }

    const session = this.driver.session();
    try {
      const result = await session.run("MATCH (p:Project {name: $projectName}) RETURN p", {
        projectName,
      });

      if (result.records.length === 0) {
        return defaultState;
      }

      const projectNode = result.records[0].get("p").properties;

      if (projectNode.project_manifest && typeof projectNode.project_manifest === "string") {
        projectNode.project_manifest = JSON.parse(projectNode.project_manifest);
      }
      if (projectNode.history && typeof projectNode.history === "string") {
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
    const projectName = event.project_name || "default";
    if (this.fallback_mode) {
      const currentState = this.memory_state[projectName] || {};
      const newState = { ...currentState, ...event };
      this.memory_state[projectName] = newState;
      this.emit("stateChanged", newState);
      return newState;
    }
    if (this.connectionStatus !== "INITIALIZED") {
      throw new Error("GraphStateManager: Cannot update state, Neo4j driver not initialized.");
    }

    const session = this.driver.session();

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

  async updateStatus({ newStatus, message = "" }) {
    const event = {
      type: "STATUS_UPDATE",
      project_status: newStatus,
      message: message,
      last_updated: new Date().toISOString(),
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
