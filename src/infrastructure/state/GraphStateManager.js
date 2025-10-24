import * as neo4j from "neo4j-driver";
import "dotenv/config.js";
import { EventEmitter } from "events";
import config from "../../../stigmergy.config.js";
import path from "path";
import fs from "fs-extra";
import { FileStorageAdapter } from "./FileStorageAdapter.js";

export class GraphStateManager extends EventEmitter {
  constructor(projectRoot, storageAdapter) {
    super();
    this.projectRoot = projectRoot || process.cwd();
    this.storageAdapter = storageAdapter || new FileStorageAdapter();
    this.driver = null;
    this.connectionStatus = "UNINITIALIZED";
    this.connectionTested = false;
    this.memoryState = null;
    this.projectConfig = null;
    this.initializeDriver();
    
    this.on("stateChanged", (newState) => {
      if (this.connectionStatus !== 'INITIALIZED' || this.connectionStatus === "CONNECTION_FAILED") {
        this.storageAdapter.updateState(this.projectRoot, newState);
      }
    });
  }

  async initializeDriver() {
    this.projectConfig = await this.getProjectConfig();
    
    const neo4jUri = (this.projectConfig && this.projectConfig.neo4j && this.projectConfig.neo4j.uri) || process.env.NEO4J_URI;
    const neo4jUser = (this.projectConfig && this.projectConfig.neo4j && this.projectConfig.neo4j.user) || process.env.NEO4J_USER;
    const neo4jPassword = (this.projectConfig && this.projectConfig.neo4j && this.projectConfig.neo4j.password) || process.env.NEO4J_PASSWORD;
    
    if (neo4jUri && neo4jUser && neo4jPassword) {
      try {
        const isAura = neo4jUri.includes('neo4j+s://') || neo4jUri.includes('neo4j+ssc://');
        
        let driverConfig = {};
        if (!isAura) {
        }
        
        this.driver = neo4j.driver(
          neo4jUri,
          neo4j.auth.basic(neo4jUser, neo4jPassword),
          driverConfig
        );
        this.connectionStatus = "INITIALIZED";
        console.log("GraphStateManager: Neo4j driver initialized.");
      } catch (e) {
        this.connectionStatus = "FAILED_INITIALIZATION";
        console.error("GraphStateManager: Failed to initialize Neo4j driver.", e.message);
      }
    } else if ((this.projectConfig && this.projectConfig.features && this.projectConfig.features.neo4j === "required") || config.features.neo4j === "required") {
      this.connectionStatus = "REQUIRED_MISSING";
      console.error("GraphStateManager: Neo4j is required, but credentials are not set in .env or project config.");
    } else {
        this.connectionStatus = "NOT_CONFIGURED";
        console.warn("GraphStateManager: Neo4j credentials not set. State will not be persisted.");
        console.info("GraphStateManager: Running in memory-only mode. State changes will not persist between sessions.");
    }
  }

  async testConnection() {
    if (this.connectionTested) {
      return this.connectionStatus === 'INITIALIZED' ? 
        { status: 'ok', message: 'Neo4j connection successful' } : 
        { status: 'error', message: 'Neo4j connection not available' };
    }
    
    this.connectionTested = true;
    
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
    const projectConfig = await this.getProjectConfig();
    
    const defaultState = {
        project_name: projectName,
        project_status: "NEEDS_INITIALIZATION",
        project_manifest: { tasks: [] },
        history: [],
        fallback_mode: false,
        project_config: projectConfig
    };

    if (this.connectionStatus !== 'INITIALIZED' || this.connectionStatus === "CONNECTION_FAILED") {
        if (!this.memoryState) {
          const fileState = await this.storageAdapter.getState(this.projectRoot);
          this.memoryState = fileState || {
            ...defaultState,
            fallback_mode: true,
            fallback_reason: this.connectionStatus === 'REQUIRED_MISSING'
              ? 'Neo4j credentials required but not configured'
              : 'Neo4j connection unavailable',
            persistence_warning: 'State will be persisted to file.'
          };
        }
        return this.memoryState;
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
      if (!this.memoryState) {
        const fileState = await this.storageAdapter.getState(this.projectRoot);
        this.memoryState = fileState || {
          ...defaultState, 
          fallback_mode: true,
          fallback_reason: 'Neo4j query failed',
          persistence_warning: 'State will be persisted to file.'
        };
      }
      return this.memoryState;
    } finally {
      await session.close();
    }
  }

