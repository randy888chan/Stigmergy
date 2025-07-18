const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const fileSystem = require('../tools/file_system');
const shell = require('../tools/shell');
const web = require('../tools/web');
const scraper = require('../tools/scraper');
const codeGraph = require('../tools/code_graph');

const toolbelt = {
  'file_system': fileSystem,
  'shell': shell,
  'web': web,
  'scraper': scraper,
  'code_graph': codeGraph,
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
