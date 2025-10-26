import chalk from "chalk";
import { promises as fs } from "fs";
import path from "path";
import yaml from "js-yaml";
import { sanitizeToolCall } from "../utils/sanitization.js";
import config from "../stigmergy.config.js";
import { cachedQuery } from "../utils/queryCache.js";

// Import all tool namespaces
import * as fileSystem from "../tools/file_system.js";
import * as shell from "../tools/shell.js";
import * as research from "../tools/research.js";
// import * as coderag from "../tools/coderag_tool.js"; // Defer import
import * as swarmIntelligence from "../tools/swarm_intelligence_tools.js";
import * as qaTools from "../tools/qa_tools.js";
import * as businessVerification from "../tools/business_verification.js";
// import createGuardianTools from "../tools/guardian_tool.js"; // Defer import
import * as privilegedCoreTools from "../tools/core_tools.js";
// import createSystemTools from "../tools/system_tools.js"; // Defer import
import * as superdesignIntegration from "../tools/superdesign_integration.js";
import * as qwenIntegration from "../tools/qwen_integration.js";
import * as documentIntelligence from "../tools/document_intelligence.js";
import { createChatProcessor } from "../tools/chat_interface.js";
import * as continuousExecution from "../tools/continuous_execution.js";
import { lightweight_archon_query } from "../services/lightweight_archon.js";
import { query_deepwiki } from "../services/deepwiki_mcp.js";
import * as git_tool from "../tools/git_tool.js";
import * as github_tool from "../tools/github_tool.js";

// Import core engine services
import { clearFileCache } from "./llm_adapter.js";
import ErrorHandler, { OperationalError } from "../utils/errorHandler.js";
import { trackToolUsage } from "../services/model_monitoring.js";
import { trace, SpanStatusCode } from "@opentelemetry/api";

// ====================================================================================
// START: Centralized Path Resolution & Security Logic
// ====================================================================================

function resolvePath(filePath, projectRoot, workingDirectory, fsProvider = fs) {
  // DEFINITIVE FIX: Define SAFE_DIRECTORIES inside the function to respect test mocks.
  // This prevents the value from being cached at the module level.
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

  if (!filePath || typeof filePath !== "string") {
    throw new OperationalError("Invalid file path provided");
  }

  const baseDir = workingDirectory || projectRoot || process.cwd();

  // Security Check 1: Prevent path traversal.
  if (filePath.includes("..")) {
    throw new OperationalError(
      `Security violation: Path traversal attempt ("..") in path "${filePath}"`
    );
  }

  const resolvedPath = path.resolve(baseDir, filePath);
  const projectScope = projectRoot || process.cwd();

  // Security Check 2: Ensure path is within the project scope.
  if (!resolvedPath.startsWith(projectScope)) {
    throw new OperationalError(
      `Security violation: Path "${filePath}" resolves outside the project scope.`
    );
  }

  // Security Check 3: If in a sandbox, ensure path is within the sandbox.
  if (workingDirectory && !resolvedPath.startsWith(workingDirectory)) {
    throw new OperationalError(
      `Security violation: Path "${filePath}" attempts to escape the agent's sandbox.`
    );
  }

  // Security Check 4: Check against generated and unsafe directories, ONLY if not in a sandbox.
  if (!workingDirectory) {
    const relativeToProject = path.relative(projectScope, resolvedPath);

    // Check against generated paths first.
    if (config.security?.generatedPaths) {
      const isGenerated = config.security.generatedPaths.some((p) =>
        relativeToProject.startsWith(p)
      );
      if (isGenerated) {
        throw new OperationalError(
          `Security violation: Path "${filePath}" is inside a protected 'generated' directory. Per the Constitution, agents must only edit SOURCE files and then use the 'build.rebuild_dashboard' tool.`
        );
      }
    }

    // Check against safe directories.
    // Allow access to the project root itself.
    if (relativeToProject !== "") {
      const isCoreFile = relativeToProject.startsWith(".stigmergy-core");
      const isSafeDir = SAFE_DIRECTORIES.some(
        (dir) => relativeToProject.startsWith(dir + path.sep) || relativeToProject === dir
      );

      if (!isCoreFile && !isSafeDir) {
        const rootDir = relativeToProject.split(path.sep)[0];
        throw new OperationalError(
          `Access restricted to unsafe directory "${rootDir}". Please use one of the allowed directories: ${SAFE_DIRECTORIES.join(", ")}`
        );
      }
    }
  }

  // Security Check 5: Check file size limit.
  if (config.security?.maxFileSizeMB) {
    let stats;
    try {
      stats = fsProvider.statSync(resolvedPath);
      if (stats) {
        const maxBytes = config.security.maxFileSizeMB * 1024 * 1024;
        if (stats.size > maxBytes) {
          throw new OperationalError(
            `File exceeds size limit of ${config.security.maxFileSizeMB}MB`
          );
        }
      }
    } catch (e) {
      // File doesn't exist yet, skip size check.
    }
  }

  return resolvedPath;
}