  async updateState(event) {
    if (this.connectionStatus !== 'INITIALIZED' || this.connectionStatus === "CONNECTION_FAILED") {
        if (!this.memoryState) {
          await this.getState(event.project_name || 'default');
        }

        const projectName = event.project_name || this.memoryState.project_name || 'default';
        Object.assign(this.memoryState, {
          ...event,
          project_name: projectName,
          last_updated: new Date().toISOString(),
          fallback_mode: true
        });
        
        this.emit("stateChanged", this.memoryState);
        return this.memoryState;
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
      if (!this.memoryState) {
        const fileState = await this.storageAdapter.getState(this.projectRoot);
        this.memoryState = fileState || {
          ...event, 
          project_name: projectName,
          fallback_mode: true,
          fallback_reason: 'Neo4j update failed',
          persistence_warning: 'State will be persisted to file.'
        };
      } else {
        Object.assign(this.memoryState, event, { 
          project_name: projectName,
          fallback_mode: true,
          last_updated: new Date().toISOString()
        });
      }
      this.emit("stateChanged", this.memoryState);
      return this.memoryState;
    } finally {
      await session.close();
    }
  }

  async updateStatus({ newStatus, message = '' }) {
    if (this.connectionStatus !== 'INITIALIZED' && this.connectionStatus !== 'CONNECTION_FAILED') {
        if (!this.memoryState) {
          await this.getState(); // Ensure memoryState is initialized
        }
        this.memoryState.project_status = newStatus;
        if (message) {
          this.memoryState.message = message;
        }
        this.memoryState.last_updated = new Date().toISOString();
        this.emit("stateChanged", this.memoryState);
        return this.memoryState;
    }

    const event = {
      type: 'STATUS_UPDATE',
      project_status: newStatus,
      message: message,
      last_updated: new Date().toISOString()
    };
    const newState = await this.updateState(event);

    return newState;
  }

  async initializeProject(goal) {
    const event = { type: "PROJECT_INITIALIZED", goal, project_status: "ENRICHMENT_PHASE" };
    return this.updateState(event);
  }

  async getProjectConfig() {
    if (this.projectConfig) {
      return this.projectConfig;
    }
    
    try {
      let configPath = path.join(this.projectRoot, '.stigmergy', 'config.js');
      
      if (!fs.existsSync(configPath)) {
        configPath = path.join(this.projectRoot, '.stigmergy-core', 'config.js');
      }
      
      if (!fs.existsSync(configPath)) {
        configPath = path.join(this.projectRoot, '.stigmergy', 'config.json');
      }
      
      if (!fs.existsSync(configPath)) {
        configPath = path.join(this.projectRoot, '.stigmergy-core', 'config.json');
      }
      
      if (fs.existsSync(configPath)) {
        if (configPath.endsWith('.js')) {
          const projectConfigModule = await import(`file://${configPath}`);
          const projectConfig = projectConfigModule.default || projectConfigModule;
          this.projectConfig = projectConfig;
          return this.projectConfig;
        } 
        else if (configPath.endsWith('.json')) {
          const projectConfig = fs.readJsonSync(configPath);
          this.projectConfig = projectConfig;
          return this.projectConfig;
        }
      }
    } catch (error) {
      console.warn("GraphStateManager: Failed to load project-specific configuration:", error.message);
    }
    
    return null;
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
