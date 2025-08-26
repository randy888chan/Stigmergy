import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { sanitizeToolCall } from "../utils/sanitization.js";

// Import all tool namespaces
import * as fileSystem from "../tools/file_system.js";
import * as shell from "../tools/shell.js";
import * as research from "../tools/research.js";
import * as codeIntelligence from "../tools/code_intelligence.js";
import * as swarmIntelligence from "../tools/swarm_intelligence_tools.js";
import * as qaTools from "../tools/qa_tools.js";
import * as businessVerification from "../tools/business_verification.js";
import createGuardianTools from "../tools/guardian_tool.js";
import * as privilegedCoreTools from "../tools/core_tools.js";
import { createSystemControlTools } from "../tools/core_tools.js";

// Import core engine services
import { clearFileCache } from "./llm_adapter.js";
import ErrorHandler, { OperationalError } from "../utils/errorHandler.js";
import { trackToolUsage } from "../services/model_monitoring.js";

function getCorePath() {
  if (global.StigmergyConfig && global.StigmergyConfig.core_path) {
    return global.StigmergyConfig.core_path;
  }
  return path.join(process.cwd(), ".stigmergy-core");
}

let agentManifest = null;

async function getManifest() {
  if (agentManifest) return agentManifest;
  const manifestPath = path.join(getCorePath(), "system_docs", "02_Agent_Manifest.md");
  const fileContent = await fs.readFile(manifestPath, "utf8");
  const yamlMatch = fileContent.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
  agentManifest = yaml.load(yamlMatch[1]);
  return agentManifest;
}

export function _resetManifestCache() {
  agentManifest = null;
}

export function createExecutor(engine) {
  const toolbelt = {
    file_system: fileSystem,
    shell,
    research,
    code_intelligence: codeIntelligence,
    swarm_intelligence: swarmIntelligence,
    qa: qaTools,
    business_verification: businessVerification,
    guardian: createGuardianTools(engine),
    core: privilegedCoreTools, // For @guardian
    system: createSystemControlTools(engine), // For @system
    stigmergy: {
      task: async ({ subagent_type, description }) => {
        if (!subagent_type || !description) {
          throw new Error("The 'subagent_type' and 'description' are required for stigmergy.task");
        }
        return await engine.triggerAgent(subagent_type, description);
      },
    },
  };

  return async function execute(toolName, args, agentId) {
    const startTime = Date.now();
    try {
      const agentDefPath = path.join(getCorePath(), "agents", `${agentId}.md`);
      const agentFileContent = await fs.readFile(agentDefPath, "utf8");
      const yamlMatch = agentFileContent.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
      const agentConfig = yaml.load(yamlMatch[1]).agent;

      const permittedTools = agentConfig.engine_tools || [];
      const isPermitted = permittedTools.some(p => toolName.startsWith(p.replace(".*", "")));
      if (!isPermitted) {
        throw new OperationalError(
          `Agent '${agentId}' not permitted for engine tool '${toolName}'.`,
          "PermissionDenied"
        );
      }

      const safeArgs = sanitizeToolCall(toolName, args);
      const [namespace, funcName] = toolName.split(".");

      if (!toolbelt[namespace] || typeof toolbelt[namespace][funcName] !== 'function') {
        throw new Error(`Tool '${toolName}' not found or is not a function in the engine toolbelt.`);
      }

      const result = await toolbelt[namespace][funcName]({ ...safeArgs, agentConfig });

      await trackToolUsage({
        toolName,
        success: true,
        agentId,
        executionTime: Date.now() - startTime,
      });

      if (toolName.startsWith("file_system.write")) clearFileCache();
      return JSON.stringify(result, null, 2);

    } catch (error) {
      const processedError = ErrorHandler.process(error, { agentId, toolName });
      await trackToolUsage({
        toolName,
        success: false,
        agentId,
        executionTime: Date.now() - startTime,
        error: processedError.message,
      });
      throw processedError;
    }
  };
}