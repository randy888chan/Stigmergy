import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import * as fileSystem from "../tools/file_system.js";
import * as shell from "../tools/shell.js";
import * as research from "../tools/research.js";
import * as gemini_cli_tool from "../tools/gemini_cli_tool.js";
import * as stateManager from "./state_manager.js";
import * as codeIntelligence from "../tools/code_intelligence.js";
import { clearFileCache } from './llm_adapter.js';

const MANIFEST_PATH = path.join(
  process.cwd(),
  ".stigmergy-core",
  "system_docs",
  "02_Agent_Manifest.md"
);
let agentManifest = null;
async function getManifest() {
  if (!agentManifest) agentManifest = yaml.load(await fs.readFile(MANIFEST_PATH, "utf8"));
  return agentManifest;
}

const system = {
  updateStatus: async ({ status, message, artifact_created }) => {
    await stateManager.updateStatus(status, message, artifact_created);
    return `Status updated to ${status}.`;
  },
  approveExecution: async () => {
    await stateManager.updateStatus('EXECUTION_IN_PROGRESS', 'User approved execution.');
    return 'Execution approved. The engine will now begin executing tasks.';
  },
};

const stigmergy = {
    createBlueprint: async ({ proposal }) => {
        const filePath = path.join(process.cwd(), 'system-proposals', `proposal-${Date.now()}.yml`);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, proposal);
        return `Improvement blueprint created at ${filePath}`;
    }
};

const toolbelt = {
  file_system: fileSystem,
  shell: shell,
  research: research,
  code_intelligence: codeIntelligence,
  gemini: gemini_cli_tool,
  system: system,
  stigmergy: stigmergy,
};

class PermissionDeniedError extends Error {
  constructor(message) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export async function execute(toolName, args, agentId) {
  const manifest = await getManifest();
  const agentConfig = manifest.agents.find((a) => a.id === agentId);
  if (!agentConfig) throw new PermissionDeniedError(`Agent '${agentId}' not found.`);
  
  const isPermitted = (agentConfig.tools || []).some((p) =>
    p.endsWith(".*") ? toolName.startsWith(p.slice(0, -1)) : toolName === p
  );
  if (!isPermitted)
    throw new PermissionDeniedError(`Agent '${agentId}' not permitted for tool '${toolName}'.`);
  
  const [namespace, funcName] = toolName.split(".");
  if (!toolbelt[namespace]?.[funcName]) throw new Error(`Tool '${toolName}' not found.`);
  
  try {
    const result = await toolbelt[namespace][funcName]({ ...args, agentConfig });
    
    if (toolName.startsWith('file_system.write')) {
      clearFileCache();
    }
    
    return JSON.stringify(result, null, 2);
  } catch (e) {
    throw e;
  }
}
