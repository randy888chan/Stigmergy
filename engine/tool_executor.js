import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import * as fileSystem from "../tools/file_system.js";
import * as shell from "../tools/shell.js";
import * as research from "../tools/research.js";
import * as gemini_cli_tool from "../tools/gemini_cli_tool.js";
import * as business from "../tools/business_tools.js";
import * as stateManager from "./state_manager.js";
import * as codeIntelligence from "../tools/code_intelligence.js";
import { clearFileCache } from "./llm_adapter.js";

const MANIFEST_PATH = path.join(
  process.cwd(),
  ".stigmergy-core",
  "system_docs",
  "02_Agent_Manifest.md"
);
let agentManifest = null;

// --- DEFINITIVE FIX: Correctly parse YAML from within a Markdown file ---
async function getManifest() {
  if (agentManifest) {
    return agentManifest;
  }
  const fileContent = await fs.readFile(MANIFEST_PATH, "utf8");

  let yamlContent;

  // Check if the file is using Markdown-style code fences
  if (fileContent.trim().startsWith("```")) {
    // Use a regex to extract content between ```yml and ```
    const yamlMatch = fileContent.match(/```(?:yaml|yml)\n([\s\S]*?)\n```/);
    if (yamlMatch && yamlMatch[1]) {
      yamlContent = yamlMatch[1]; // Use the captured group
    } else {
      throw new Error(
        `Found a YAML code fence in ${MANIFEST_PATH}, but could not parse its content. Check for a closing fence.`
      );
    }
  } else {
    // If no fences, assume the entire file is YAML
    yamlContent = fileContent;
  }

  if (!yamlContent) {
    throw new Error(`No YAML content could be extracted from the manifest at ${MANIFEST_PATH}`);
  }

  // Now, load the extracted YAML content
  agentManifest = yaml.load(yamlContent);
  return agentManifest;
}
// --------------------------------------------------------------------

const system = {
  updateStatus: async ({ status, message, artifact_created }) => {
    await stateManager.updateStatus({ newStatus: status, message, artifact_created });
    return `Status updated to ${status}.`;
  },
  approveExecution: async () => {
    await stateManager.updateStatus({
      newStatus: "EXECUTION_IN_PROGRESS",
      message: "User approved execution.",
    });
    return "Execution approved. The engine will now begin executing tasks.";
  },
};

const stigmergy = {
  createBlueprint: async ({ proposal }) => {
    const filePath = path.join(process.cwd(), "system-proposals", `proposal-${Date.now()}.yml`);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, proposal);
    return `Improvement blueprint created at ${filePath}`;
  },
};

const toolbelt = {
  file_system: fileSystem,
  shell: shell,
  research: research,
  code_intelligence: codeIntelligence,
  gemini: gemini_cli_tool,
  business: business,
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

    if (toolName.startsWith("file_system.write")) {
      clearFileCache();
    }

    return JSON.stringify(result, null, 2);
  } catch (e) {
    throw e;
  }
}
