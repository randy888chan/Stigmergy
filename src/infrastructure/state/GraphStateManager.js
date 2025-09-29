import * as neo4j from "neo4j-driver";
import "dotenv/config.js";
import { EventEmitter } from "events";
import config from "../../../stigmergy.config.js";
import path from "path";
import fs from "fs-extra";

class GraphStateManager extends EventEmitter {
  constructor(projectRoot) {
    super();
    this.projectRoot = projectRoot || process.cwd();
    this.driver = null;
    this.connectionStatus = "UNINITIALIZED";
    this.connectionTested = false;
    this.memoryState = null;
    this.projectConfig = null;
    this.initializeDriver();
    
    // Subscribe to our own state changes to write to file in fallback mode
    console.log("GraphStateManager: Setting up stateChanged event listener");
    this.on("stateChanged", (newState) => {
      console.log("GraphStateManager: stateChanged event received");
      this.writeStateToFile(newState);
    });
  }

  async initializeDriver() {
    // Check for project-specific configuration first
    this.projectConfig = await this.getProjectConfig();
    
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
    const projectConfig = await this.getProjectConfig();
    
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
            console.log("GraphStateManager: Initialized memoryState:", JSON.stringify(this.memoryState, null, 2));
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
        console.log("GraphStateManager: Initialized memoryState due to Neo4j error:", JSON.stringify(this.memoryState, null, 2));
      }
      return this.memoryState;
    } finally {
      await session.close();
    }
  }

  async updateState(event) {
    console.log(`GraphStateManager: updateState called with event:`, JSON.stringify(event, null, 2));
    console.log(`GraphStateManager: connectionStatus = ${this.connectionStatus}`);
    // If we've already determined that Neo4j is not available, use memory state
    if (this.connectionStatus !== 'INITIALIZED' || this.connectionStatus === "CONNECTION_FAILED") {
        console.warn(`GraphStateManager: Operating in fallback mode. State update for event '${event.type || 'unknown'}' will be stored in memory only.`);
        
        // Ensure memory state is initialized before applying the update.
        if (!this.memoryState) {
          // This will initialize memoryState with defaults
          await this.getState(event.project_name || 'default');
        }

        // Now that memoryState is guaranteed to exist, apply the event.
        const projectName = event.project_name || this.memoryState.project_name || 'default';
        Object.assign(this.memoryState, {
          ...event,
          project_name: projectName,
          last_updated: new Date().toISOString(),
          fallback_mode: true
        });
        
        console.debug(`GraphStateManager: Updated memory state for project ${projectName}`, this.memoryState);
        console.log(`GraphStateManager: Emitting stateChanged event`);
        this.emit("stateChanged", this.memoryState);
        return this.memoryState;
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
      console.log(`GraphStateManager: Emitting stateChanged event`);
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
      console.log(`GraphStateManager: Emitting stateChanged event`);
      this.emit("stateChanged", this.memoryState);
      return this.memoryState;
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

  // Write state to file when in fallback mode
  async writeStateToFile(state) {
    console.log(`GraphStateManager: writeStateToFile called with state:`, JSON.stringify(state, null, 2));
    // Only write to file if we're in fallback mode
    if (state.fallback_mode) {
      try {
        // Determine the state file path based on the current working directory
        const stateDir = path.join(this.projectRoot, '.stigmergy', 'state');
        const stateFile = path.join(stateDir, 'current.json');
        
        console.log(`GraphStateManager: Attempting to write state to file: ${stateFile}`);
        console.log(`GraphStateManager: Current working directory: ${this.projectRoot}`);
        
        // Ensure the directory exists
        await fs.ensureDir(stateDir);
        
        // Write the state to the file
        await fs.writeJson(stateFile, state, { spaces: 2 });
        console.log(`GraphStateManager: State written to file: ${stateFile}`);
      } catch (error) {
        console.error("GraphStateManager: Error writing state to file:", error.message);
        console.error("GraphStateManager: Error stack:", error.stack);
      }
    } else {
      console.log("GraphStateManager: Not in fallback mode, not writing state to file");
    }
  }

  async getProjectConfig() {
    // If we've already loaded the project config, return it
    if (this.projectConfig) {
      return this.projectConfig;
    }
    
    // Try to load project-specific configuration
    try {
      // First check for .stigmergy/config.js (new structure)
      let configPath = path.join(this.projectRoot, '.stigmergy', 'config.js');
      
      // If not found, check for .stigmergy-core/config.js (legacy structure)
      if (!fs.existsSync(configPath)) {
        configPath = path.join(this.projectRoot, '.stigmergy-core', 'config.js');
      }
      
      // If still not found, check for .stigmergy/config.json
      if (!fs.existsSync(configPath)) {
        configPath = path.join(this.projectRoot, '.stigmergy', 'config.json');
      }
      
      // If still not found, check for .stigmergy-core/config.json
      if (!fs.existsSync(configPath)) {
        configPath = path.join(this.projectRoot, '.stigmergy-core', 'config.json');
      }
      
      // If we found a config file, load it
      if (fs.existsSync(configPath)) {
        // For .js files, we need to import them dynamically
        if (configPath.endsWith('.js')) {
          // Use dynamic import for ESM compatibility
          const projectConfigModule = await import(`file://${configPath}`);
          const projectConfig = projectConfigModule.default || projectConfigModule;
          this.projectConfig = projectConfig;
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

const stateManagerInstance = new GraphStateManager();
export { GraphStateManager as GraphStateManagerClass }; // Export the class for testing
export default stateManagerInstance; // Export the singleton instance for the app