import neo4j from "neo4j-driver";
import "dotenv/config.js";
import { EventEmitter } from "events";
import config from "../../../stigmergy.config.js";
import path from "path";
import fs from "fs-extra";

class GraphStateManager extends EventEmitter {
  constructor() {
    super();
    this.driver = null;
    this.connectionStatus = "UNINITIALIZED";
    this.connectionTested = false;
    this.memoryState = null;
    this.projectConfig = null;
    this.initializeDriver();
  }

  initializeDriver() {
    // Check for project-specific configuration first
    this.projectConfig = this.getProjectConfig();
    
    // Use project-specific Neo4j configuration if available
    const neo4jUri = (this.projectConfig && this.projectConfig.neo4j && this.projectConfig.neo4j.uri) || process.env.NEO4J_URI;
    const neo4jUser = (this.projectConfig && this.projectConfig.neo4j && this.projectConfig.neo4j.user) || process.env.NEO4J_USER;
    const neo4jPassword = (this.projectConfig && this.projectConfig.neo4j && this.projectConfig.neo4j.password) || process.env.NEO4J_PASSWORD;
    
    if (neo4jUri && neo4jUser && neo4jPassword) {
      try {
        // For Aura connections, don't add additional encryption config as it's already in the URI
        const isAura = neo4jUri.includes('neo4j+s://') || neo4jUri.includes('neo4j+ssc://');
        
        // Only add driver config for non-Aura connections
        let driverConfig = {};
        if (!isAura) {
          // Add encryption configuration for non-Aura connections if needed
          // This is just a placeholder - actual config would depend on the Neo4j setup
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
    // Only test connection once to avoid repeated failures
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
    // Check for project-specific configuration
    const projectConfig = this.getProjectConfig();
    
    const defaultState = {
        project_name: projectName,
        project_status: "NEEDS_INITIALIZATION",
        project_manifest: { tasks: [] },
        history: [],
        fallback_mode: false,
        project_config: projectConfig
    };

    // If we've already determined that Neo4j is not available, use memory state
    if (this.connectionStatus !== 'INITIALIZED' || this.connectionStatus === "CONNECTION_FAILED") {
        console.warn("GraphStateManager: Operating in fallback mode - state will not persist between sessions.");
        // Store state in memory for this session
        if (!this.memoryState) {
            this.memoryState = { 
              ...defaultState, 
              fallback_mode: true,
              fallback_reason: this.connectionStatus === 'REQUIRED_MISSING' 
                ? 'Neo4j credentials required but not configured' 
                : 'Neo4j connection unavailable',
              persistence_warning: 'State will not persist between sessions'
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
      
      // Parse properties that are stored as JSON strings
      if (projectNode.project_manifest && typeof projectNode.project_manifest === 'string') {
          projectNode.project_manifest = JSON.parse(projectNode.project_manifest);
      }
      if (projectNode.history && typeof projectNode.history === 'string') {
          projectNode.history = JSON.parse(projectNode.history);
      }

      return { ...defaultState, ...projectNode };
    } catch (error) {
      console.error("GraphStateManager: Error getting state from Neo4j:", error.message);
      // Mark connection as failed to avoid repeated attempts
      this.connectionStatus = "CONNECTION_FAILED";
      // Fallback to memory state if Neo4j is not available
      if (!this.memoryState) {
        this.memoryState = { 
          ...defaultState, 
          fallback_mode: true,
          fallback_reason: 'Neo4j query failed',
          persistence_warning: 'State will not persist between sessions'
        };
      }
      return this.memoryState;
    } finally {
      await session.close();
    }
  }

  async updateState(event) {
    // If we've already determined that Neo4j is not available, use memory state
    if (this.connectionStatus !== 'INITIALIZED' || this.connectionStatus === "CONNECTION_FAILED") {
        console.warn(`GraphStateManager: Operating in fallback mode. State update for event '${event.type || 'unknown'}' will be stored in memory only.`);
        
        // Update memory state if in fallback mode
        if (this.memoryState) {
          const projectName = event.project_name || 'default';
          
          // Apply the event to memory state
          Object.assign(this.memoryState, {
            ...event,
            project_name: projectName,
            last_updated: new Date().toISOString(),
            fallback_mode: true
          });
          
          console.debug(`GraphStateManager: Updated memory state for project ${projectName}`, this.memoryState);
          this.emit("stateChanged", this.memoryState);
          return this.memoryState;
        }
        
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
      console.error("GraphStateManager: Error updating state in Neo4j:", error.message);
      // Mark connection as failed to avoid repeated attempts
      this.connectionStatus = "CONNECTION_FAILED";
      // Fallback to memory state if Neo4j is not available
      if (!this.memoryState) {
        this.memoryState = { 
          ...event, 
          project_name: projectName,
          fallback_mode: true,
          fallback_reason: 'Neo4j update failed',
          persistence_warning: 'State will not persist between sessions'
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

  getProjectConfig() {
    // If we've already loaded the project config, return it
    if (this.projectConfig) {
      return this.projectConfig;
    }
    
    // Try to load project-specific configuration
    try {
      // First check for .stigmergy/config.js (new structure)
      let configPath = path.join(process.cwd(), '.stigmergy', 'config.js');
      
      // If not found, check for .stigmergy-core/config.js (legacy structure)
      if (!fs.existsSync(configPath)) {
        configPath = path.join(process.cwd(), '.stigmergy-core', 'config.js');
      }
      
      // If still not found, check for .stigmergy/config.json
      if (!fs.existsSync(configPath)) {
        configPath = path.join(process.cwd(), '.stigmergy', 'config.json');
      }
      
      // If still not found, check for .stigmergy-core/config.json
      if (!fs.existsSync(configPath)) {
        configPath = path.join(process.cwd(), '.stigmergy-core', 'config.json');
      }
      
      // If we found a config file, load it
      if (fs.existsSync(configPath)) {
        // For .js files, we need to import them
        if (configPath.endsWith('.js')) {
          // Use synchronous import approach to avoid async issues
          delete require.cache[require.resolve(configPath)];
          const projectConfig = require(configPath);
          this.projectConfig = projectConfig.default || projectConfig;
          return this.projectConfig;
        }
        // For .json files, we can read them directly
        else if (configPath.endsWith('.json')) {
          const projectConfig = fs.readJsonSync(configPath);
          this.projectConfig = projectConfig;
          return this.projectConfig;
        }
      }
    } catch (error) {
      console.warn("GraphStateManager: Failed to load project-specific configuration:", error.message);
    }
    
    // Return null if no project-specific configuration found
    return null;
  }

  subscribeToChanges(callback) {
    this.on("stateChanged", callback);
  }
}

export default new GraphStateManager();