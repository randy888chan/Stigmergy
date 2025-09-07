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
import * as documentIntelligence from "../tools/document_intelligence.js";
import * as chatInterface from "../tools/chat_interface.js";
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
  // Updated regex to match the pattern used in server.js for consistency
  const yamlMatch = fileContent.match(/```yaml\s*([\s\S]*?)```/);
  if (!yamlMatch) {
    throw new Error(`Could not find YAML block in manifest file: ${manifestPath}`);
  }
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
    document_intelligence: documentIntelligence,
    chat_interface: chatInterface,
    lightweight_archon: { query: lightweight_archon_query },
    coderag: { initialize: initialize_coderag, semantic_search },
    stigmergy: {
      task: async ({ subagent_type, description }) => {
        if (!subagent_type || !description) {
          throw new Error("The 'subagent_type' and 'description' are required for stigmergy.task");
        }
        // Get the agent object from the engine
        const agent = engine.getAgent(subagent_type);
        return await engine.triggerAgent(agent, description);
      },
    },
  };

  return async function execute(toolName, args, agentId) {
    const startTime = Date.now();
    try {
      const agentDefPath = path.join(getCorePath(), "agents", `${agentId}.md`);
      const agentFileContent = await fs.readFile(agentDefPath, "utf8");
      // Updated regex to match the pattern used in server.js for consistency
      const yamlMatch = agentFileContent.match(/```yaml\s*([\s\S]*?)```/);
      if (!yamlMatch) {
        throw new Error(`Could not find YAML block in agent definition for: ${agentId}`);
      }
      const agentConfig = yaml.load(yamlMatch[1]).agent;

      const [namespace, funcName] = toolName.split(".");

      if (!toolbelt[namespace] || typeof toolbelt[namespace][funcName] !== 'function') {
        throw new Error(`Tool '${toolName}' not found or is not a function in the engine toolbelt.`);
      }

      const permittedTools = agentConfig.engine_tools || [];
      
      // Special handling for system and dispatcher agents
      const isSystemOrDispatcher = agentId === 'system' || agentId === 'dispatcher';
      
      // Wildcard permission check
      const hasWildcardPermission = permittedTools.some(p => p === '*');
      
      // Specific permission check
      const isPermitted = hasWildcardPermission || 
                         isSystemOrDispatcher ||
                         permittedTools.some(p => {
                           if (p.endsWith('.*')) {
                             // Handle namespace wildcards
                             const namespace = p.replace('.*', '');
                             return toolName.startsWith(namespace);
                           }
                           // Handle exact matches
                           return toolName === p;
                         });
      
      if (!isPermitted) {
        throw new OperationalError(
          `Agent '${agentId}' not permitted for engine tool '${toolName}'. ` +
          `Permitted tools: [${permittedTools.join(', ')}].`,
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