// ====================================================================================
// END: Centralized Path Resolution & Security Logic
// ====================================================================================

let agentManifest = null;

async function getManifest(corePath) {
  if (agentManifest) return agentManifest;
  const manifestPath = path.join(corePath, "system_docs", "02_Agent_Manifest.md");
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
    return paramsMatch[1].split(",").map((p) => p.split("=")[0].trim());
  }
  return match[1]
    .split(",")
    .map((p) => p.split("=")[0].trim())
    .filter(Boolean);
};

const agentConfigCache = new Map();

export async function createExecutor(engine, ai, options = {}, fsProvider = fs) {
  const { config: engineConfig, unifiedIntelligenceService } = options;
  const corePath = engine.corePath; // DEFINITIVE FIX: Get corePath from the engine instance.

  const { default: createGuardianTools } = await import("../tools/guardian_tool.js");
  const { default: createSystemTools } = await import("../tools/system_tools.js");
  const { default: createCoderagTools } = await import("../tools/coderag_tool.js");
  const trajectoryRecorder = engine.trajectoryRecorder;

  const injectedFileSystem = Object.keys(fileSystem).reduce((acc, key) => {
    if (key === "readFile") {
      // Cache readFile calls to prevent redundant reads within a single agent execution loop
      acc[key] = cachedQuery("readFile", (args) => fileSystem[key](args, fsProvider));
    } else {
      acc[key] = (args) => fileSystem[key](args, fsProvider);
    }
    return acc;
  }, {});

  const coderagTools = createCoderagTools(engine, { unifiedIntelligenceService });
  // Cache semantic_search calls to prevent redundant searches within a single agent execution loop
  coderagTools.semantic_search = cachedQuery("semantic_search", coderagTools.semantic_search);

  const toolbelt = {
    file_system: injectedFileSystem,
    shell,
    research,
    coderag: coderagTools,
    swarm_intelligence: swarmIntelligence,
    qa: qaTools,
    business_verification: businessVerification,
    guardian: createGuardianTools(engine, fsProvider),
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
    github_tool: github_tool,
    stigmergy: {
      task: async ({ subagent_type, description }, sourceAgentId) => {
        if (!subagent_type || !description) {
          throw new OperationalError(
            "The 'subagent_type' and 'description' arguments are required for stigmergy.task"
          );
        }

        engine.broadcastEvent("agent_delegation", {
          sourceAgentId: sourceAgentId,
          targetAgentId: subagent_type,
        });

        // --- DEFINITIVE FIX: The Mock-Aware Executor Factory ---
        // When a sub-agent is created, it MUST inherit all test-specific mocks
        // and factories from the parent engine that is running the test.
        const subAgentEngine = new engine.constructor({
          projectRoot: engine.projectRoot,
          corePath: engine.corePath,
          startServer: false,
          // Pass down all test-related properties
          _test_fs: engine._test_fs,
          _test_streamText: engine._test_streamText,
          _test_unifiedIntelligenceService: engine._test_unifiedIntelligenceService,
          _test_executorFactory: engine._test_executorFactory, // Pass the factory itself
        });

        // THIS IS THE CRITICAL FIX:
        // Ensure the sub-agent engine is always stopped.
        let result;
        try {
          // Add a default 5-minute timeout to all sub-agent tasks
          result = await subAgentEngine.triggerAgent(subagent_type, description, 300000);
        } finally {
          await subAgentEngine.stop();
        }

        return (
          result ||
          `Task successfully delegated to ${subagent_type}, which returned no final message.`
        );
      },
    },
  };

  // Dynamically load custom tools
  const customToolsPath = config.custom_tools_path;
  if (customToolsPath) {
    const absoluteCustomToolsPath = path.resolve(
      engine.projectRoot || process.cwd(),
      customToolsPath
    );
    try {
      fsProvider.statSync(absoluteCustomToolsPath); // Throws ENOENT if directory doesn't exist, which is caught below
      const files = await fsProvider.readdir(absoluteCustomToolsPath);
      for (const file of files) {
        if (file.endsWith(".js")) {
          const toolName = path.basename(file, ".js");
          const toolPath = path.join(absoluteCustomToolsPath, file);
          try {
            const toolModule = await import(`file://${toolPath}`);
            if (toolbelt[toolName]) {
              console.warn(
                chalk.yellow(
                  `[ToolLoader] Warning: Custom tool namespace '${toolName}' conflicts with a built-in tool. The custom tool will be ignored.`
                )
              );
            } else if (Object.keys(toolModule).length > 0) {
              toolbelt[toolName] = toolModule;
              console.log(chalk.blue(`[ToolLoader] Successfully loaded custom tool: ${toolName}`));
            } else {
              console.warn(
                chalk.yellow(
                  `[ToolLoader] Warning: Custom tool file '${file}' has no exports. Ignoring.`
                )
              );
            }
          } catch (e) {
            console.error(chalk.red(`[ToolLoader] Error loading custom tool from ${file}:`), e);
          }
        }
      }
    } catch (e) {
      if (e.code !== "ENOENT") {
        console.error(
          chalk.red(
            `[ToolLoader] Error accessing custom tools directory at ${absoluteCustomToolsPath}:`
          ),
          e
        );
      }
      // If ENOENT, the directory doesn't exist, so we just silently continue.
    }
  }

  const getTools = () => {
    // ... (implementation unchanged)
  };

  const execute = async (toolName, args, agentId, workingDirectory) => {
    const tracer = trace.getTracer("stigmergy-tool-executor");
    return tracer.startActiveSpan(`executeTool:${toolName}`, async (span) => {
      span.setAttribute("tool.name", toolName);
      span.setAttribute("agent.id", agentId);
      span.setAttribute("args", JSON.stringify(args));

      engine.broadcastEvent("tool_start", { tool: toolName, args });
      const startTime = Date.now();

      const recordingId = trajectoryRecorder.startRecording(`tool_${toolName}`, {
        toolName,
        args,
        agentId,
      });

      try {
        const criticalTools = ["file_system.writeFile", "shell.execute"];
        if (criticalTools.includes(toolName)) {
          const auditPrompt = `Audit the following action for constitutional compliance:\n\n- Agent: ${agentId}\n- Tool: ${toolName}\n- Arguments: ${JSON.stringify(args, null, 2)}`;

          console.log(
            chalk.yellow.bold(
              `[ConstitutionalAudit] Invoking @auditor for critical tool: ${toolName}`
            )
          );

          const auditResultText = await engine.triggerAgent("auditor", auditPrompt);

          try {
            const auditResult =
              typeof auditResultText === "string" ? JSON.parse(auditResultText) : auditResultText;
            if (auditResult.compliant === false) {
              console.error(
                chalk.red.bold(
                  `[ConstitutionalAudit] Action blocked by @auditor: ${auditResult.reason}`
                )
              );
              throw new OperationalError(`Action blocked by @auditor: ${auditResult.reason}`);
            }
            if (auditResult.compliant !== true) {
              throw new Error(`Invalid response format from auditor: ${auditResultText}`);
            }
            console.log(chalk.green.bold(`[ConstitutionalAudit] Action approved by @auditor.`));
          } catch (e) {
            if (e instanceof OperationalError) {
              throw e; // Re-throw the specific operational error
            }
            console.error(
              chalk.red.bold(
                `[ConstitutionalAudit] Failed to parse @auditor response: ${auditResultText}`
              ),
              e
            );
            throw new OperationalError(
              `[ConstitutionalAudit] Internal error: Could not get a valid compliance verdict from the @auditor agent.`
            );
          }
        }

        let agentConfig;
        if (agentConfigCache.has(agentId)) {
          agentConfig = agentConfigCache.get(agentId);
        } else {
          const customAgentsDir = config.custom_agents_path
            ? path.resolve(engine.projectRoot || process.cwd(), config.custom_agents_path)
            : null;
          const coreAgentsDir = path.join(corePath, "agents");

          const potentialPaths = [];
          if (customAgentsDir) {
            potentialPaths.push(path.join(customAgentsDir, `${agentId}.md`));
          }
          potentialPaths.push(path.join(coreAgentsDir, `${agentId}.md`));

          let agentFileContent = null;
          let foundPath = null;

          for (const agentDefPath of potentialPaths) {
            try {
              agentFileContent = await fsProvider.readFile(agentDefPath, "utf8");
              foundPath = agentDefPath;
              break; // Found it, stop searching.
            } catch (e) {
              if (e.code !== "ENOENT") throw e; // Re-throw unexpected errors
            }
          }

          if (!agentFileContent) {
            throw new Error(
              `Could not find agent definition for '${agentId}' in custom path ('${customAgentsDir}') or core path ('${coreAgentsDir}').`
            );
          }

          const yamlMatch = agentFileContent.match(/```yaml\s*([\s\S]*?)```/);
          if (!yamlMatch)
            throw new Error(`Could not find YAML block in agent definition file: ${foundPath}`);
          const parsedConfig = yaml.load(yamlMatch[1]).agent;
          agentConfigCache.set(agentId, parsedConfig);
          agentConfig = parsedConfig;
        }

        const [namespace, funcName] = toolName.split(".");
        if (!toolbelt[namespace] || typeof toolbelt[namespace][funcName] !== "function") {
          throw new Error(`Tool '${toolName}' not found.`);
        }

        if (namespace === "file_system") {
          const pathKey = args.path !== undefined ? "path" : "directory";
          const originalPath = args[pathKey] ?? ".";
          const resolvedPath = resolvePath(
            originalPath,
            engine.projectRoot,
            workingDirectory,
            fsProvider
          );
          args[pathKey] = resolvedPath;

          if (funcName === "writeFile" || funcName === "appendFile") {
            if (resolvedPath.startsWith(corePath)) {
              if (agentId !== "@guardian" && agentId !== "@metis") {
                throw new OperationalError(
                  `Security Violation: Only the @guardian or @metis agents may modify core system files. Agent '${agentId}' is not authorized.`
                );
              }
            }
          }
        } else if (namespace === "git_tool" && funcName === "init") {
          const originalPath = args.path ?? ".";
          args.path = resolvePath(originalPath, engine.projectRoot, workingDirectory, fsProvider);
        }

        const permittedTools = agentConfig.engine_tools || [];
        const isSystemOrDispatcher = agentId === "system" || agentId === "dispatcher";

        const isAuthorized = permittedTools.some((permittedTool) => {
          if (permittedTool.endsWith(".*")) {
            const ns = permittedTool.slice(0, -2);
            return toolName.startsWith(ns + ".");
          }
          return permittedTool === toolName;
        });

        if (!isSystemOrDispatcher && !isAuthorized) {
          throw new Error(`Tool '${toolName}' is not authorized for agent '${agentId}'.`);
        }

        const safeArgs = sanitizeToolCall(toolName, args)?.arguments || args;
        const toolFunction = toolbelt[namespace][funcName];

        let result;
        if (namespace === "git_tool" && funcName === "commit") {
          const contextualArgs = { ...safeArgs, workingDirectory: workingDirectory };
          result = await toolFunction(contextualArgs);
        } else if (namespace === "shell") {
          const contextualArgs = { ...safeArgs, cwd: workingDirectory };
          result = await toolFunction(contextualArgs);
        } else if (namespace === "stigmergy" && funcName === "task") {
          result = await toolFunction(safeArgs, agentId);
        } else {
          result = await toolFunction(safeArgs);
        }

        if (toolName.startsWith("file_system.write")) {
          clearFileCache();
          await triggerContextSummarization(toolName, safeArgs, agentId, engine);
        }
        engine.broadcastEvent("tool_end", { tool: toolName, result: result });
        return JSON.stringify(result, null, 2);
      } catch (error) {
        engine.broadcastEvent("tool_end", { tool: toolName, error: error.message });
        const processedError = ErrorHandler.process(error, { agentId, toolName });

        trajectoryRecorder.logEvent(recordingId, "tool_execution_error", {
          toolName,
          error: processedError.message,
          stack: processedError.stack,
          executionTime: Date.now() - startTime,
        });

        await trackToolUsage({
          toolName,
          success: false,
          agentId,
          executionTime: Date.now() - startTime,
          error: processedError.message,
        });
        span.recordException(processedError);
        span.setStatus({ code: SpanStatusCode.ERROR, message: processedError.message });
        throw processedError;
      } finally {
        try {
          await trajectoryRecorder.finalizeRecording(recordingId);
        } catch (finalizeError) {
          console.error(
            `[ToolExecutor] Error finalizing trajectory recording: ${finalizeError.message}`
          );
        }
        span.end();
      }
    });
  };

  // Expose toolbelt for testing purposes
  return { execute, getTools, toolbelt };
}
