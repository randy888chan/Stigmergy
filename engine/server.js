import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { upgradeWebSocket } from "hono/bun";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "path";
import chalk from "chalk";
import fs from "fs-extra";
import yaml from "js-yaml";
import { streamText } from "ai";
import { getEstimatedCost } from "llm-cost-calculator";

// Core Services
import { GraphStateManager } from "../src/infrastructure/state/GraphStateManager.js";
import { createExecutor } from "./tool_executor.js";
import { getAiProviders } from "../ai/providers.js";
import { unifiedIntelligenceService } from "../services/unified_intelligence.js";
import { TrajectoryRecorder } from "../services/trajectory_recorder.js";
import * as fileSystem from "../tools/file_system.js";
import { createCoderagTool } from "../tools/coderag_tool.js";

// Disable Tracing for Stability
const sdk = { shutdown: () => Promise.resolve() };

export class Engine {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.corePath = options.corePath || path.join(this.projectRoot, ".stigmergy-core");
    this.config = options.config;

    if (!this.config) {
      throw new Error("Engine requires a 'config' object in its constructor options.");
    }

    // Dependencies for Testing
    this.fs = options._test_fs || fs;
    this._test_streamText = options._test_streamText;
    this._test_unifiedIntelligenceService = options._test_unifiedIntelligenceService;
    this._test_executorFactory = options._test_executorFactory;

    // Core Services Initialization
    this.unifiedIntelligenceService = this._test_unifiedIntelligenceService || unifiedIntelligenceService;

    // State Manager & Tool Executor Initialization Chains
    this.stateManager = options.stateManager || new GraphStateManager(this.projectRoot);
    this.stateManagerInitializationPromise = options.stateManager ? Promise.resolve() : this.stateManager.initialize();

    // Initialize AI
    if (!this._test_streamText) {
      this.ai = getAiProviders(this.config);
    }

    // Initialize Executor Chain
    this.toolExecutorPromise = this.stateManagerInitializationPromise.then(() => {
      this.trajectoryRecorder = options.trajectoryRecorder || new TrajectoryRecorder(this.stateManager);
      return this.initializeToolExecutor();
    });

    // Server Setup
    this.app = new Hono();
    this.port = Number(process.env.STIGMERGY_PORT) || 3010;
    this.clients = new Set();
    this.pendingApprovals = new Map();
    this.shouldStartServer = options.startServer !== false;

    this.setupRoutes();
  }

  async initializeToolExecutor() {
    const executorFactory = this._test_executorFactory || createExecutor;
    this.toolExecutor = await executorFactory(
      this,
      this.ai,
      { config: this.config, unifiedIntelligenceService: this.unifiedIntelligenceService },
      this.fs
    );
    return this.toolExecutor;
  }

  async triggerAgent(agentId, prompt, options = {}) {
    const { timeout = 300000, workingDirectory } = options;
    // Simplified trigger logic (No Tracing Spans to prevent deadlocks)
    console.log(chalk.yellow(`[Engine] Triggering agent ${agentId}`));
    await this.toolExecutorPromise;

    try {
        const agentName = agentId.replace("@", "");
        const executeTool = this.toolExecutor;

        // 1. Load Agent Definition
        const agentPath = path.join(this.corePath, "agents", `${agentName}.md`);
        const agentFileContent = await this.fs.promises.readFile(agentPath, "utf-8");
        const yamlMatch = agentFileContent.match(/```yaml\s*([\s\S]*?)```/);
        let systemPrompt = "You are a helpful AI assistant.";

        if (yamlMatch && yamlMatch[1]) {
             const agentDef = yaml.load(yamlMatch[1]);
             if (agentDef.agent.persona) {
                systemPrompt = `${agentDef.agent.persona.role} ${agentDef.agent.persona.identity}`;
             }
             if(agentDef.agent.core_protocols) {
                 systemPrompt += `\nProtocols:\n${agentDef.agent.core_protocols.join('\n')}`;
             }
        }

        // 2. Prepare Stream
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ];

        // 3. Execute Loop
        let isDone = false;
        let turnCount = 0;
        let lastText = "";

        while (!isDone && turnCount < 10) {
            turnCount++;
            const streamTextFunc = this._test_streamText || streamText;

            // Get Model
            let model = null;
            if (!this._test_streamText) {
                 const { client, modelName } = this.ai.getModelForTier("reasoning_tier", null, this.config);
                 model = client(modelName);
            }

            const result = await streamTextFunc({
                model,
                messages,
                tools: executeTool.getTools()
            });

            const { toolCalls, finishReason, text } = result;
            lastText = text;

            if (finishReason === "stop" || finishReason === "length") {
                isDone = true;
            } else if (toolCalls && toolCalls.length > 0) {
                messages.push({ role: "assistant", content: text || "", tool_calls: toolCalls });
                const toolResults = [];
                for (const call of toolCalls) {
                    try {
                        const output = await executeTool.execute(call.toolName, call.args, agentName, workingDirectory);
                        toolResults.push({
                            role: "tool",
                            tool_call_id: call.toolCallId,
                            tool_name: call.toolName,
                            content: JSON.stringify(output)
                        });
                    } catch (e) {
                        toolResults.push({
                            role: "tool",
                            tool_call_id: call.toolCallId,
                            tool_name: call.toolName,
                            content: `Error: ${e.message}`
                        });
                    }
                }
                messages.push(...toolResults);
            }
        }
        return lastText;

    } catch (e) {
        console.error(chalk.red(`[Engine] Agent Error: ${e.message}`));
        throw e;
    }
  }

  setupRoutes() {
    this.app.use("*", cors());

    this.app.get("/health", (c) => c.json({ status: "ok", mode: "restored" }));

    // API State
    this.app.get("/api/state", async (c) => {
        const state = await this.stateManager.getState();
        return c.json(state);
    });

    // WebSocket (Placeholder for full implementation)
    this.app.get("/ws", upgradeWebSocket((c) => ({
       onOpen: () => console.log("WS Open"),
       onMessage: () => {},
       onClose: () => console.log("WS Close")
    })));

    // Static Dashboard
    this.app.use("/*", serveStatic({ root: "./dashboard/public" }));
    this.app.get("*", serveStatic({ path: "./dashboard/public/index.html" }));
  }

  broadcastEvent(type, payload) {
      // Stub for WebSocket broadcasting
  }

  async start() {
    console.log(chalk.green(`[Engine] Starting on port ${this.port}`));
    this.server = serve({
      fetch: this.app.fetch,
      port: this.port
    });
  }

  async stop() {
    if (this.server) await this.server.close();
    if (this.stateManager && typeof this.stateManager.closeDriver === 'function') {
        await this.stateManager.closeDriver();
    }
    // Also close all WebSocket connections
    for (const client of this.clients) {
      client.close();
    }
  }
}