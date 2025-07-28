const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const fileSystem = require('../tools/file_system');
const shell = require('../tools/shell');
const web = require('../tools/web');
const scraper = require('../tools/scraper');
const research = require('../tools/research'); // <-- ADDED
const gemini_cli_tool = require('../tools/gemini_cli_tool');
const stateManager = require('./state_manager');

// Placeholder for the future Code Intelligence Service
const codeIntelligenceService = require('../services/code_intelligence_service');

const MANIFEST_PATH = path.join(__dirname, '..', '.stigmergy-core', 'system_docs', '02_Agent_Manifest.md');
let agentManifest = null;

async function getManifest() {
  if (!agentManifest) {
    const content = await fs.readFile(MANIFEST_PATH, 'utf8');
    const yamlContent = content.match(/```yaml\n([\s\S]*?)\n```|---\n([\s\S]*?)\n---/);
    agentManifest = yaml.load(yamlContent[1] || yamlContent[2] || content);
  }
  return agentManifest;
}

const system = {
  approve: async () => {
    // This is now handled by the user interacting with the @dispatcher agent.
    // The dispatcher should then call updateStatus.
    // We keep this for potential future direct approval mechanisms.
    console.log("[Tool: system.approve] Execution has been approved by direct tool call.");
    return "Execution approved. The engine will now proceed.";
  },
  updateStatus: async ({ status, message }) => {
    await stateManager.updateStatus(status, message);
    return `System status updated to ${status}.`;
  }
};

const toolbelt = {
  'file_system': fileSystem,
  'shell': shell,
  'web': web,
  'scraper': scraper,
  'research': research, // <-- ADDED
  'code_intelligence': codeIntelligenceService, // <-- ADDED (Placeholder)
  'gemini': gemini_cli_tool,
  'system': system,
};

class PermissionDeniedError extends Error {
  constructor(message) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

async function execute(toolName, args, agentId) {
  const manifest = await getManifest();
  const agentConfig = manifest.agents.find(a => a.id === agentId);

  if (!agentConfig) {
    throw new PermissionDeniedError(`Agent '${agentId}' not found in manifest.`);
  }

  const isPermitted = agentConfig.tools.some(toolPattern => {
    if (toolPattern.endsWith('.*')) {
      return toolName.startsWith(toolPattern.slice(0, -1));
    }
    return toolName === toolPattern;
  });

  if (!isPermitted) {
    throw new PermissionDeniedError(`Agent '${agentId}' is not permitted to use tool '${toolName}'.`);
  }

  const [namespace, functionName] = toolName.split('.');
  if (!toolbelt[namespace] || !toolbelt[namespace][functionName]) {
    throw new Error(`Tool '${toolName}' not found in the toolbelt.`);
  }
  
  const finalArgs = { ...args, agentConfig };

  console.log(`[Tool Executor] Executing '${toolName}' for @${agentId} with args:`, args);
  try {
    const result = await toolbelt[namespace][functionName](finalArgs);
    return JSON.stringify(result, null, 2);
  } catch (e) {
    console.error(`[Tool Executor] Error during '${toolName}' execution: ${e.message}`);
    throw e;
  }
}

module.exports = {
  execute,
};
