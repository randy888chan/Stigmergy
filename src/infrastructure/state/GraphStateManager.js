import neo4j from "neo4j-driver";
import "dotenv/config.js";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";
import config from "../../../stigmergy.config.js";

class GraphStateManager extends EventEmitter {
  constructor() {
    super();
    this.driver = null;
    this.connectionStatus = "UNINITIALIZED";
    this.initializeDriver();
    this.initializeSchema();
  }

  initializeDriver() {
    const neo4jFeature = config.features?.neo4j;

    if (process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD) {
      try {
        this.driver = neo4j.driver(
          process.env.NEO4J_URI,
          neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
          { disableLosslessIntegers: true }
        );
        this.connectionStatus = "INITIALIZED";
        console.log("[GraphStateManager] Neo4j driver initialized.");
      } catch (error) {
        console.error(`[GraphStateManager] Failed to initialize Neo4j driver: ${error.message}`);
        this.connectionStatus = "FAILED_INITIALIZATION";
      }
    } else {
      const isRequired = neo4jFeature === "required";
      this.connectionStatus = isRequired ? "REQUIRED_MISSING" : "OPTIONAL_MISSING";
      const message = isRequired
        ? "[GraphStateManager] Neo4j is required but credentials are not in .env."
        : "[GraphStateManager] Neo4j credentials not set. State management will not function.";
      console.error(message);
    }
  }

  async initializeSchema() {
    if (this.connectionStatus !== "INITIALIZED") return;
    try {
      const queries = [
        "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Project) REQUIRE p.project_name IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE",
      ];
      for (const query of queries) {
        await this._runQuery(query);
      }
      console.log("[GraphStateManager] Database schema constraints ensured.");
    } catch (error) {
      console.warn(
        `[GraphStateManager] Could not ensure schema constraints. This might be fine if you don't have admin privileges. Error: ${error.message}`
      );
    }
  }

  async _runQuery(query, params = {}) {
    if (this.connectionStatus !== "INITIALIZED") {
      console.error("[GraphStateManager] Driver not available. Cannot run query.");
      return [];
    }
    const session = this.driver.session({ database: "neo4j" });
    try {
      const result = await session.run(query, params);
      return result.records.map((record) => record.toObject());
    } catch (error) {
      console.error(`[GraphStateManager] Error running query: ${error.message}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  async getState(projectName = "New Stigmergy Project") {
    if (this.connectionStatus !== "INITIALIZED") {
      return this.getDefaultState();
    }

    const query = `
      MATCH (p:Project {project_name: $projectName})
      OPTIONAL MATCH (p)-[:HAS_TASK]->(t:Task)
      OPTIONAL MATCH (p)-[:HAS_EVENT]->(e:Event)
      RETURN p, collect(DISTINCT t) as tasks, collect(DISTINCT e) as events
    `;
    const result = await this._runQuery(query, { projectName });

    if (!result || result.length === 0 || !result[0].p) {
      return this.getDefaultState();
    }

    const record = result[0];
    const projectNode = record.p.properties;

    const tasks = record.tasks.map((node) => {
      const props = { ...node.properties };
      delete props.elementId; // Remove Neo4j internal ID
      return props;
    });

    const events = record.events.map((node) => {
      const props = { ...node.properties };
      delete props.elementId; // Remove Neo4j internal ID
      return props;
    });

    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const state = {
      ...projectNode,
      project_manifest: { tasks: tasks },
      history: events,
    };

    delete state.elementId; // Remove Neo4j internal ID

    return state;
  }

  async updateState(event) {
    if (this.connectionStatus !== "INITIALIZED") {
      console.error("[GraphStateManager] Cannot update state, driver not initialized.");
      return this.getDefaultState();
    }

    const currentState = await this.getState(event.project_name);

    const newState = {
      ...currentState,
      ...event,
      lastUpdated: new Date().toISOString(),
    };

    const projectName = newState.project_name;

    const session = this.driver.session({ database: "neo4j" });
    const tx = session.beginTransaction();

    try {
      const { history, project_manifest, ...projectProps } = newState;

      // Clear old tasks and events owned by this manager to prevent duplication
      await tx.run(
        `MATCH (p:Project {project_name: $projectName})-[r:HAS_TASK]->(t:Task) DETACH DELETE t`,
        { projectName }
      );
      await tx.run(
        `MATCH (p:Project {project_name: $projectName})-[r:HAS_EVENT]->(e:Event) DETACH DELETE e`,
        { projectName }
      );

      // Merge project node and update its scalar properties.
      // MERGE handles creation if it doesn't exist.
      await tx.run(
        `MERGE (p:Project {project_name: $projectName})
             SET p = $props`,
        { projectName, props: projectProps }
      );

      // Re-create all task nodes and relationships
      if (project_manifest?.tasks?.length > 0) {
        await tx.run(
          `UNWIND $tasks AS task_data
                 MATCH (p:Project {project_name: $projectName})
                 CREATE (t:Task)
                 SET t = task_data
                 MERGE (p)-[:HAS_TASK]->(t)`,
          { tasks: project_manifest.tasks, projectName }
        );
      }

      // Re-create all event nodes and relationships
      if (history?.length > 0) {
        await tx.run(
          `UNWIND $history AS event_data
                 MATCH (p:Project {project_name: $projectName})
                 CREATE (e:Event)
                 SET e = event_data
                 MERGE (p)-[:HAS_EVENT]->(e)`,
          { history: history, projectName }
        );
      }

      await tx.commit();
    } catch (error) {
      console.error(`[GraphStateManager] Transaction failed: ${error.message}`, error);
      await tx.rollback();
      throw error;
    } finally {
      await session.close();
    }

    this.emit("stateChanged", newState);
    return newState;
  }

  async subscribeToChanges(callback) {
    this.on("stateChanged", callback);
  }

  getDefaultState() {
    return {
      schema_version: "3.1-graph",
      project_name: "New Stigmergy Project",
      project_status: "NEEDS_INITIALIZATION",
      project_manifest: { tasks: [] },
      history: [],
    };
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
      console.log("[GraphStateManager] Neo4j driver closed.");
    }
  }
}

export default new GraphStateManager();
