const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios'); // For internal API calls
const fileSystem = require('../tools/file_system');
const shell = require('../tools/shell');
const web = require('../tools/web');
const scraper = require('../tools/scraper');
const codeGraph = require('../tools/code_graph');

// NEW: System tool for internal agent-to-engine communication
const system = {
    /**
     * Called by the @saul agent to signal user consent. Makes an API call
     * to the engine's own endpoint to trigger the state change.
     */
    approveExecution: async () => {
        const port = process.env.PORT || 3000;
        try {
            await axios.post(`http://localhost:${port}/api/system/approve-execution`);
            return "Execution approval has been signaled to the engine.";
        } catch (error) {
            console.error("System tool 'approveExecution' failed:", error.message);
            return "Failed to signal execution approval to the engine.";
        }
    },

    /**
     * Called by any agent that needs a secret. This throws a special error
     * that the main engine loop is designed to catch, pausing the system
     * and triggering a request to the user via the IDE.
     */
    requestSecret: async ({ reason, key_name }) => {
        const err = new Error(reason);
        err.name = "MissingSecretError";
        err.key_name = key_name; // The engine uses this to tell the user WHAT key is needed
        throw err;
    },
};

const toolbelt = {
  'file_system': fileSystem,
  'shell': shell,
  'web': web,
  'scraper': scraper,
  'code_graph': codeGraph,
  'system': system
};

const MANIFEST_PATH = path.join(__dirname, '..', '.stigmergy-core', 'system_docs', '02_Agent_Manifest.md');
let agentManifest = null;

async function getAgentManifest() {
    if (!agentManifest) {
        const manifestContent = await fs.readFile(MANIFEST_PATH, 'utf-8');
        agentManifest = yaml.load(manifestContent);
    }
    return agentManifest;
}

async function execute(toolFullName, args, agentId) {
  if(!toolFullName) {
    throw new Error("Tool name not provided.");
  }
  const [namespace, toolName] = toolFullName.split('.');

  if (!toolbelt[namespace] || !toolbelt[namespace][toolName]) {
    throw new Error(`Tool "${toolFullName}" not found in the toolbelt.`);
  }

  const manifest = await getAgentManifest();
  const agentConfig = manifest.agents.find(a => a.id === agentId);

  if (!agentConfig) {
      throw new Error(`Agent with ID '${agentId}' not found in manifest. Cannot execute tool.`);
  }
  if (!agentConfig.tools?.includes(toolFullName)) {
      throw new Error(`Agent '${agentId}' is not authorized to use tool '${toolFullName}'.`);
  }
  if (toolFullName === 'shell.execute') {
      const permittedCommands = agentConfig.permitted_shell_commands || [];
      if (!permittedCommands.includes(args.command)) {
          throw new Error(`Agent '${agentId}' is not authorized to execute the command: "${args.command}"`);
      }
  }

  return await toolbelt[namespace][toolName](args);
}

module.exports = { execute };
