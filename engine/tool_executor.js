import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { sanitizeToolCall } from "../utils/sanitization.js";
import config from "../stigmergy.config.js";

// Import all tool namespaces
import * as fileSystem from "../tools/file_system.js";
import * as shell from "../tools/shell.js";
import * as research from "../tools/research.js";
import * as coderag from "../tools/coderag_tool.js";
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
import * as git_tool from "../tools/git_tool.js";

// Import core engine services
import { clearFileCache } from "./llm_adapter.js";
import ErrorHandler, { OperationalError } from "../utils/errorHandler.js";
import { trackToolUsage } from "../services/model_monitoring.js";

// Import trajectory recorder
import trajectoryRecorder from "../services/trajectory_recorder.js";

// ====================================================================================
// START: Centralized Path Resolution & Security Logic
// This logic was moved from `tools/file_system.js` to make the `tool_executor` the
// single security guard for all file system operations, enforcing the Single
// Responsibility Principle.
// ====================================================================================

const SAFE_DIRECTORIES = config.security?.allowedDirs || [
  "src",
  "public",
  "docs",
  "tests",
  "scripts",
  ".ai",
  "services",
  "engine",
  "stories",
  "system-proposals",
];

function resolvePath(filePath, projectRoot, workingDirectory, fsProvider = fs) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid file path provided");
  }

  const baseDir = workingDirectory || projectRoot || process.cwd();

  if (filePath.includes("..")) {
    throw new Error(`Security violation: Path traversal attempt ("..") in path "${filePath}"`);
  }

  const resolved = path.resolve(baseDir, filePath);

  const projectScope = projectRoot || process.cwd();
  if (!resolved.startsWith(projectScope)) {
      throw new Error(`Security violation: Path "${filePath}" resolves outside the project scope.`);
  }

  if (workingDirectory && !resolved.startsWith(workingDirectory)) {
      throw new Error(`Security violation: Path "${filePath}" attempts to escape the agent's sandbox.`);
  }

  if (!workingDirectory) {
    // --- ADD THIS NEW BLOCK ---
    if (config.security?.generatedPaths) {
      const projectScope = projectRoot || process.cwd();
      const resolved = path.resolve(projectScope, filePath);
      const relativeToProject = path.relative(projectScope, resolved);

      const isGenerated = config.security.generatedPaths.some(p => relativeToProject.startsWith(p));
      if (isGenerated) {
        // Throw a specific, educational error that reinforces the Constitution.
        throw new Error(`Security violation: Path "${filePath}" is inside a protected 'generated' directory. Per the Constitution, agents must only edit SOURCE files and then use the 'build.rebuild_dashboard' tool.`);
      }
    }
    // --- END OF NEW BLOCK ---

    const relative = path.relative(projectScope, resolved);
    const isSafe = relative === '' || SAFE_DIRECTORIES.some(dir => relative.startsWith(dir + path.sep) || relative === dir);
    const rootDir = relative.split(path.sep)[0] || relative;

    // Allow .stigmergy-core to bypass the SAFE_DIRECTORIES check,
    // as it will be handled by the more specific Guardian Protocol check later.
    if (!isSafe && rootDir !== '.stigmergy-core') {
      throw new Error(`Access restricted to ${rootDir} directory`);
    }
  }

  if (config.security?.maxFileSizeMB) {
    let stats;
    try {
      stats = fsProvider.statSync(resolved);
    } catch (e) {
      // File doesn't exist yet, skip size check
    }

    if (stats) {
      const maxBytes = config.security.maxFileSizeMB * 1024 * 1024;
      if (stats.size > maxBytes) {
        throw new Error(`File exceeds size limit of ${config.security.maxFileSizeMB}MB`);
      }
    }
  }

  return resolved;
}

// ====================================================================================
// END: Centralized Path Resolution & Security Logic
// ====================================================================================


function getCorePath() {
  if (process.env.STIGMERGY_CORE_PATH) {
    return process.env.STIGMERGY_CORE_PATH;
  }
  
  const defaultPath = path.join(process.cwd(), ".stigmergy-core");
  
  if (!fs.existsSync(defaultPath)) {
    throw new Error(
      `.stigmergy-core directory not found at ${defaultPath}. ` +
      `Please run 'npx stigmergy install' or set STIGMERGY_CORE_PATH.`
    );
  }
  
  return defaultPath;
}

let agentManifest = null;

