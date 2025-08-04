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
import { EnhancedError, withRetry } from "../utils/errorHandler.js";

const MANIFEST_PATH = path.join(
  process.cwd(),
  ".stigmergy-core",
  "system_docs",
  "02_Agent_Manifest.md"
);
let agentManifest = null;

async function getManifest() {
  if (agentManifest) {
    return agentManifest;
  }
  const fileContent = await fs.readFile(MANIFEST_PATH, "utf8");

  const yamlMatch = fileContent.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
  if (!yamlMatch) {
    throw new Error(`Could not parse YAML from manifest file: ${MANIFEST_PATH}`);
  }
  // yamlMatch[1] is the actual YAML content
  agentManifest = yaml.load(yamlMatch[1]);
  return agentManifest;
}

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
  try {
    const manifest = await getManifest();
    const agentConfig = manifest.agents.find((a) => a.id === agentId);
    if (!agentConfig) {
      throw new PermissionDeniedError(`Agent '${agentId}' not found.`);
    }

    const isPermitted = (agentConfig.tools || []).some((p) =>
      p.endsWith(".*") ? toolName.startsWith(p.slice(0, -1)) : toolName === p
    );
    if (!isPermitted) {
      throw new PermissionDeniedError(`Agent '${agentId}' not permitted for tool '${toolName}'.`);
    }

    const [namespace, funcName] = toolName.split(".");
    if (!toolbelt[namespace]?.[funcName]) {
      throw new Error(`Tool '${toolName}' not found.`);
    }

    const toolFn = withRetry(toolbelt[namespace][funcName]);
    const result = await toolFn({ ...args, agentConfig });

    if (toolName.startsWith("file_system.write")) {
      clearFileCache();
    }

    return JSON.stringify(result, null, 2);
  } catch (error) {
    const remediationMap = {
      Neo4jConnectionError: "Run `npm run test:neo4j` to diagnose database connection",
      MissingApiKeyError: `Add ${error.key_name} to your .env file`,
      PermissionDeniedError: "Check agent permissions in manifest",
    };

    throw new EnhancedError(
      error.message,
      error.name,
      remediationMap[error.name] || "Check logs and report issue"
    );
  }
}
