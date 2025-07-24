const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');

// Import all existing tools
const fileSystem = require('../tools/file_system');
const shell = require('../tools/shell');
const web = require('../tools/web');
const scraper = require('../tools/scraper');
const codeGraph = require('../tools/code_graph');
const gemini_cli_tool = require('../tools/gemini_cli_tool');

const stateManager = require('./state_manager');

// --- NEW SYSTEM TOOLS ---
const system = {
    /**
     * Called by the @dispatcher agent after interpreting user consent.
     * This action is what moves the project from planning to execution.
     */
    approve: async () => {
        // This function doesn't need to call the API, it can update the state directly.
        await stateManager.updateStatus("EXECUTION_IN_PROGRESS");
        // The engine loop will be restarted by the server after this tool returns.
        // A more robust implementation might use an event emitter here.
        console.log("[Tool: system.approve] Execution has been approved by the user.");
        return "Execution approved. The engine will now proceed with the project plan.";
    }
}

const stigmergy = {
    createBlueprint: async ({ filename, blueprint_data }) => {
        // ... existing implementation
    },
};

const toolbelt = {
  'file_system': fileSystem,
  'shell': shell,
  'web': web,
  'scraper': scraper,
  'code_graph': codeGraph,
  'gemini': gemini_cli_tool,
  'stigmergy': stigmergy,
  'system': system, // NEW: Added the system tool namespace
};

async function execute(toolName, args, agentId) {
    const [namespace, functionName] = toolName.split('.');
    if (!toolbelt[namespace] || !toolbelt[namespace][functionName]) {
        throw new Error(`Tool '${toolName}' not found in the toolbelt.`);
    }

    // TODO: Add manifest-based permission checks here.

    console.log(`[Tool Executor] Executing '${toolName}' for @${agentId} with args:`, args);
    try {
        const result = await toolbelt[namespace][functionName](args);
        return JSON.stringify(result, null, 2);
    } catch (e) {
        console.error(`[Tool Executor] Error during '${toolName}' execution: ${e.message}`);
        throw e; // Re-throw to be caught by the agent runner
    }
}

module.exports = {
  execute,
};
