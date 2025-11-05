import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { getEstimatedCost } from "llm-cost-calculator";
import { serveStatic } from "@hono/node-server/serve-static";
import { upgradeWebSocket } from "hono/bun";
import { cors } from "hono/cors";
import chalk from "chalk";
import { GraphStateManager } from "../src/infrastructure/state/GraphStateManager.js";
import { FileStorageAdapter } from "../src/infrastructure/state/FileStorageAdapter.js";
import { HttpStorageAdapter } from "../src/infrastructure/state/HttpStorageAdapter.js";
import { createExecutor } from "./tool_executor.js";
import * as fileSystem from "../tools/file_system.js";
import { createCoderagTool } from "../tools/coderag_tool.js";
import { getAiProviders } from "../ai/providers.js";
import { configService } from "../services/config_service.js";
import { streamText } from "ai";
import path from "path";
import fs from "fs-extra";
import yaml from "js-yaml";
import tmp from "tmp";
import { unifiedIntelligenceService } from "../services/unified_intelligence.js";
import { BudgetExceededError } from "../utils/errorHandler.js";
import { TrajectoryRecorder } from "../services/trajectory_recorder.js";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { sdk } from "../services/tracing.js";

export class Engine {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.organizationId = options.organizationId || "default";
    this.projectId = options.projectId || path.basename(this.projectRoot);
    this.corePath = options.corePath || path.join(this.projectRoot, ".stigmergy-core");
    // DEFINITIVE FIX: Configuration is now injected, not fetched from a global singleton.
    this.config = options.config;
    if (!this.config) {
      // This will cause a crash if the config is not provided, which is what we want.
      // In production, the entry point provides it. In tests, the test setup must provide it.
      throw new Error("Engine requires a 'config' object in its constructor options.");
    }

    // State Manager will be initialized asynchronously
    this.stateManager = null;

    // Bind listeners to `this` FIRST to avoid race conditions.
    this.stateChangedListener = this._onStateChanged.bind(this);
    this.triggerAgentListener = this._onTriggerAgent.bind(this);

    this.stateManagerInitializationPromise = this._initializeStateManager(options);

    this._test_unifiedIntelligenceService = options._test_unifiedIntelligenceService;
    this._test_executorFactory = options._test_executorFactory;
    this.unifiedIntelligenceService =
      this._test_unifiedIntelligenceService ||
      options.unifiedIntelligenceService ||
      unifiedIntelligenceService;

    this.shouldStartServer = options.startServer !== false; // Defaults to true

    this.app = new Hono();
    this.app.use("*", cors());

    // --- Phase 36: Authentication Middleware ---
    this.app.use("*", async (c, next) => {
      const authHeader = c.req.header("Authorization");
      const headerToken = authHeader?.split(" ")[1];
      const queryToken = c.req.query("token");
      const token = headerToken || queryToken;
      const authToken = process.env.STIGMERGY_AUTH_TOKEN;

      // Allow health check to pass without auth
      if (c.req.path === "/health") {
        return next();
      }

      if (!authToken || token === authToken) {
        // For RBAC, check for admin token on sensitive routes
        if (["POST", "DELETE"].includes(c.req.method)) {
          const adminToken = process.env.STIGMERGY_ADMIN_TOKEN;
          if (adminToken && token !== adminToken) {
            // This is a sensitive operation, but the user is not an admin.
            // We can check if the specific route is one that needs admin privileges.
            // For now, let's assume all POST/DELETE need it for simplicity.
            const adminTokenHeader = c.req.header("X-Admin-Token");
            if (adminTokenHeader !== adminToken) {
              console.warn(`[Auth] Admin token missing for ${c.req.method} ${c.req.path}`);
              return c.json({ error: "Unauthorized: Admin privileges required." }, 403);
            }
          }
        }
        c.set("stateManager", this); // Pass the whole engine instance
        await next();
      } else {
        console.warn(`[Auth] Invalid token received for ${c.req.path}`);
        return c.json({ error: "Unauthorized" }, 401);
      }
    });

    this.clients = new Set();
    this.pendingApprovals = new Map(); // For Human Handoff
    this.server = null;
    this._test_streamText =
      options._test_streamText ||
      (() => Promise.resolve({ toolCalls: [], finishReason: "stop", text: "" }));
    this._test_onEnrichment = options._test_onEnrichment;
    this._test_fs = options._test_fs; // For injecting memfs in tests

    if (options.broadcastEvent) {
      this.broadcastEvent = options.broadcastEvent;
    }

    // This line was the root cause of the test failures. It overwrote the
    // dependency-injected mock config with a globally-loaded one.
    // this.config = configService.getConfig();

    if (!this._test_streamText) {
      this.ai = getAiProviders(this.config);
    }

    // Setup routes and listeners
    this.setupRoutes();
    // this.setupStateListener(); // This will be called after state manager is initialized

