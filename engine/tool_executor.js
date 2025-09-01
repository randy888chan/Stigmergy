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
import * as mcpCodeSearch from "../tools/mcp_code_search.js";
import * as superdesignIntegration from "../tools/superdesign_integration.js";
import * as qwenIntegration from "../tools/qwen_integration.js";
import { lightweight_archon_query } from "../services/lightweight_archon.js";
import { initialize_coderag, semantic_search } from "../services/coderag_integration.js";

// Import core engine services
import { clearFileCache } from "./llm_adapter.js";
import ErrorHandler, { OperationalError } from "../utils/errorHandler.js";
import { trackToolUsage } from "../services/model_monitoring.js";

function getCorePath() {
  // Priority order for core path resolution:
  // 1. Global test config (for tests)
  // 2. Global production config
  // 3. Environment variable
  // 4. Default path
  
  if (global.StigmergyConfig && global.StigmergyConfig.core_path) {
    return global.StigmergyConfig.core_path;
  }
  
  if (process.env.STIGMERGY_CORE_PATH) {
    return process.env.STIGMERGY_CORE_PATH;
  }
  
  const defaultPath = path.join(process.cwd(), ".stigmergy-core");
  
  // Verify the path exists
  if (!fs.existsSync(defaultPath)) {
    throw new Error(
      `.stigmergy-core directory not found at ${defaultPath}. ` +
      `Please run 'npx stigmergy install' or check your STIGMERGY_CORE_PATH environment variable.`
    );
  }
  
  return defaultPath;
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
    mcp_code_search: mcpCodeSearch,
    superdesign: superdesignIntegration,
    qwen_integration: qwenIntegration,
    lightweight_archon: { query: lightweight_archon_query },
    coderag: { initialize: initialize_coderag, semantic_search },
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

      const [namespace, funcName] = toolName.split(".");

      if (!toolbelt[namespace] || typeof toolbelt[namespace][funcName] !== 'function') {
        throw new Error(`Tool '${toolName}' not found or is not a function in the engine toolbelt.`);
      }

      const permittedTools = agentConfig.engine_tools || [];
      const isPermitted = permittedTools.some(p => toolName.startsWith(p.replace(".*", "")));
      if (!isPermitted) {
        throw new OperationalError(
          `Agent '${agentId}' not permitted for engine tool '${toolName}'.`,
          "PermissionDenied"
        );
      }

      const safeArgs = sanitizeToolCall(toolName, args);

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
