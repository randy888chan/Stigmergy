import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunWebSocket, serveStatic } from "hono/bun"; // Fixed: Use Bun-native modules
import path from "path";
import os from "os";
import chalk from "chalk";
import fs from "fs-extra";
import yaml from "js-yaml";
import { streamText } from "ai";

// Core Services
import { GraphStateManager } from "./infrastructure/state/GraphStateManager.js";
import { createExecutor } from "./tool_executor.js";
import { getAiProviders } from "../ai/providers.js";
import { unifiedIntelligenceService } from "../services/unified_intelligence.js";
import { TrajectoryRecorder } from "../services/trajectory_recorder.js";
import * as fileSystem from "../tools/file_system.js";
import { createCoderagTool } from "../tools/coderag_tool.js";

// Initialize Bun-native WebSocket handlers
const { upgradeWebSocket, websocket } = createBunWebSocket();

export class Engine {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.corePath = options.corePath || path.join(this.projectRoot, ".stigmergy-core");
    this.config = options.config;

    if (!this.config) {
      throw new Error("Engine requires a 'config' object in its constructor options.");
    }

    // Dependencies
    this.fs = options._test_fs || fs;
    this._test_streamText = options._test_streamText;
    this._test_unifiedIntelligenceService = options._test_unifiedIntelligenceService;
    this._test_executorFactory = options._test_executorFactory;

    // Core Services
    this.unifiedIntelligenceService = this._test_unifiedIntelligenceService || unifiedIntelligenceService;

    // State Manager
    this.ownsStateManager = !options.stateManager;
    this.stateManager = options.stateManager || new GraphStateManager(this.projectRoot);
    this.stateManagerInitializationPromise = options.stateManager ? Promise.resolve() : this.stateManager.initialize();

    // AI Setup
    if (!this._test_streamText) {
      this.ai = getAiProviders(this.config);
    }

    // Executor Chain
    this.toolExecutorPromise = this.stateManagerInitializationPromise.then(() => {
      this.trajectoryRecorder = options.trajectoryRecorder || new TrajectoryRecorder(this.stateManager);
      return this.initializeToolExecutor();
    });

    this.app = new Hono();
    this.port = Number(process.env.STIGMERGY_PORT) || 3010;
    this.clients = new Set();
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
    const { timeout = 300000 } = options;
    
    // Simplified trigger logic
    console.log(chalk.yellow(`[Engine] Triggering agent ${agentId}`));
    await this.toolExecutorPromise;

    try {
        const agentName = agentId.replace("@", "");
        const workingDirectory = path.join(this.projectRoot, ".stigmergy/sandboxes", agentName);
        await this.fs.promises.mkdir(workingDirectory, { recursive: true });

        const executeTool = this.toolExecutor;

        // 1. Load Agent Definition
        const agentPath = path.join(this.corePath, "agents", `${agentName}.md`);
        let systemPrompt = "You are a helpful AI assistant.";

        try {
            const agentFileContent = await this.fs.promises.readFile(agentPath, "utf-8");
            const yamlMatch = agentFileContent.match(/```yaml\s*([\s\S]*?)```/);

            if (yamlMatch && yamlMatch[1]) {
                const agentDef = yaml.load(yamlMatch[1]);
                if (agentDef.agent.persona) {
                    systemPrompt = `${agentDef.agent.persona.role} ${agentDef.agent.persona.identity}`;
                }
                if(agentDef.agent.core_protocols) {
                    systemPrompt += `\nProtocols:\n${agentDef.agent.core_protocols.join('\n')}`;
                }
            }
        } catch (e) {
            console.warn(`[Engine] Could not load definition for ${agentName}, using default prompt.`);
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
                tools: await executeTool.getTools(agentName)
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
                        console.log(`[Engine] Executing tool: ${call.toolName}`);
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

    this.app.get("/health", (c) => c.json({ status: "ok", mode: "local" }));

    // Resolve Helper
    const resolveSafePath = (inputPath, defaultPath = this.projectRoot) => {
      if (!inputPath || inputPath === 'undefined' || inputPath === 'null') return defaultPath;
      if (inputPath.startsWith("~")) {
        return path.join(os.homedir(), inputPath.slice(1));
      }
      if (path.isAbsolute(inputPath)) {
        return inputPath;
      }
      return path.resolve(this.projectRoot, inputPath);
    };

    // --- API: PROJECTS ---
    this.app.get("/api/projects", async (c) => {
      try {
        const basePath = resolveSafePath(c.req.query("basePath"), os.homedir());
        
        if (!await fs.pathExists(basePath)) {
            return c.json({ error: `Path not found: ${basePath}` }, 404);
        }

        const entries = await fs.readdir(basePath, { withFileTypes: true });
        const directories = entries
          .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
          .map(entry => entry.name);
        return c.json(directories);
      } catch (e) {
        return c.json({ error: e.message }, 500);
      }
    });

    // --- API: FILES ---
    this.app.get("/api/files", async (c) => {
      try {
        const targetPath = resolveSafePath(c.req.query("path") || this.projectRoot);
        const files = await fileSystem.listDirectory({ path: targetPath });
        return c.json(files);
      } catch (e) {
        return c.json({ error: e.message }, 500);
      }
    });

    // --- API: CONTENT (READ) ---
    this.app.get("/api/file-content", async (c) => {
      try {
        const filePath = c.req.query("path");
        if (!filePath) return c.json({ error: "Path required" }, 400);

        const safePath = resolveSafePath(filePath);
        if (!await fs.pathExists(safePath)) return c.json({ error: "File not found" }, 404);

        const content = await fs.readFile(safePath, "utf-8");
        return c.json({ content });
      } catch (e) {
        return c.json({ error: e.message }, 500);
      }
    });

    // --- API: CONTENT (SAVE) ---
    this.app.post("/api/file-content", async (c) => {
      try {
        await this.toolExecutorPromise;
        const { path: filePath, content } = await c.req.json();
        
        if (!filePath) return c.json({ error: "Path required" }, 400);

        const output = await this.toolExecutor.execute(
            "file_system.writeFile",
            { path: filePath, content },
            "user-ide", 
            this.projectRoot
        );

        return c.json({ success: true, message: "File saved." });
      } catch (e) {
        return c.json({ error: e.message }, 500);
      }
    });

    // --- API: STATE ---
    this.app.get("/api/state", async (c) => {
        const state = await this.stateManager.getState();
        return c.json(state);
    });

    // --- WEBSOCKETS (Fixed for Bun) ---
    this.app.get("/ws", upgradeWebSocket((c) => ({
       onOpen: () => console.log("WS Connected"),
       onMessage: (msg) => console.log("WS Message:", msg), 
       onClose: () => console.log("WS Disconnected")
    })));

    // Static Assets
    this.app.use("/*", serveStatic({ root: "./dashboard/public" }));
    this.app.get("*", serveStatic({ path: "./dashboard/public/index.html" }));
  }

  async start() {
    console.log(chalk.gray(`[Engine] Initializing server...`));

    // FIXED: Use Bun.serve with the websocket handler we created
    this.server = Bun.serve({
      fetch: this.app.fetch,
      port: this.port,
      websocket: websocket
    });

    console.log("");
    console.log(chalk.green.bold(`🚀 Stigmergy Engine is Live!`));
    console.log(chalk.blue(`👉 Dashboard: `) + chalk.white.bold.underline(`http://localhost:${this.port}`));
    console.log("");
  }

  async stop() {
    if (this.server) {
        this.server.stop();
        this.server = null;
    }
    if (this.ownsStateManager && this.stateManager) {
        await this.stateManager.closeDriver();
    }
  }
}