    // DEFINITIVE FIX: Chain the initialization promises to enforce correct order.
    // The TrajectoryRecorder depends on the StateManager, which must be initialized first.
    // The ToolExecutor depends on the TrajectoryRecorder.
    this.toolExecutorPromise = this.stateManagerInitializationPromise.then(() => {
      this.trajectoryRecorder =
        options.trajectoryRecorder || new TrajectoryRecorder(this.stateManager);
      return this.initializeToolExecutor();
    });
    this.sessionCost = 0;
    this.maxSessionCost = this.config.max_session_cost; // Initialize with default
    // Add this block:
    this.healthCheckInterval = setInterval(async () => {
      if (this.clients.size > 0) {
        const { get_system_health_overview } = await import("../tools/swarm_intelligence_tools.js");
        const healthData = await get_system_health_overview();
        this.broadcastEvent("system_health_update", healthData);
      }
    }, 30000); // Broadcast every 30 seconds
  }

  async _initializeStateManager(options) {
    // --- Definitive Fix: Dependency Injection and Correct Initialization ---
    this.isExternalStateManager = !!options.stateManager;
    if (options.stateManager) {
      // For tests, an external state manager (often a mock) can be injected.
      this.stateManager = options.stateManager;
    } else {
      // In production/normal operation, create a new GraphStateManager and let it
      // handle its own driver initialization and fallback logic internally.
      // This resolves the bug where an adapter was incorrectly passed as a driver.
      this.stateManager = new GraphStateManager(this.projectRoot);
      await this.stateManager.initialize();
    }
    this.setupStateListener();
  }

  async initializeToolExecutor() {
    const executorFactory = this._test_executorFactory || createExecutor;
    const fsProvider = this._test_fs || fs;
    // DEFINITIVE FIX: The TrajectoryRecorder is now created in the constructor's promise chain.
    // Remove the redundant and potentially problematic instantiation from here.
    this.toolExecutor = await executorFactory(
      this,
      this.ai,
      { config: this.config, unifiedIntelligenceService: this.unifiedIntelligenceService },
      fsProvider
    );
  }

  async setActiveProject(projectPath, organizationId = "default") {
    await this.stateManagerInitializationPromise;
    console.log(chalk.blue(`[Engine] Setting active project to: ${projectPath}`));
    if (!projectPath || typeof projectPath !== "string") {
      console.error(chalk.red("[Engine] Invalid project path provided."));
      return;
    }

    this.projectRoot = projectPath;
    this.organizationId = organizationId;
    this.projectId = path.basename(projectPath);

    // Re-initialize the GraphStateManager with the new project root
    if (this.stateManager) {
      this.stateManager.off("stateChanged", this.stateChangedListener);
      this.stateManager.off("triggerAgent", this.triggerAgentListener);
    }
    // Re-run the initialization for the new path
    this.stateManagerInitializationPromise = this._initializeStateManager({});
    await this.stateManagerInitializationPromise;

    console.log(chalk.green(`[Engine] Project context switched. New root: ${this.projectRoot}`));
    this.broadcastEvent("project_switched", { path: this.projectRoot });
  }

  async executeGoal(prompt, organizationId, projectId) {
    await this.stateManagerInitializationPromise;
    this.organizationId = organizationId || this.organizationId;
    this.projectId = projectId || this.projectId;
    console.log(
      chalk.cyan(`[Engine] Received new goal for project ${this.projectRoot}: "${prompt}"`)
    );
    await this.stateManager.initializeProject(prompt);
    // THIS IS THE FIX: Explicitly start the enrichment phase.
    // The state change event will trigger the `initiateAutonomousSwarm` method.
    await this.stateManager.updateStatus({
      newStatus: "ENRICHMENT_PHASE",
      message: "New goal received. Starting intelligence gathering.",
    });
  }

  setupStateListener() {
    if (!this.stateManager) {
      console.error(
        chalk.red(
          "[Engine] CRITICAL: setupStateListener called before state manager was initialized."
        )
      );
      return;
    }
    // Now use the bound listeners
    this.stateManager.on("stateChanged", this.stateChangedListener);
    this.stateManager.on("triggerAgent", this.triggerAgentListener);
  }

  // New private method for handling state changes
  async _onStateChanged(newState) {
    await this.stateManagerInitializationPromise;
    try {
      console.log(chalk.magenta(`[Engine] State changed to: ${newState.project_status}`));
      this.broadcastEvent("state_update", newState);

      if (newState.project_status === "ENRICHMENT_PHASE") {
        if (process.env.USE_MOCK_SWARM === "true") {
          console.log(chalk.yellow("[Engine] Mock swarm enabled. Skipping intelligence gathering."));
          await this.stateManager.updateStatus({
            newStatus: "PLANNING_PHASE",
            message: "Handoff to @specifier complete.",
          });
        } else if (this._test_onEnrichment) {
          await this._test_onEnrichment(newState);
        } else {
          await this.initiateAutonomousSwarm(newState);
        }
      }
    } catch (error) {
      console.error(chalk.red("[Engine] CRITICAL ERROR in stateChanged handler:"), error);
      await this.stateManager.updateStatus({
        newStatus: "ERROR",
        message: `Critical error in state handler: ${error.message}`,
      });
    }
  }

  // New private method for handling agent triggers
  async _onTriggerAgent({ agentId, prompt }) {
    await this.stateManagerInitializationPromise;
    console.log(chalk.green(`[Engine] Received triggerAgent event for ${agentId}`));
    await this.triggerAgent(agentId, prompt);
  }

  async initiateAutonomousSwarm(state) {
    await this.stateManagerInitializationPromise;
    console.log(chalk.cyan("[Engine] Intelligence Gathering Phase Initiated."));

    try {
      // 1. External Research: Trigger the @analyst agent
      console.log(chalk.blue("[Engine] Triggering @analyst for external research."));
      await this.stateManager.updateStatus({ message: "Phase 1: Conducting external research..." });
      const analystPrompt = `A new project goal has been set: "${state.goal}". Your task is to conduct a thorough analysis and return a research report as your final response.`;
      const analystReport = await this.triggerAgent("@analyst", analystPrompt);
      console.log(chalk.green("[Engine] @analyst has completed its research."));
      await this.stateManager.updateStatus({ message: "External research complete." });

      // 2. Local Indexing: Trigger the CodeRAG indexing process
      console.log(chalk.blue("[Engine] Triggering local codebase indexing via CodeRAG."));
      await this.stateManager.updateStatus({ message: "Phase 2: Indexing local codebase..." });
      const coderag = createCoderagTool(this, { unifiedIntelligenceService: this.unifiedIntelligenceService });
      await coderag.scan_codebase({ project_root: this.projectRoot });
      console.log(chalk.green("[Engine] Local codebase indexing complete."));
      await this.stateManager.updateStatus({ message: "Local codebase indexed." });

      // 3. Enriched Handoff: Trigger the @specifier with the combined intelligence
      console.log(chalk.blue("[Engine] Handing off to @specifier with enriched context."));
      await this.stateManager.updateStatus({ message: "Phase 3: Synthesizing plan..." });
      const specifierPrompt = `
# Project Goal
${state.goal}

# External Research Findings
The following report was generated by the @analyst agent:
---
${analystReport || "No report was generated by the analyst."}
---

# Local Codebase Analysis
The local codebase has been indexed and is ready for queries.

# Your Task
Based on all the information above, please create the initial \`plan.md\` file to achieve the project goal.
`;
      await this.triggerAgent("@specifier", specifierPrompt);
      console.log(
        chalk.green("[Engine] @specifier has been triggered. The swarm is now fully autonomous.")
      );
      await this.stateManager.updateStatus({
        newStatus: "PLANNING_PHASE",
        message: "Handoff to @specifier complete.",
      });
    } catch (error) {
      console.error(chalk.red("[Engine] CRITICAL ERROR during intelligence gathering:"), error);
      await this.stateManager.updateStatus({
        newStatus: "ERROR",
        message: `Failed during intelligence gathering: ${error.message}`,
      });
    }
  }

  async triggerAgent(agentId, prompt, timeout = 300000) {
    const tracer = trace.getTracer("stigmergy-engine");
    return tracer.startActiveSpan(`triggerAgent:${agentId}`, async (span) => {
      span.setAttribute("agent.id", agentId);
      span.setAttribute("prompt", prompt);

      await this.toolExecutorPromise;
      await this.stateManagerInitializationPromise;
      console.log(chalk.yellow(`[Engine] Triggering agent ${agentId} with prompt: "${prompt}"`));

      const agentExecution = async () => {
        const agentName = agentId.replace("@", "");
        let lastTextResponse = null;

        const workingDirectory = path.join(this.projectRoot, ".stigmergy", "sandboxes", agentName);
        await fs.ensureDir(workingDirectory);

        const executeTool = this.toolExecutor;

        const agentPath = path.join(this.corePath, "agents", `${agentName}.md`);
        const agentFileContent = await fs.readFile(agentPath, "utf-8");
        const yamlMatch = agentFileContent.match(/```yaml\n([\s\S]*?)\n```/);

        let systemPrompt = "You are a helpful AI assistant.";
        if (yamlMatch && yamlMatch[1]) {
          const agentDefinition = yaml.load(yamlMatch[1]);
          const agentConfig = agentDefinition.agent || {};
          const persona = agentConfig.persona || {};
          const protocols = agentConfig.core_protocols || [];
          const personaText = [persona.role, persona.style, persona.identity]
            .filter(Boolean)
            .join(" ");
          let finalPrompt = personaText;
          if (protocols.length > 0) {
            const protocolText = `My core protocols are:\n- ${protocols.join("\n- ")}`;
            if (finalPrompt) {
              finalPrompt += `\n\n${protocolText}`;
            } else {
              finalPrompt = protocolText;
            }
          }
          if (finalPrompt) {
            systemPrompt = finalPrompt;
          }
        }

        const messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ];

        let isDone = false;
        const maxTurns = 10;
        let turnCount = 0;

        while (!isDone && turnCount < maxTurns) {
          turnCount++;

          if (this.sessionCost > this.maxSessionCost) {
            throw new BudgetExceededError(
              `Mission aborted: Budget of $${this.maxSessionCost.toFixed(2)} has been exceeded.`
            );
          }

          const streamTextFunc = this._test_streamText || streamText;
          let model;
          if (this._test_streamText) {
            model = null;
          } else {
            const { client, modelName } = this.ai.getModelForTier("reasoning_tier");
            model = client(modelName);
          }

          const { toolCalls, finishReason, text, usage } = await streamTextFunc({
            model,
            messages,
            tools: executeTool.getTools(),
          });

          if (usage) {
            const { modelName } = this.ai.getModelForTier("reasoning_tier");
            const cost = getEstimatedCost({
              model: modelName,
              inputTokens: usage.promptTokens,
              outputTokens: usage.completionTokens,
            });
            if (cost) {
              this.sessionCost += cost;
              this.broadcastEvent("cost_update", { last: cost, total: this.sessionCost });
            }
          }

          lastTextResponse = text;

          if (finishReason === "stop" || finishReason === "length") {
            isDone = true;
            continue;
          }

          if (toolCalls && toolCalls.length > 0) {
            messages.push({ role: "assistant", content: text || "", tool_calls: toolCalls });

            const toolResults = [];
            for (const toolCall of toolCalls) {
              const result = await executeTool.execute(
                toolCall.toolName,
                toolCall.args,
                agentName,
                workingDirectory
              );
              if (result && result.project_status) {
                this.broadcastEvent("state_update", result);
              }
              toolResults.push({
                role: "tool",
                tool_call_id: toolCall.toolCallId,
                tool_name: toolCall.toolName,
                content: JSON.stringify(result),
              });
            }
            messages.push(...toolResults);
          } else {
            isDone = true;
          }
        }

        if (turnCount >= maxTurns) {
          console.error(chalk.red("[Engine] Agent loop reached max turns. Aborting."));
        }

        return lastTextResponse;
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Agent ${agentId} timed out after ${timeout}ms`)),
          timeout
        )
      );

      try {
        const result = await Promise.race([agentExecution(), timeoutPromise]);
        span.end();
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        console.error(chalk.red(`[Engine] ${error.message}`));
        await this.stateManager.updateStatus({ newStatus: "ERROR", message: error.message });
        span.end();
        return null;
      }
    });
  }

  setupRoutes() {
    // --- THIS IS THE CRITICAL FIX: DEFINE SPECIFIC ROUTES FIRST ---

    // 1. Health Check Endpoint
    this.app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

    // 2. Dashboard API Endpoints
    this.app.get("/api/state", async (c) => {
      const engine = c.get("stateManager"); // Now the engine instance
      await engine.stateManagerInitializationPromise; // Ensure state manager is ready
      if (engine && engine.stateManager) {
        const state = await engine.stateManager.getState();
        return c.json(state);
      }
      return c.json({ error: "StateManager not available" }, 500);
    });

    this.app.get("/api/files", async (c) => {
      // The listDirectory tool now expects an absolute path.
      const files = await fileSystem.listDirectory({ path: this.projectRoot });
      return c.json(files);
    });

    this.app.get("/api/file-content", async (c) => {
      const { path: filePath } = c.req.query();
      if (!filePath) {
        return c.json({ error: "File path is required." }, 400);
      }
      try {
        if (filePath.includes("..")) {
          return c.json({ error: "Invalid file path." }, 400);
        }
        const content = await fileSystem.readFile({
          path: filePath,
          projectRoot: this.projectRoot,
        });
        return c.json({ content });
      } catch (error) {
        return c.json({ error: `Failed to read file: ${error.message}` }, 500);
      }
    });

    this.app.get("/api/projects", async (c) => {
      const { basePath } = c.req.query();

      if (!basePath) {
        return c.json({ error: "basePath query parameter is required." }, 400);
      }

      // Security: Basic path validation
      if (basePath.includes("..") || !path.isAbsolute(basePath)) {
        return c.json({ error: "Invalid basePath provided." }, 400);
      }

      try {
        const dirents = await fs.readdir(basePath, { withFileTypes: true });
        const directories = dirents
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name);
        return c.json(directories);
      } catch (error) {
        if (error.code === "ENOENT") {
          return c.json({ error: `Base path not found: ${basePath}` }, 404);
        }
        console.error(`[Engine] Error reading projects from ${basePath}:`, error);
        return c.json({ error: "Failed to list projects." }, 500);
      }
    });

    this.app.get("/api/mission-plan", async (c) => {
      const planPath = path.join(this.projectRoot, "plan.md");
      try {
        const fileContent = await fs.readFile(planPath, "utf-8");
        const yamlMatch = fileContent.match(/```(?:yaml|yml)\n([\s\S]*?)\n```/);
        if (!yamlMatch || !yamlMatch[1]) {
          return c.json({ tasks: [], message: "Could not parse YAML from plan.md." }, 500);
        }
        const planData = yaml.load(yamlMatch[1]);
        return c.json(planData);
      } catch (error) {
        if (error.code === "ENOENT") {
          return c.json({ tasks: [], message: "Plan not yet created." });
        }
        return c.json({ error: `Failed to read or parse mission plan: ${error.message}` }, 500);
      }
    });

    // API for CodeRAG Search
    this.app.get("/api/coderag/search", async (c) => {
      const { query } = c.req.query();
      if (!query) return c.json({ error: "Query is required" }, 400);
      try {
        const coderag = createCoderagTool(this, { unifiedIntelligenceService: this.unifiedIntelligenceService });
        const results = await coderag.semantic_search({ query, project_root: this.projectRoot });
        return c.json(results);
      } catch (error) {
        return c.json({ error: error.message }, 500);
      }
    });

    // API for getting node details (as a placeholder for future expansion)
    this.app.get("/api/coderag/node/:id", async (c) => {
      const { id } = c.req.param();
      // Placeholder: In a real implementation, you'd fetch node details here.
      return c.json({ id, details: `Details for node ${id} would be here.` });
    });

    this.app.get("/api/proposals", async (c) => {
      const proposalsDir = path.join(this.corePath, "proposals");
      try {
        const proposalFiles = await fs.readdir(proposalsDir);
        const jsonFiles = proposalFiles.filter((f) => f.endsWith(".json"));

        const proposals = await Promise.all(
          jsonFiles.map(async (file) => {
            const filePath = path.join(proposalsDir, file);
            const content = await fs.readJson(filePath);
            return content;
          })
        );

        return c.json(
          proposals
            .filter((p) => p.status === "pending")
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        );
      } catch (error) {
        if (error.code === "ENOENT") {
          // If the directory doesn't exist, it means no proposals have been made yet.
          return c.json([]);
        }
        console.error("[Engine] Error reading proposals:", error);
        return c.json({ error: "Failed to retrieve proposals." }, 500);
      }
    });

    this.app.post("/api/proposals/:id/approve", async (c) => {
      const { id } = c.req.param();
      const proposalsDir = path.join(this.corePath, "proposals");
      const proposalPath = path.join(proposalsDir, `${id}.json`);

      try {
        const proposal = await fs.readJson(proposalPath);

        if (proposal.status !== "pending") {
          return c.json({ error: `Proposal ${id} is not pending.` }, 409);
        }

        // This is where we trigger the @guardian to apply the change.
        // The prompt is very specific and gives the guardian all context.
        const guardianPrompt = `
A human operator has APPROVED the following system improvement proposal.
You MUST now apply it.

**Proposal ID:** ${proposal.id}
**Reason for Change:** ${proposal.reason}

**Action:**
You are cleared to apply the change. Use the \`file_system.writeFile\` tool to apply the new content to the specified file.

**PROPOSED CHANGE DETAILS:**
---
**FILE_PATH:** ${proposal.file_path}
---
**NEW_CONTENT:**
\`\`\`
${proposal.new_content}
\`\`\`
---
Execute the file write operation now. Upon success, respond with a confirmation message.
                `;

        // Fire-and-forget the agent trigger
        this.triggerAgent("@guardian", guardianPrompt).catch((err) => {
          console.error(
            chalk.red(`[Engine] Background @guardian trigger failed for proposal ${id}:`),
            err
          );
        });

        // Immediately update the proposal status and respond to the user.
        proposal.status = "approved";
        await fs.writeJson(proposalPath, proposal, { spaces: 2 });

        this.broadcastEvent("proposal_updated", proposal);

        return c.json({ message: `Proposal ${id} approved and sent to @guardian for execution.` });
      } catch (error) {
        if (error.code === "ENOENT") {
          return c.json({ error: `Proposal ${id} not found.` }, 404);
        }
        console.error(`[Engine] Error approving proposal ${id}:`, error);
        return c.json({ error: "Failed to approve proposal." }, 500);
      }
    });

    this.app.post("/api/proposals/:id/reject", async (c) => {
      const { id } = c.req.param();
      const proposalsDir = path.join(this.corePath, "proposals");
      const proposalPath = path.join(proposalsDir, `${id}.json`);

      try {
        const proposal = await fs.readJson(proposalPath);

        if (proposal.status !== "pending") {
          return c.json({ error: `Proposal ${id} is not pending.` }, 409);
        }

        proposal.status = "rejected";
        await fs.writeJson(proposalPath, proposal, { spaces: 2 });

        this.broadcastEvent("proposal_updated", proposal);
        return c.json({ message: `Proposal ${id} rejected.` });
      } catch (error) {
        if (error.code === "ENOENT") {
          return c.json({ error: `Proposal ${id} not found.` }, 404);
        }
        console.error(`[Engine] Error rejecting proposal ${id}:`, error);
        return c.json({ error: "Failed to reject proposal." }, 500);
      }
    });

    this.app.get("/api/executive-summary", async (c) => {
      const trajectoriesDir = path.join(this.projectRoot, ".stigmergy", "trajectories");
      const performanceDir = path.join(this.projectRoot, ".ai", "performance");

      try {
        // --- 1. Process Trajectories ---
        const trajectoryFiles = await fs.readdir(trajectoriesDir).catch(() => []);
        let totalTasks = 0;
        let successfulTasks = 0;
        let totalDuration = 0;
        const agentStats = {}; // { agentId: { total: 0, success: 0 } }

        for (const file of trajectoryFiles) {
          if (!file.endsWith(".json")) continue;
          try {
            const filePath = path.join(trajectoriesDir, file);
            const trajectory = await fs.readJson(filePath);

            totalTasks++;
            const isSuccess =
              trajectory.status === "COMPLETED" || trajectory.status === "PLAN_EXECUTED";
            if (isSuccess) {
              successfulTasks++;
            }

            if (trajectory.start_time && trajectory.end_time) {
              const start = new Date(trajectory.start_time).getTime();
              const end = new Date(trajectory.end_time).getTime();
              totalDuration += end - start;
            }

            // Aggregate agent stats from events
            if (trajectory.events) {
              for (const event of trajectory.events) {
                if (event.type === "tool_call" && event.agent) {
                  const agentId = event.agent;
                  if (!agentStats[agentId]) {
                    agentStats[agentId] = { total: 0, success: 0 };
                  }
                  agentStats[agentId].total++;
                  if (event.status === "success") {
                    agentStats[agentId].success++;
                  }
                }
              }
            }
          } catch (err) {
            console.warn(
              `[ExecutiveSummary] Could not process trajectory file ${file}: ${err.message}`
            );
          }
        }

        // --- 2. Process Performance Logs (for cost) ---
        const performanceFiles = await fs.readdir(performanceDir).catch(() => []);
        let totalCost = 0;

        for (const file of performanceFiles) {
          if (!file.endsWith(".json")) continue;
          try {
            const filePath = path.join(performanceDir, file);
            const perfLog = await fs.readJson(filePath);
            if (perfLog.cost) {
              totalCost += perfLog.cost;
            }
          } catch (err) {
            console.warn(
              `[ExecutiveSummary] Could not process performance file ${file}: ${err.message}`
            );
          }
        }

        // --- 3. Calculate Final Metrics ---
        const successRate = totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0;
        const avgCompletionTime = totalTasks > 0 ? totalDuration / totalTasks : 0; // in milliseconds

        const agentReliability = Object.entries(agentStats)
          .map(([agentId, stats]) => ({
            agentId,
            reliability: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
            tasks: stats.total,
          }))
          .sort((a, b) => b.reliability - a.reliability);

        // --- 4. Read and Process plan.md for Milestone Progress ---
        const planPath = path.join(this.projectRoot, "plan.md");
        let milestoneProgress = [];
        try {
          const fileContent = await fs.readFile(planPath, "utf-8");
          const yamlMatch = fileContent.match(/```(?:yaml|yml)\n([\s\S]*?)\n```/);
          if (yamlMatch && yamlMatch[1]) {
            const planData = yaml.load(yamlMatch[1]);
            if (planData && Array.isArray(planData.tasks)) {
              const milestones = {}; // { "Milestone Name": { total: 0, completed: 0 } }
              for (const task of planData.tasks) {
                const milestoneName = task.milestone || "General Tasks";
                if (!milestones[milestoneName]) {
                  milestones[milestoneName] = { total: 0, completed: 0 };
                }
                milestones[milestoneName].total++;
                if (task.status === "COMPLETED") {
                  milestones[milestoneName].completed++;
                }
              }
              milestoneProgress = Object.entries(milestones).map(([name, data]) => ({
                name,
                progress:
                  data.total > 0 ? parseFloat(((data.completed / data.total) * 100).toFixed(2)) : 0,
              }));
            }
          }
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.warn(`[ExecutiveSummary] Could not process plan.md: ${err.message}`);
          }
          // If plan.md doesn't exist, just return empty array, which is fine.
        }

        return c.json({
          overallSuccessRate: parseFloat(successRate.toFixed(2)),
          averageTaskCompletionTime: avgCompletionTime,
          totalEstimatedCost: this.sessionCost,
          agentReliabilityRankings: agentReliability,
          totalTasks,
          successfulTasks,
          milestoneProgress,
        });
      } catch (error) {
        console.error("[Engine] Error generating executive summary:", error);
        return c.json({ error: "Failed to generate executive summary." }, 500);
      }
    });

    this.app.post("/api/upload", async (c) => {
      try {
        const formData = await c.req.formData();
        const file = formData.get("file");

        if (!file) {
          return c.json({ error: "No file uploaded." }, 400);
        }

        // Create a temporary file to store the upload
        const tempFile = tmp.fileSync({ postfix: path.extname(file.name) });
        const fileBuffer = await file.arrayBuffer();

        await fs.writeFile(tempFile.name, Buffer.from(fileBuffer));
        console.log(
          chalk.green(`[Engine] File uploaded and saved temporarily to ${tempFile.name}`)
        );

        // Trigger the analyst agent in the background (fire and forget)
        const analystPrompt = `A new document has been uploaded at \`${tempFile.name}\`. Your task is to process it using the \`document_intelligence.processDocument\` tool and report your findings.`;
        this.triggerAgent("@analyst", analystPrompt).catch((err) => {
          console.error(chalk.red("[Engine] Error triggering agent for document upload:"), err);
          // Optionally, clean up the temp file on error
          tempFile.removeCallback();
        });

        return c.json({
          message: "File uploaded and processing started.",
          filePath: tempFile.name,
        });
      } catch (error) {
        console.error(chalk.red("[Engine] File upload failed:"), error);
        return c.json({ error: "Failed to process file upload." }, 500);
      }
    });

    this.app.post("/api/mission/briefing", async (c) => {
      const engine = c.get("stateManager"); // It's the engine instance
      if (!engine) {
        return c.json({ error: "Engine not available" }, 500);
      }

      try {
        const { missionTitle, userStories, acceptanceCriteria, outOfScope } = await c.req.json();

        if (!missionTitle || !userStories || !acceptanceCriteria) {
          return c.json(
            { error: "Missing required fields: missionTitle, userStories, acceptanceCriteria" },
            400
          );
        }

        // Translate structured data into a markdown prompt
        const prompt = `
# Mission: ${missionTitle}

## User Stories
${userStories}

## Acceptance Criteria
${acceptanceCriteria}

${outOfScope ? `## Out of Scope\n${outOfScope}` : ""}

Based on the information above, please formulate a plan and execute the mission.
                `.trim();

        // Trigger the existing executeGoal workflow
        engine.executeGoal(prompt).catch((err) => {
          console.error(chalk.red(`[Mission Briefing] Error executing goal: ${err.message}`));
        });

        return c.json({ message: "Mission briefing received and initiated successfully." });
      } catch (error) {
        console.error(chalk.red("[Engine] Error processing mission briefing:"), error);
        return c.json({ error: "Failed to process mission briefing." }, 500);
      }
    });

    this.app.get("/api/mission/summary", async (c) => {
      const engine = c.get("stateManager");
      if (!engine) {
        return c.json({ error: "Engine not available" }, 500);
      }

      try {
        // The tool executor expects the projectRoot to be passed as workingDirectory
        // The result is a JSON string containing the raw diff string, so it needs to be parsed.
        const rawToolResult = await this.toolExecutor.execute(
          "git_tool.get_staged_diff",
          { workingDirectory: this.projectRoot },
          "@system",
          this.projectRoot
        );
        const diff = JSON.parse(rawToolResult);

        if (!diff || diff === "No staged changes found.") {
          return c.json({ summary: "No changes have been staged to summarize." });
        }

        const chroniclerPrompt = `Please summarize the following git diff in a human-readable, non-technical format:\n\n${diff}`;
        const summary = await this.triggerAgent("@chronicler", chroniclerPrompt);

        return c.json({ summary });
      } catch (error) {
        console.error(chalk.red("[Engine] Error generating mission summary:"), error);
        return c.json({ error: "Failed to generate mission summary." }, 500);
      }
    });

    this.app.post("/api/knowledge/export", async (c) => {
      try {
        const query = "CALL apoc.export.cypher.all(null, {stream: true, format: 'cypher-shell'})";
        // Assuming system.execute_cypher_query is available via toolExecutor
        const resultString = await this.toolExecutor.execute(
          "system.execute_cypher_query",
          { query },
          "@system",
          this.projectRoot
        );
        const result = JSON.parse(resultString); // The tool returns a JSON string

        // The result from apoc.export.cypher.all is a stream of data.
        // We need to concatenate the 'cypher' property from each object in the result array.
        const cypherScript = result.map((record) => record.cypher).join("");

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `knowledge-export-${timestamp}.cypher`;
        const filePath = path.join(this.projectRoot, fileName);

        await fs.writeFile(filePath, cypherScript);

        return c.json({ message: "Knowledge graph exported successfully.", filePath });
      } catch (error) {
        console.error(chalk.red("[Engine] Knowledge export failed:"), error);
        return c.json({ error: `Failed to export knowledge graph: ${error.message}` }, 500);
      }
    });

    this.app.post("/api/knowledge/import", async (c) => {
      try {
        const { cypherScript } = await c.req.json();
        if (!cypherScript) {
          return c.json({ error: "cypherScript is required in the request body." }, 400);
        }

        // Split the script into individual statements. APOC export separates them with semicolons.
        const statements = cypherScript
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const statement of statements) {
          // We need to add the semicolon back for execution
          const query = `${statement};`;
          await this.toolExecutor.execute(
            "system.execute_cypher_query",
            { query },
            "@system",
            this.projectRoot
          );
        }

        return c.json({
          message: `Knowledge graph imported successfully. Executed ${statements.length} statements.`,
        });
      } catch (error) {
        console.error(chalk.red("[Engine] Knowledge import failed:"), error);
        return c.json({ error: `Failed to import knowledge graph: ${error.message}` }, 500);
      }
    });

    this.app.post("/api/mission/briefing", async (c) => {
      const { missionTitle, userStories, acceptanceCriteria } = await c.req.json();

      if (!missionTitle || !userStories || !acceptanceCriteria) {
        return c.json(
          { error: "missionTitle, userStories, and acceptanceCriteria are required" },
          400
        );
      }

      const conductorPrompt = `
                # Mission Briefing
                ## Title: ${missionTitle}
                ## User Stories
                ${userStories}
                ## Acceptance Criteria
                ${acceptanceCriteria}

                As the Conductor, your task is to understand this mission briefing and initiate the first step of the process.
            `;

      // We can directly trigger the conductor agent.
      // In a more complex setup, this might go into a queue.
      this.triggerAgent("@conductor", conductorPrompt);

      return c.json({ message: "Mission briefing received, conductor agent initiated." });
    });

    // 3. IDE (MCP) Endpoint
    this.app.get("/mcp", async (c) => {
      const { goal: prompt, project_path, max_session_cost } = c.req.query();

      if (!prompt || !project_path) {
        return c.json({ error: "goal and project_path query parameters are required." }, 400);
      }

      if (max_session_cost) {
        this.maxSessionCost = parseFloat(max_session_cost);
        console.log(
          chalk.yellow(
            `[Engine] Max session cost overridden by CLI: $${this.maxSessionCost.toFixed(2)}`
          )
        );
      }

      console.log(chalk.cyan(`[MCP] Received prompt for project: ${project_path}`));
      await this.setActiveProject(project_path);

      // This endpoint now uses streamSSE for OpenAI compatibility
      return c.streamSSE(async (stream) => {
        const formatAsOpenAIStream = (content, finishReason = null) => {
          const chunk = {
            id: `chatcmpl-${Date.now()}`,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: "stigmergy-mcp",
            choices: [
              {
                index: 0,
                delta: { content },
                finish_reason: finishReason,
              },
            ],
          };
          return JSON.stringify(chunk);
        };

        const listener = async (event) => {
          const content = `\`\`\`json\n${JSON.stringify(event, null, 2)}\n\`\`\``;
          await stream.writeSSE({ data: formatAsOpenAIStream(content) });
        };

        this.stateManager.on("stateChanged", listener);

        stream.onAbort(() => {
          console.log(chalk.yellow("[MCP] Stream aborted by client."));
          this.stateManager.off("stateChanged", listener);
        });

        try {
          const initialMessage = "Processing new goal...";
          await stream.writeSSE({ data: formatAsOpenAIStream(initialMessage) });

          await this.executeGoal(prompt);
          // The stateChanged listener will now handle subsequent updates.
          // We need to keep the connection alive until a terminal state is reached.

          // Add a timeout to prevent hanging indefinitely
          const timeout = setTimeout(async () => {
            console.warn(chalk.yellow("[MCP] Stream timed out. Sending final message."));
            this.stateManager.off("stateChanged", listener);
            await stream.writeSSE({ data: formatAsOpenAIStream(null, "stop") });
            await stream.writeSSE({ data: "[DONE]" });
            stream.close();
          }, 120000); // 2 minutes timeout

          // Listen for a terminal state to close the stream cleanly
          const terminalStates = ["COMPLETED", "ERROR", "PLAN_EXECUTED"];
          const finalStateListener = async (state) => {
            if (terminalStates.includes(state.project_status)) {
              console.log(
                chalk.green(
                  `[MCP] Reached terminal state: ${state.project_status}. Closing stream.`
                )
              );
              clearTimeout(timeout);
              this.stateManager.off("stateChanged", listener);
              this.stateManager.off("stateChanged", finalStateListener); // Clean up self
              await stream.writeSSE({ data: formatAsOpenAIStream(null, "stop") });
              await stream.writeSSE({ data: "[DONE]" });
              stream.close();
            }
          };
          this.stateManager.on("stateChanged", finalStateListener);
        } catch (error) {
          console.error(chalk.red("[MCP] Error executing goal:"), error);
          const errorMessage = `Error: ${error.message}`;
          await stream.writeSSE({ data: formatAsOpenAIStream(errorMessage, "stop") });
          await stream.writeSSE({ data: "[DONE]" });
          stream.close();
        }
      });
    });

    // 4. WebSocket Endpoint
    this.app.get(
      "/ws",
      upgradeWebSocket((c) => {
        return {
          onOpen: (evt, ws) => {
            console.log(chalk.blue("[WebSocket] Client connected"));
            this.clients.add(ws);
          },
          onMessage: async (evt, ws) => {
            try {
              const data = JSON.parse(evt.data);
              if (data.type === "start_mission") {
                const { goal, project_path } = data.payload;
                console.log(
                  chalk.blue(`[WebSocket] Received start_mission for project: ${project_path}`)
                );
                await this.setActiveProject(project_path);
                await this.executeGoal(goal);
              } else if (data.type === "user_chat_message") {
                await this.executeGoal(data.payload.prompt);
              } else if (data.type === "set_project") {
                await this.setActiveProject(data.payload.path);
              } else if (data.type === "human_approval_response") {
                const { requestId, decision } = data.payload;
                if (this.pendingApprovals.has(requestId)) {
                  const resolve = this.pendingApprovals.get(requestId);
                  resolve(decision); // Resolve the promise the agent is waiting for
                  this.pendingApprovals.delete(requestId);
                  console.log(
                    chalk.green(
                      `[Engine] Human decision '${decision}' received for request ${requestId}. Resuming agent.`
                    )
                  );
                } else {
                  console.warn(
                    chalk.yellow(
                      `[Engine] Received a human approval response for an unknown or expired request ID: ${requestId}`
                    )
                  );
                }
              }
            } catch (error) {
              console.error(chalk.red("[WebSocket] Error processing message:"), error);
            }
          },
          onClose: (evt, ws) => {
            console.log(chalk.blue("[WebSocket] Client disconnected"));
            this.clients.delete(ws);
          },
          onError: (err) => {
            console.error(chalk.red("[WebSocket] Error:"), err);
          },
        };
      })
    );

    // --- THIS MUST BE LAST: THE GENERAL "CATCH-ALL" ROUTES ---

    // 5. Serve Static Assets (JS, CSS, images) from the public directory
    // The "Reliable Path" fix: construct path relative to this file's location.
    const currentFilePath = new URL(import.meta.url).pathname;
    const engineDir = path.dirname(currentFilePath);
    const projectRootForStatic = path.resolve(engineDir, ".."); // Assumes engine is one level down from project root
    const publicPath = path.join(projectRootForStatic, "dashboard", "public");

    this.app.use("/*", serveStatic({ root: publicPath }));

    // 6. Fallback for Single-Page App: Serve index.html for any other GET request
    this.app.get("*", serveStatic({ path: "index.html", root: publicPath }));
  }

  broadcastEvent(type, payload) {
    const message = JSON.stringify({ type, payload });
    for (const client of this.clients) {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(message);
      }
    }
  }

  async start() {
    if (!this.shouldStartServer) {
      console.log(chalk.yellow("[Engine] Server start skipped as per configuration."));
      return;
    }
    await this.stateManagerInitializationPromise;
    console.log(chalk.blue("Initializing Stigmergy Engine..."));
    const PORT = Number(process.env.STIGMERGY_PORT) || 3010;

    this.server = serve(
      {
        fetch: this.app.fetch,
        port: PORT,
      },
      (info) => {
        console.log(`Stigmergy engine is running on http://localhost:${info.port}`);
      }
    );
  }

  async stop() {
    console.log(
      chalk.blue(
        `[Engine] Shutting down... (Server running: ${!!this.server}, External StateManager: ${this.isExternalStateManager})`
      )
    );

    // 1. Clear intervals to stop background tasks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // 2. Unregister event listeners to prevent memory leaks
    if (this.stateManager) {
      this.stateManager.off("stateChanged", this.stateChangedListener);
      this.stateManager.off("triggerAgent", this.triggerAgentListener);
    }

    // 3. Close the HTTP server
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve));
      console.log(chalk.green("[Engine] HTTP server stopped."));
      this.server = null;
    }

    // 4. Close the State Manager's connection (ONLY if it was created internally)
    if (this.stateManager && !this.isExternalStateManager) {
      await this.stateManager.closeDriver();
      console.log(chalk.green("[Engine] Internal StateManager connection closed."));
    }

    // 5. This is the critical fix that will solve the timeout:
    await sdk.shutdown();
    console.log(chalk.green("[Engine] OpenTelemetry SDK shut down."));
    console.log(chalk.blue("[Engine] Shutdown complete."));
  }
}
