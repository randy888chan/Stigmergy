import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { sanitizeToolCall } from "../utils/sanitization.js";
import { readFile, writeFile, listFiles, appendFile } from "../tools/file_system.js";
import * as shell from "../tools/shell.js";
import * as research from "../tools/research.js";
import * as cicd from "../tools/cicd_tool.js";
import * as git from "../tools/git_tool.js";
import * as notifications from "../tools/notification_tool.js";
import * as stateManager from "./state_manager.js";
import * as codeIntelligence from "../tools/code_intelligence.js";
import * as coreTools from "../tools/core_tools.js";
import * as archonTool from "../tools/archon_tool.js";
import * as swarmIntelligence from "../tools/swarm_intelligence_tools.js";
import * as qaTools from "../tools/qa_tools.js";
import { verify_business_alignment } from "../tools/business_verification.js";
import createGuardianTools from "../tools/guardian_tool.js";
import { clearFileCache } from "./llm_adapter.js";
import { withRetry } from '../utils/errorHandler.js';
import ErrorHandler, { OperationalError, ERROR_TYPES } from './error_handling.js';
import { trackToolUsage } from '../services/model_monitoring.js';

const retryableTools = ["research.deep_dive", "code_intelligence.getDefinition", "gemini.execute"];

// Helper to get the core path, respecting test environments
function getCorePath() {
  if (global.StigmergyConfig && global.StigmergyConfig.core_path) {
    return global.StigmergyConfig.core_path;
  }
  return path.join(process.cwd(), ".stigmergy-core");
}

function getManifestPath() {
  return path.join(getCorePath(), "system_docs", "02_Agent_Manifest.md");
}

let agentManifest = null;

async function getManifest() {
  if (agentManifest) {
    return agentManifest;
  }
  const manifestPath = getManifestPath();
  if (!fs.existsSync(manifestPath)) {
    throw new OperationalError(
      `Manifest file not found at ${manifestPath}`,
      ERROR_TYPES.FILE_NOT_FOUND
    );
  }
  const fileContent = await fs.readFile(manifestPath, "utf8");

  const yamlMatch = fileContent.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
  if (!yamlMatch) {
    throw new Error(`Could not parse YAML from manifest file: ${manifestPath}`);
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
    // ADD THIS NEW FUNCTION
    task: async ({ subagent_type, description }) => {
      if (!subagent_type || !description) {
        throw new Error("The 'subagent_type' and 'description' are required for the task tool.");
      }
      // This leverages the existing engine method but exposes it as a formal tool
      const result = await engine.triggerAgent(subagent_type, description);
      return `Task delegated to @${subagent_type}. Result: ${result}`;
    },
  };

  const guardianTools = createGuardianTools(engine);

  const toolbelt = {
    file_system: { readFile, writeFile, listFiles, appendFile },
    shell: shell,
    research: research,
    code_intelligence: codeIntelligence,
    cicd: cicd,
    git: git,
    notifications: notifications,
    system: system,
    stigmergy: stigmergy,
    state_manager: stateManager,
    core: coreTools,
    guardian: guardianTools,
    archon_tool: archonTool,
    swarm_intelligence: swarmIntelligence,
    qa: qaTools,
    business_verification: { verify_business_alignment },
  };

  return async function execute(toolName, args, agentId) {
    const startTime = Date.now();
    try {
      // ... (existing permission checks and sanitization)
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

      // --- START: MODIFICATION ---
      await trackToolUsage({
          toolName,
          success: true,
          agentId,
          executionTime: Date.now() - startTime
      });
      // --- END: MODIFICATION ---

      // ... (existing file cache logic)
      if (toolName.startsWith("file_system.write")) {
        clearFileCache();
      }
      return JSON.stringify(result, null, 2);
    } catch (error) {
      // --- START: MODIFICATION ---
      const processedError = ErrorHandler.process(error, { agentId, toolName });
      await trackToolUsage({
          toolName,
          success: false,
          agentId,
          executionTime: Date.now() - startTime,
          error: processedError.message
      });
      throw processedError; // Re-throw the structured operational error
      // --- END: MODIFICATION ---
    }
  };
}

export function _resetManifestCache() {
  if (process.env.NODE_ENV === "test") {
    agentManifest = null;
  }
}
