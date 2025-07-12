const fileSystem = require('../tools/file_system');
const shell = require('../tools/shell');
// const codeGraph = require('../tools/code_graph'); // For Stage 2

const toolbelt = {
  'file_system': fileSystem,
  'shell': shell,
  // 'code_graph': codeGraph, // For Stage 2
};

async function execute(toolFullName, args) {
  const [namespace, toolName] = toolFullName.split('.');
  
  if (!toolbelt[namespace] || !toolbelt[namespace][toolName]) {
    throw new Error(`Tool "${toolFullName}" not found.`);
  }

  // Basic security: In a real system, you'd check agent permissions here
  // against the 02_Agent_Manifest.md
  
  return await toolbelt[namespace][toolName](args);
}

module.exports = { execute };
