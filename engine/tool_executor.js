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
import createSystemTools from "../tools/system_tools.js";
import * as mcpCodeSearch from "../tools/mcp_code_search.js";
import * as superdesignIntegration from "../tools/superdesign_integration.js";
import * as qwenIntegration from "../tools/qwen_integration.js";
import * as documentIntelligence from "../tools/document_intelligence.js";
import * as chatInterface from "../tools/chat_interface.js";
import * as continuousExecution from "../tools/continuous_execution.js";
import { lightweight_archon_query } from "../services/lightweight_archon.js";
import { initialize_coderag, semantic_search } from "../services/coderag_integration.js";
import { query_deepwiki } from "../services/deepwiki_mcp.js";

// Import core engine services
import { clearFileCache } from "./llm_adapter.js";
import ErrorHandler, { OperationalError } from "../utils/errorHandler.js";
import { trackToolUsage } from "../services/model_monitoring.js";
import trajectoryRecorder from "../services/trajectory_recorder.js";

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

/**
 * Trigger context summarization after writeFile operations
 * Implements the concise memory strategy to prevent context overflow
 */
async function triggerContextSummarization(toolName, args, agentId, engine) {
  try {
    // Only trigger summarization if the feature is enabled
    const isMemoryManagementEnabled = process.env.MEMORY_CONCISE_SUMMARIZATION === 'true' || 
                                     (global.StigmergyConfig && global.StigmergyConfig.features && global.StigmergyConfig.features.memoryManagement);
    
    if (!isMemoryManagementEnabled) {
      return;
    }
    
    // Get the file path that was written
    const filePath = args.file_path || args.path;
    if (!filePath) {
      return;
    }
    
    console.log(`[MemoryManagement] Triggering context summarization for file: ${filePath}`);
    
    // Get the @system agent to perform summarization
    const systemAgent = engine.getAgent('system');
    
    // Create a summarization prompt
    const summarizationPrompt = `Please create a concise summary of the work completed in the file: ${filePath}
    
    This summary will replace the detailed conversation history to prevent context overflow.
    
    Include:
    1. What was implemented or modified
    2. Key functionality added
    3. Important design decisions
    4. Any dependencies or related components
    
    Keep the summary focused and technical.`;
    
    // Trigger the system agent to create a summary
    const summaryResult = await engine.triggerAgent(systemAgent, summarizationPrompt);
    
    // In a full implementation, we would store this summary and use it to replace
    // conversation history in subsequent iterations
    console.log(`[MemoryManagement] Context summary created for ${filePath}`);
    
  } catch (error) {
    console.warn(`[MemoryManagement] Failed to trigger context summarization: ${error.message}`);
    // Don't let summarization failures break the main workflow
  }
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
    system: createSystemTools(engine), // Add this line
    mcp_code_search: mcpCodeSearch,
    superdesign: superdesignIntegration,
    qwen_integration: qwenIntegration,
    document_intelligence: documentIntelligence,
    chat_interface: chatInterface,
    continuous_execution: continuousExecution,
    lightweight_archon: { query: lightweight_archon_query },
    coderag: { initialize: initialize_coderag, semantic_search },
    deepwiki: { query: query_deepwiki },
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
    
    // Start trajectory recording for this tool call
    const recordingId = trajectoryRecorder.startRecording(`tool_${toolName}`, {
      toolName,
      args,
      agentId
    });
    
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
      
      // Record the tool call
      trajectoryRecorder.logToolCall(recordingId, {
        toolName,
        namespace,
        funcName,
        args: safeArgs,
        agentId,
        agentConfig: {
          id: agentConfig.id,
          alias: agentConfig.alias,
          model_tier: agentConfig.model_tier
        }
      });

      const result = await toolbelt[namespace][funcName]({ ...safeArgs, agentConfig });

      await trackToolUsage({
        toolName,
        success: true,
        agentId,
        executionTime: Date.now() - startTime,
      });

      // Record the successful tool execution
      trajectoryRecorder.logEvent(recordingId, 'tool_execution_success', {
        toolName,
        result: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        executionTime: Date.now() - startTime
      });

      if (toolName.startsWith("file_system.write")) {
        clearFileCache();
        // Trigger context summarization after writeFile operations for memory management
        await triggerContextSummarization(toolName, safeArgs, agentId, engine);
      }
      return JSON.stringify(result, null, 2);

    } catch (error) {
      const processedError = ErrorHandler.process(error, { agentId, toolName });
      
      // Record the tool execution error
      trajectoryRecorder.logEvent(recordingId, 'tool_execution_error', {
        toolName,
        error: processedError.message,
        stack: processedError.stack,
        executionTime: Date.now() - startTime
      });
      
      await trackToolUsage({
        toolName,
        success: false,
        agentId,
        executionTime: Date.now() - startTime,
        error: processedError.message,
      });
      throw processedError;
    } finally {
      // Finalize the recording
      try {
        await trajectoryRecorder.finalizeRecording(recordingId);
      } catch (finalizeError) {
        console.error(`[ToolExecutor] Error finalizing trajectory recording: ${finalizeError.message}`);
      }
    }
  };
}
