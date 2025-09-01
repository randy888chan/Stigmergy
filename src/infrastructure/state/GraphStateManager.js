import neo4j from "neo4j-driver";
import "dotenv/config.js";
import { EventEmitter } from "events";
import config from "../../../stigmergy.config.js";

class GraphStateManager extends EventEmitter {
  constructor() {
    super();
    this.driver = null;
    this.connectionStatus = "UNINITIALIZED";
    this.initializeDriver();
  }

  initializeDriver() {
    if (process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD) {
      try {
        this.driver = neo4j.driver(
          process.env.NEO4J_URI,
          neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
        );
        this.connectionStatus = "INITIALIZED";
        console.log("GraphStateManager: Neo4j driver initialized.");
      } catch (e) {
        this.connectionStatus = "FAILED_INITIALIZATION";
        console.error("GraphStateManager: Failed to initialize Neo4j driver.", e);
      }
    } else if (config.features.neo4j === "required") {
      this.connectionStatus = "REQUIRED_MISSING";
      console.error("GraphStateManager: Neo4j is required, but credentials are not set in .env.");
    } else {
        this.connectionStatus = "NOT_CONFIGURED";
        console.warn("GraphStateManager: Neo4j credentials not set. State will not be persisted.");
    }
  }

  async getState(projectName = "default") {
    const defaultState = {
        project_name: projectName,
        project_status: "NEEDS_INITIALIZATION",
        project_manifest: { tasks: [] },
        history: [],
    };

    if (!this.driver || this.connectionStatus !== 'INITIALIZED') {
        console.warn("GraphStateManager: Neo4j driver not available. Returning default state.");
        return defaultState;
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
      
      // Parse properties that are stored as JSON strings
      if (projectNode.project_manifest && typeof projectNode.project_manifest === 'string') {
          projectNode.project_manifest = JSON.parse(projectNode.project_manifest);
      }
      if (projectNode.history && typeof projectNode.history === 'string') {
          projectNode.history = JSON.parse(projectNode.history);
      }

      return { ...defaultState, ...projectNode };
    } catch (error) {
      console.error("GraphStateManager: Error getting state from Neo4j:", error);
      return defaultState;
    } finally {
      await session.close();
    }
  }

  async updateState(event) {
    if (!this.driver || this.connectionStatus !== 'INITIALIZED') {
        console.warn(`GraphStateManager: Neo4j driver not available. State update for event '${event.type}' will be lost.`);
        return this.getState(event.project_name);
    }

    const session = this.driver.session();
    const projectName = event.project_name || 'default';
    
    // Create a copy of the event to avoid mutating the original
    const propertiesToSet = { ...event };
    delete propertiesToSet.type;
    propertiesToSet.name = projectName;
    
    // Stringify complex objects for storage
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
      console.error("GraphStateManager: Error updating state in Neo4j:", error);
      return this.getState(projectName);
    } finally {
      await session.close();
    }
  }

  subscribeToChanges(callback) {
    this.on("stateChanged", callback);
  }
}

export default new GraphStateManager();
