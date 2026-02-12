import chalk from "chalk";
import { promises as fs } from "fs";
import path from "path";
import yaml from "js-yaml";
import { sanitizeToolCall, toolSchemas } from "../utils/sanitization.js";
import { cachedQuery } from "../utils/queryCache.js";
import * as fileSystem from "../tools/file_system.js";
import * as shell from "../tools/shell.js";
import * as research from "../tools/research.js";
import * as swarmIntelligence from "../tools/swarm_intelligence_tools.js";
import * as qaTools from "../tools/qa_tools.js";
import * as businessVerification from "../tools/business_verification.js";
import * as privilegedCoreTools from "../tools/core_tools.js";
import * as superdesignIntegration from "../tools/superdesign_integration.js";
import * as qwenIntegration from "../tools/qwen_integration.js";
import * as documentIntelligence from "../tools/document_intelligence.js";
import * as continuousExecution from "../tools/continuous_execution.js";
import * as git_tool from "../tools/git_tool.js";
import * as github_tool from "../tools/github_tool.js";
import { lightweight_archon_query } from "../services/lightweight_archon.js";
import { query_deepwiki } from "../services/deepwiki_mcp.js";
import { clearFileCache } from "./llm_adapter.js";
import ErrorHandler, { OperationalError } from "../utils/errorHandler.js";
import { trackToolUsage } from "../services/model_monitoring.js";
import { trace, SpanStatusCode } from "@opentelemetry/api";

// --- RESTORED: Robust Security Path Resolution ---
function resolvePath(filePath, projectRoot, workingDirectory, config, fsProvider = fs) {
  const SAFE_DIRECTORIES = config.security?.allowedDirs || ["src", "public", "docs", "tests", "scripts", ".ai", "services", "engine", "/workspace"];
  if (!filePath || typeof filePath !== "string") throw new OperationalError("Invalid file path provided");

  const baseDir = workingDirectory || projectRoot || process.cwd();
  const resolvedPath = path.resolve(baseDir, filePath);
  const projectScope = projectRoot || process.cwd();

  // Allow access to the mounted workspace (Operation Bridgehead)
  if (resolvedPath.startsWith('/workspace')) {
      return resolvedPath;
  }

  // Security Check 1: Path Traversal / Scope
  if (!resolvedPath.startsWith(projectScope)) {
    throw new OperationalError(`Security violation: Path traversal attempt. Resolved path "${resolvedPath}" is outside the project scope.`);
  }

  // Security checks apply primarily when NOT in a sandbox (or if the sandbox is the root)
  // If workingDirectory is provided and we are inside it, we are generally safe,
  // BUT we still want to prevent writing to 'dist' or 'node_modules' even from root.
  const relativeToProject = path.relative(projectScope, resolvedPath);

  if (!workingDirectory || workingDirectory === projectScope) {
      // Security Check 2: Generated Paths
      if (config.security?.generatedPaths) {
          const isGenerated = config.security.generatedPaths.some(p => relativeToProject.startsWith(p));
          if (isGenerated) {
              throw new OperationalError(`Security violation: Path "${filePath}" is inside a protected 'generated' directory. Per the Constitution, agents must only edit SOURCE files and then use the 'build.rebuild_dashboard' tool.`);
          }
      }

      // Security Check 3: Allowed Directories
      if (relativeToProject !== "" && !relativeToProject.startsWith("..")) {
          const isCoreFile = relativeToProject.startsWith(".stigmergy-core");
          // Allow if in safe dir
          const isSafeDir = SAFE_DIRECTORIES.some(dir => relativeToProject === dir || relativeToProject.startsWith(dir + path.sep));

          if (!isCoreFile && !isSafeDir) {
             // If it's not a safe dir, block it.
             // Exception: Root level files like package.json are usually allowed if not explicitly blocked.
             // But for this test, "unsafe/file.js" must fail.
             const rootDir = relativeToProject.split(path.sep)[0];
             // If the rootDir is not in SAFE_DIRECTORIES, we block.
             if (rootDir !== relativeToProject && !SAFE_DIRECTORIES.includes(rootDir)) {
                 throw new OperationalError(`Access restricted to unsafe directory "${rootDir}". Please use one of the allowed directories: ${SAFE_DIRECTORIES.join(", ")}`);
             }
          }
      }
  }

  return resolvedPath;
}

