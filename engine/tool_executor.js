import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { sanitizeToolCall } from "../utils/sanitization.js";
import * as fileSystem from "../tools/file_system.js";
import * as shell from "../tools/shell.js";
import * as research from "../tools/research.js";
// import * as gemini_cli_tool from "../tools/gemini_cli_tool.js";
// import * as business from "../tools/business_tools.js";
import * as cicd from "../tools/cicd_tool.js";
import * as git from "../tools/git_tool.js";
import * as notifications from "../tools/notification_tool.js";
import * as stateManager from "./state_manager.js";
import * as codeIntelligence from "../tools/code_intelligence.js";
import { clearFileCache } from "./llm_adapter.js";
import { OperationalError, ERROR_TYPES, remediationMap, withRetry } from "../utils/errorHandler.js";

const retryableTools = ["research.deep_dive", "code_intelligence.getDefinition", "gemini.execute"];

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
  console.log("fileContent", fileContent);

  const yamlMatch = fileContent.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
  if (!yamlMatch) {
    throw new Error(`Could not parse YAML from manifest file: ${MANIFEST_PATH}`);
  }
  agentManifest = yaml.load(yamlMatch[1]);
  return agentManifest;
}

class PermissionDeniedError extends Error {
  constructor(message) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export function createExecutor(engine) {
  const system = {
    executeCommand: async ({ command }) => {
      const normalized = command.toLowerCase().trim();

      if (normalized.startsWith("start project")) {
        const goal = command.replace(/start project/i, "").trim();
        await stateManager.initializeProject(goal);
        engine.start();
        return `Project started: ${goal}`;
      }

      switch (normalized) {
        case "pause":
        case "stop":
          await engine.stop("Paused by user");
          return "Engine paused";

        case "resume":
        case "continue":
          engine.start();
          return "Engine resumed";

        case "status":
          return stateManager.getState();

        case "help":
          return `Available commands:
          - start project [your goal]
          - pause/stop
          - resume/continue
          - status`;

        default:
          throw new Error(`Unknown command: ${command}`);
      }
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
    // gemini: gemini_cli_tool,
    // business: business,
    cicd: cicd,
    git: git,
    notifications: notifications,
    system: system,
    stigmergy: stigmergy,
    state_manager: stateManager,
  };

  return async function execute(toolName, args, agentId) {
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

      let safeArgs;
      try {
        safeArgs = sanitizeToolCall(toolName, args);
      } catch (sanitizationError) {
        throw new OperationalError(
          "input_sanitization_failed",
          ERROR_TYPES.SECURITY,
          "sanitization_protocol"
        );
      }

      const [namespace, funcName] = toolName.split(".");
      if (!toolbelt[namespace]?.[funcName]) {
        throw new Error(`Tool '${toolName}' not found.`);
      }

      const toolFn = toolbelt[namespace][funcName];
      const shouldRetry = retryableTools.includes(toolName);
      const executor = shouldRetry ? withRetry(toolFn) : toolFn;

      const result = await executor({ ...safeArgs, agentConfig });

      if (toolName.startsWith("file_system.write")) {
        clearFileCache();
      }
      return JSON.stringify(result, null, 2);
    } catch (error) {
      let errorType = ERROR_TYPES.TOOL_EXECUTION;

      if (error.name.includes("Neo4j")) errorType = ERROR_TYPES.DB_CONNECTION;
      if (error.name === "PermissionDeniedError") errorType = ERROR_TYPES.PERMISSION_DENIED;

      if (error instanceof OperationalError) {
        throw error;
      }

      throw new OperationalError(
        error.message, // Keep original message for non-operational errors
        errorType,
        remediationMap[errorType]
      );
    }
  };
}

export function _resetManifestCache() {
  if (process.env.NODE_ENV === "test") {
    agentManifest = null;
  }
}
