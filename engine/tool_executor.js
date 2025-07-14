const fileSystem = require('../tools/file_system');
const shell = require('../tools/shell');
const web = require('../tools/web');
const codeGraph = require('../tools/code_graph'); // For Stage 2

const toolbelt = {
  'file_system': fileSystem,
  'shell': shell,
  'web': web,
  'code_graph': codeGraph, // For Stage 2
};

async function execute(toolFullName, args) {
  if(!toolFullName) {
    throw new Error("Tool name not provided.");
  }
  const [namespace, toolName] = toolFullName.split('.');
  
  if (!toolbelt[namespace] || !toolbelt[namespace][toolName]) {
    throw new Error(`Tool "${toolFullName}" not found in the toolbelt.`);
  }

  // TODO: Implement permission check against .stigmergy-core/system_docs/02_Agent_Manifest.md
  
  return await toolbelt[namespace][toolName](args);
}

module.exports = { execute };