async function getManifest() {
  if (agentManifest) return agentManifest;
  const manifestPath = path.join(getCorePath(), "system_docs", "02_Agent_Manifest.md");
  const fileContent = await fs.readFile(manifestPath, "utf8");
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

async function triggerContextSummarization(toolName, args, agentId, engine) {
    // ... (implementation unchanged)
}

const getParams = (func) => {
    const funcString = func.toString();
    const match = funcString.match(/\(([^)]*)\)/);
    if (!match) return [];

    const paramsMatch = match[1].match(/\{([^}]+)\}/);
    if (paramsMatch) {
        // Handle destructured parameters, ignoring default values
        return paramsMatch[1].split(',').map(p => p.split('=')[0].trim());
    }

    // Handle regular parameters, ignoring default values
    return match[1].split(',').map(p => p.split('=')[0].trim()).filter(Boolean);
};

export function createExecutor(engine, ai, options = {}) {
  const { workingDirectory, config: engineConfig } = options;

  const toolbelt = {
    file_system: fileSystem, // Using the "dumb" tools directly now
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
    git_tool: git_tool,
    stigmergy: {
      task: async ({ subagent_type, description }) => {
        if (!subagent_type || !description) {
          throw new OperationalError("The 'subagent_type' and 'description' arguments are required for stigmergy.task");
        }
        const result = await engine.triggerAgent(subagent_type, description);
        return result || `Task successfully delegated to ${subagent_type}, which returned no final message.`;
      },
    },
  };

  const getTools = () => {
      // ... (implementation unchanged)
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

      // --- START: Centralized Security Check & Guardian Protocol ---
      const fsProvider = engine._test_fs; // For testing with memfs
      if (namespace === 'file_system') {
        const pathKey = args.path !== undefined ? 'path' : 'directory';
        const originalPath = args[pathKey] ?? '.';
        const resolvedPath = resolvePath(originalPath, engine.projectRoot, workingDirectory, fsProvider);
        args[pathKey] = resolvedPath; // Overwrite the argument with the resolved, secure path.

        // Guardian Protocol: Prevent unauthorized writes to .stigmergy-core
        if (funcName === 'writeFile' || funcName === 'appendFile') {
          const corePath = getCorePath();
          if (resolvedPath.startsWith(corePath)) {
            if (agentId !== '@guardian' && agentId !== '@metis') {
              throw new OperationalError(`Security Violation: Only the @guardian or @metis agents may modify core system files. Agent '${agentId}' is not authorized.`);
            }
          }
        }
      } else if (namespace === 'git_tool' && funcName === 'init') {
        const originalPath = args.path ?? '.';
        args.path = resolvePath(originalPath, engine.projectRoot, workingDirectory, fsProvider);
      }
      // --- END: Centralized Security Check & Guardian Protocol ---

      const permittedTools = agentConfig.engine_tools || [];
      const isSystemOrDispatcher = agentId === 'system' || agentId === 'dispatcher';

      const isAuthorized = permittedTools.some(permittedTool => {
        if (permittedTool.endsWith('.*')) {
          const ns = permittedTool.slice(0, -2);
          return toolName.startsWith(ns + '.');
        }
        return permittedTool === toolName;
      });

      if (!isSystemOrDispatcher && !isAuthorized) {
        throw new Error(`Tool '${toolName}' is not authorized for agent '${agentId}'.`);
      }

      const safeArgs = sanitizeToolCall(toolName, args)?.arguments || args;
      const toolFunction = toolbelt[namespace][funcName];

      let result;
      if (namespace === 'coderag') {
          const contextualArgs = { ...safeArgs, project_root: engine.projectRoot };
          result = await toolFunction(contextualArgs);
      } else if (namespace === 'file_system') {
          // The "dumb" fs tools now just need the args and the fs provider for tests.
          result = await toolFunction(safeArgs, fsProvider);
      } else if (namespace === 'git_tool' && funcName === 'commit') {
          const contextualArgs = { ...safeArgs, workingDirectory: workingDirectory };
          result = await toolFunction(contextualArgs);
      } else if (namespace === 'shell') {
          // For the shell tool, we inject the agent's sandbox as the current working directory.
          const contextualArgs = { ...safeArgs, cwd: workingDirectory };
          result = await toolFunction(contextualArgs);
      } else if (['stigmergy'].includes(namespace)) {
          result = await toolFunction(safeArgs);
      } else {
          result = await toolFunction(safeArgs, agentId, ai, engineConfig);
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