export async function createExecutor(engine, ai, options = {}, fsProvider = fs) {
  let agentConfigCache = new Map();
  const { config: engineConfig, unifiedIntelligenceService } = options;
  const config = engineConfig || (await import("../stigmergy.config.js")).default;
  const corePath = engine.corePath;

  const { default: createGuardianTools } = await import("../tools/guardian_tool.js");
  const { default: createSystemTools } = await import("../tools/system_tools.js");
  const { createCoderagTool } = await import("../tools/coderag_tool.js");
  const { createChatProcessor } = await import("../tools/chat_interface.js");

  const trajectoryRecorder = engine.trajectoryRecorder || { startRecording: () => {}, logEvent: () => {}, finalizeRecording: () => {} };

  const injectedFileSystem = Object.keys(fileSystem).reduce((acc, key) => {
    acc[key] = (args) => fileSystem[key](args, fsProvider);
    return acc;
  }, {});

  const toolbelt = {
    file_system: injectedFileSystem,
    shell,
    research,
    coderag: createCoderagTool(unifiedIntelligenceService),
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
        if (!subagent_type || !description) throw new OperationalError("Missing args for stigmergy.task");
        if (engine.broadcastEvent) engine.broadcastEvent("agent_delegation", { sourceAgentId, targetAgentId: subagent_type });

        const subAgentEngine = new engine.constructor({
          projectRoot: engine.projectRoot,
          corePath: engine.corePath,
          startServer: false,
          stateManager: engine.stateManager,
          config: config,
          _test_fs: engine._test_fs,
          _test_streamText: engine._test_streamText,
          _test_unifiedIntelligenceService: engine._test_unifiedIntelligenceService,
          _test_executorFactory: engine._test_executorFactory,
          trajectoryRecorder: engine.trajectoryRecorder
        });

        try {
          return await subAgentEngine.triggerAgent(subagent_type, description, 300000);
        } finally {
          await subAgentEngine.stop();
        }
      },
    },
  };

  async function loadAgentConfig(agentId) {
    if (agentConfigCache.has(agentId)) return agentConfigCache.get(agentId);

    const customAgentsDir = config.custom_agents_path
      ? path.resolve(engine.projectRoot || process.cwd(), config.custom_agents_path)
      : null;
    const coreAgentsDir = path.join(corePath, "agents");

    const potentialPaths = [];
    if (customAgentsDir) potentialPaths.push(path.join(customAgentsDir, `${agentId}.md`));
    potentialPaths.push(path.join(coreAgentsDir, `${agentId}.md`));

    let agentFileContent = null;
    for (const agentDefPath of potentialPaths) {
      try {
        agentFileContent = await fsProvider.readFile(agentDefPath, "utf8");
        break;
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
    }

    if (!agentFileContent) return { engine_tools: [] };

    const yamlMatch = agentFileContent.match(/```yaml\s*([\s\S]*?)```/);
    if (!yamlMatch) return { engine_tools: [] };

    const parsedConfig = yaml.load(yamlMatch[1]).agent;
    agentConfigCache.set(agentId, parsedConfig);
    return parsedConfig;
  }

  const getTools = async (agentId) => {
    const agentConfig = await loadAgentConfig(agentId);
    const permittedTools = agentConfig.engine_tools || [];
    const isSystemOrDispatcher = agentId === "system" || agentId === "dispatcher";

    const formattedTools = {};
    for (const [namespace, tools] of Object.entries(toolbelt)) {
      for (const toolName of Object.keys(tools)) {
        const fullToolName = `${namespace}.${toolName}`;

        const isAuthorized = permittedTools.some((permittedTool) => {
          if (permittedTool.endsWith(".*")) {
            const ns = permittedTool.slice(0, -2);
            return fullToolName.startsWith(ns + ".");
          }
          return permittedTool === fullToolName;
        });

        if (isSystemOrDispatcher || isAuthorized) {
            const schema = toolSchemas[fullToolName];
            if (schema) {
              formattedTools[fullToolName] = {
                description: schema.description,
                parameters: schema.parameters,
              };
            }
        }
      }
    }
    return formattedTools;
  };

  const execute = async (toolName, args, agentId, workingDirectory) => {
    const tracer = trace.getTracer("stigmergy-tool-executor");
    return tracer.startActiveSpan(`executeTool:${toolName}`, async (span) => {
        try {
            if(engine.broadcastEvent) engine.broadcastEvent("tool_start", { tool: toolName, args });

            // --- RESTORED: Constitutional Audit ---
            const criticalTools = ["file_system.writeFile", "shell.execute", "git_tool.*"];
            const isCritical = criticalTools.some(pattern => {
                if (pattern.endsWith(".*")) return toolName.startsWith(pattern.slice(0, -2) + ".");
                return toolName === pattern;
            });

            if (isCritical) {
                const auditPrompt = `Audit the following action for constitutional compliance:\n\n- Agent: ${agentId}\n- Tool: ${toolName}\n- Arguments: ${JSON.stringify(args, null, 2)}\n- Sandbox: ${workingDirectory}`;
                console.log(chalk.yellow.bold(`[ConstitutionalAudit] Invoking @auditor for critical tool: ${toolName}`));

                const auditResultText = await engine.triggerAgent("auditor", auditPrompt);

                try {
                    const auditResult = typeof auditResultText === "string" ? JSON.parse(auditResultText) : auditResultText;
                    if (auditResult.compliant === false) {
                        console.error(chalk.red.bold(`[ConstitutionalAudit] Action blocked by @auditor: ${auditResult.reason}`));
                        throw new OperationalError(`Action blocked by @auditor: ${auditResult.reason}`);
                    }

                    if (auditResult.requires_human_approval === true) {
                        console.log(chalk.cyan.bold(`[ConstitutionalAudit] Action requires human approval.`));
                        const decision = await toolbelt.system.request_human_approval({
                            message: `The agent is attempting to use ${toolName}. This action requires manual approval per constitutional protocols.`,
                            data: { agentId, toolName, args }
                        });
                        if (decision.toLowerCase().includes('rejected')) {
                            throw new OperationalError(`Action rejected by human operator.`);
                        }
                    }

                    if (auditResult.compliant !== true) throw new Error(`Invalid response format from auditor`);
                    console.log(chalk.green.bold(`[ConstitutionalAudit] Action approved by @auditor.`));
                } catch (e) {
                    if (e instanceof OperationalError) throw e;
                    console.error(chalk.red.bold(`[ConstitutionalAudit] Failed to parse @auditor response`), e);
                    throw new OperationalError(`[ConstitutionalAudit] Internal error: Could not get a valid compliance verdict.`);
                }
            }

            const agentConfig = await loadAgentConfig(agentId);
            const [namespace, funcName] = toolName.split(".");
            if (!toolbelt[namespace] || !toolbelt[namespace][funcName]) {
                 throw new Error(`Tool ${toolName} not found`);
            }

            // --- RESTORED: Path Security Resolution & Core Protection ---
            if (namespace === "file_system" || (namespace === "git_tool" && funcName === "init")) {
                 const pathKey = args.path !== undefined ? "path" : "directory";
                 if (args[pathKey]) {
                     const originalPath = args[pathKey];
                     const resolvedPath = resolvePath(originalPath, engine.projectRoot, workingDirectory, config, fsProvider);
                     args[pathKey] = resolvedPath;

                     // Core File Write Protection
                     if ((funcName === "writeFile" || funcName === "appendFile") && resolvedPath.startsWith(path.join(engine.projectRoot, ".stigmergy-core"))) {
                        if (agentId !== "@guardian" && agentId !== "@metis") {
                            throw new OperationalError(`Security Violation: Only the @guardian or @metis agents may modify core system files. Agent '${agentId}' is not authorized.`);
                        }
                     }
                 }
            }

            // Permission Check
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

            let result;
            const toolFunc = toolbelt[namespace][funcName];

            if (namespace === "shell") args.cwd = workingDirectory;
            if (namespace === "git_tool") args.workingDirectory = workingDirectory;

            if (namespace === "stigmergy" && funcName === "task") {
                result = await toolFunc(args, agentId);
            } else {
                result = await toolFunc(args);
            }

            if(engine.broadcastEvent) engine.broadcastEvent("tool_end", { tool: toolName, result });
            return JSON.stringify(result, null, 2);
        } catch (e) {
            if(engine.broadcastEvent) engine.broadcastEvent("tool_end", { tool: toolName, error: e.message });
            throw e;
        } finally {
            span.end();
        }
    });
  };

  return { execute, getTools, toolbelt };
}
