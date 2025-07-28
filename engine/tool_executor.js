const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const fileSystem = require('../tools/file_system');
const shell = require('../tools/shell');
const research = require('../tools/research'); // <-- UNIFIED RESEARCH TOOL
const gemini_cli_tool = require('../tools/gemini_cli_tool');
const stateManager = require('./state_manager');

// Placeholder for the future Code Intelligence Service
const codeIntelligenceService = require('../services/code_intelligence_service');

const MANIFEST_PATH = path.join(__dirname, '..', '.stigmergy-core', 'system_docs', '02_Agent_Manifest.md');
let agentManifest = null;

async function getManifest() {
  if (!agentManifest) {
    const content = await fs.readFile(MANIFEST_PATH, 'utf8');
    agentManifest = yaml.load(content);
  }
  return agentManifest;
}

const system = {
  // ... (system tool functions remain the same)
  updateStatus: async ({ status, message }) => {
    await stateManager.updateStatus(status, message);
    return `System status updated to ${status}.`;
  }
};

const toolbelt = {
  'file_system': fileSystem,
  'shell': shell,
  'research': research, // <-- THE ONLY RESEARCH TOOL NOW
  'code_intelligence': codeIntelligenceService,
  'gemini': gemini_cli_tool,
  'system': system,
};

// ... (rest of the file remains the same)

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
