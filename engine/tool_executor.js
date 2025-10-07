import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { sanitizeToolCall } from "../utils/sanitization.js";

// Import all tool namespaces
import * as fileSystem from "../tools/file_system.js";
import * as shell from "../tools/shell.js";
import * as research from "../tools/research.js";
import { coderag } from "../tools/coderag_tool.js";
import * as swarmIntelligence from "../tools/swarm_intelligence_tools.js";
import * as qaTools from "../tools/qa_tools.js";
import * as businessVerification from "../tools/business_verification.js";
import createGuardianTools from "../tools/guardian_tool.js";
import * as privilegedCoreTools from "../tools/core_tools.js";
import createSystemTools from "../tools/system_tools.js";
import * as superdesignIntegration from "../tools/superdesign_integration.js";
import * as qwenIntegration from "../tools/qwen_integration.js";
import * as documentIntelligence from "../tools/document_intelligence.js";
import { createChatProcessor } from "../tools/chat_interface.js";
import * as continuousExecution from "../tools/continuous_execution.js";
import { lightweight_archon_query } from "../services/lightweight_archon.js";
import { query_deepwiki } from "../services/deepwiki_mcp.js";

// Import core engine services
import { clearFileCache } from "./llm_adapter.js";
import ErrorHandler, { OperationalError } from "../utils/errorHandler.js";
import { trackToolUsage } from "../services/model_monitoring.js";

// Import trajectory recorder
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

// Helper to parse function parameters more robustly
const getParams = (func) => {
    const funcString = func.toString();
    const match = funcString.match(/\(([^)]*)\)/);
    if (!match) return [];

    const paramsMatch = match[1].match(/\{([^}]+)\}/);
    if (paramsMatch) {
        // Handle destructured object parameters, e.g., ({ path, content })
        return paramsMatch[1].split(',').map(p => p.split(':')[0].split('=')[0].trim());
    }

    // Handle regular parameters, e.g., (toolName, args)
    return match[1].split(',').map(p => p.trim()).filter(Boolean);
};

export function createExecutor(engine, ai, options = {}) {
  const { workingDirectory, config } = options;

  // Create a project-aware wrapper for the file_system toolset
  const projectFileSystem = Object.keys(fileSystem).reduce((acc, key) => {
    acc[key] = (args) => fileSystem[key]({
      ...args,
      projectRoot: engine.projectRoot,
      workingDirectory: workingDirectory, // Pass the sandbox directory
    });
    return acc;
  }, {});

  const toolbelt = {
    file_system: projectFileSystem,
    shell,
    research,
    coderag: coderag,
    swarm_intelligence: swarmIntelligence,
    qa: qaTools,
    business_verification: businessVerification,
    guardian: createGuardianTools(engine),
    core: privilegedCoreTools,
    system: createSystemTools(engine),
    superdesign: superdesignIntegration,
    qwen_integration: qwenIntegration,
    document_intelligence: documentIntelligence,
    chat_interface: { process_chat_command: createChatProcessor(engine.stateManager) },
    continuous_execution: continuousExecution,
    lightweight_archon: { query: lightweight_archon_query },
    deepwiki: { query: query_deepwiki },
stigmergy: {
  task: async ({ subagent_type, description }) => {
    if (!subagent_type || !description) {
      throw new OperationalError("The 'subagent_type' and 'description' arguments are required for stigmergy.task");
    }
    // This now awaits the sub-agent's completion, getting its final response.
    const result = await engine.triggerAgent(subagent_type, description);
    return result || `Task successfully delegated to ${subagent_type}, which returned no final message.`;
  },
},
  };

  const getTools = () => {
    const tools = {};
    for (const namespace in toolbelt) {
      for (const funcName in toolbelt[namespace]) {
        const toolFunc = toolbelt[namespace][funcName];
        const toolName = `${namespace}.${funcName}`;

        const params = getParams(toolFunc);
        const properties = {};
        params.forEach(param => {
          properties[param] = { type: 'string' }; // Assume string for simplicity
        });

        tools[toolName] = {
          description: `A tool for ${funcName} in the ${namespace} category.`, // Generic description
          parameters: {
            type: 'object',
            properties,
            required: params,
          },
        };
      }
    }
    return tools;
  };

  const execute = async (toolName, args, agentId) => {
    engine.broadcastEvent('tool_start', { tool: toolName, args });
    const startTime = Date.now();
    
    const recordingId = trajectoryRecorder.startRecording(`tool_${toolName}`, { toolName, args, agentId });
    
    try {
      const agentDefPath = path.join(getCorePath(), "agents", `${agentId}.md`);
      const agentFileContent = await fs.readFile(agentDefPath, "utf8");
      const yamlMatch = agentFileContent.match(/```yaml\s*([\s\S]*?)```/);
      if (!yamlMatch) throw new Error(`Could not find YAML block in agent definition for: ${agentId}`);
      const agentConfig = yaml.load(yamlMatch[1]).agent;

      const [namespace, funcName] = toolName.split(".");
      if (!toolbelt[namespace] || typeof toolbelt[namespace][funcName] !== 'function') {
        throw new Error(`Tool '${toolName}' not found.`);
      }

      const permittedTools = agentConfig.engine_tools || [];
      const isSystemOrDispatcher = agentId === 'system' || agentId === 'dispatcher';

      const isAuthorized = permittedTools.some(permittedTool => {
        if (permittedTool.endsWith('.*')) {
          const namespace = permittedTool.slice(0, -2);
          return toolName.startsWith(namespace + '.');
        }
        return permittedTool === toolName;
      });

      if (!isSystemOrDispatcher && !isAuthorized) {
        throw new Error(`Tool '${toolName}' is not authorized for agent '${agentId}'.`);
      }

      const safeArgs = sanitizeToolCall(toolName, args)?.arguments || args;
      const toolFunction = toolbelt[namespace][funcName];

      let result;
      // Inject project_root for coderag tools that need it.
      if (namespace === 'coderag') {
          const contextualArgs = { ...safeArgs, project_root: engine.projectRoot };
          result = await toolFunction(contextualArgs);
      } else if (['file_system', 'shell', 'stigmergy'].includes(namespace)) {
        result = await toolFunction(safeArgs);
      } else {
        result = await toolFunction(safeArgs, ai, config);
      }
      
      if (toolName.startsWith("file_system.write")) {
        clearFileCache();
        await triggerContextSummarization(toolName, safeArgs, agentId, engine);
      }
      engine.broadcastEvent('tool_end', { tool: toolName, result: result });
      return JSON.stringify(result, null, 2);

    } catch (error) {
      engine.broadcastEvent('tool_end', { tool: toolName, error: error.message });
      const processedError = ErrorHandler.process(error, { agentId, toolName });
      
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
      try {
        await trajectoryRecorder.finalizeRecording(recordingId);
      } catch (finalizeError) {
        console.error(`[ToolExecutor] Error finalizing trajectory recording: ${finalizeError.message}`);
      }
    }
  };

  return { execute, getTools };
}
