const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');
const WebSocket = require('ws');

// ... (import all other tools like fileSystem, shell, etc.)
const fileSystem = require('../tools/file_system');
const shell = require('../tools/shell');
const web = require('../tools/web');
const scraper = require('../tools/scraper');
const codeGraph = require('../tools/code_graph');
const gemini_cli_tool = require('../tools/gemini_cli_tool');

// --- NEW SYSTEM TOOL for @metis ---
const stigmergy = {
    /**
     * Called by the @metis agent to create a self-contained execution blueprint
     * for system improvement proposals.
     * @param {object} args - The arguments object.
     * @param {string} args.filename - The name for the new blueprint file (e.g., "proposal-fix-dev-agent.yml").
     * @param {object} args.blueprint_data - The structured YAML data for the blueprint.
     */
    createBlueprint: async ({ filename, blueprint_data }) => {
        const PROPOSALS_DIR = path.join(process.cwd(), 'system-proposals');
        await fs.ensureDir(PROPOSALS_DIR);

        if (!filename.endsWith('.yml') && !filename.endsWith('.yaml')) {
            filename += '.yml';
        }

        const filePath = path.join(PROPOSALS_DIR, filename);
        const yamlContent = yaml.dump(blueprint_data);

        await fs.writeFile(filePath, yamlContent, 'utf8');

        return `Successfully created new improvement blueprint at '${filePath}'. The user can now choose to execute this plan to upgrade the system.`;
    },
};

const toolbelt = {
  'file_system': fileSystem,
  'shell': shell,
  'web': web,
  'scraper': scraper,
  'code_graph': codeGraph,
  'gemini': gemini_cli_tool, // Added for Gemini Executor
  'stigmergy': stigmergy,     // NEW: Added for @metis
  // ... (the existing `system` tool with `approveExecution` and `requestSecret` remains here)
};

// ... (The rest of the file - getAgentManifest, execute function - remains unchanged)
