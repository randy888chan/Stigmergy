import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunWebSocket } from "hono/bun";
import { serveStatic } from "hono/bun";
import path from "path";
import os from "os";
import chalk from "chalk";
import fs from "fs-extra";
import yaml from "js-yaml";
import { streamText } from "ai";

// Fixed Imports (Relative to engine/ folder)
import { GraphStateManager } from "./infrastructure/state/GraphStateManager.js";
import { createExecutor } from "./tool_executor.js";
import { getAiProviders } from "../ai/providers.js";
import { unifiedIntelligenceService } from "../services/unified_intelligence.js";
import { TrajectoryRecorder } from "../services/trajectory_recorder.js";
import * as fileSystem from "../tools/file_system.js";
import { createCoderagTool } from "../tools/coderag_tool.js";

// Initialize Bun-native WebSocket
const { upgradeWebSocket, websocket } = createBunWebSocket();

export class Engine {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.corePath = options.corePath || path.join(this.projectRoot, ".stigmergy-core");
    this.config = options.config;

    if (!this.config) {
      throw new Error("Engine requires a 'config' object.");
    }

    // Dependencies
    this.fs = options._test_fs || fs;
    this._test_streamText = options._test_streamText;
    this._test_unifiedIntelligenceService = options._test_unifiedIntelligenceService;
    this._test_executorFactory = options._test_executorFactory;

    // Services
    this.unifiedIntelligenceService = this._test_unifiedIntelligenceService || unifiedIntelligenceService;
    this.ownsStateManager = !options.stateManager;

    // Initialize State Manager
    this.stateManager = options.stateManager || new GraphStateManager(this.projectRoot);
    this.stateManagerInitializationPromise = options.stateManager ? Promise.resolve() : this.stateManager.initialize();

    // AI & Executor
    if (!this._test_streamText) {
      this.ai = getAiProviders(this.config);
    }

    this.toolExecutorPromise = this.stateManagerInitializationPromise.then(() => {
      this.trajectoryRecorder = options.trajectoryRecorder || new TrajectoryRecorder(this.stateManager);
      return this.initializeToolExecutor();
    });

    this.app = new Hono();
    const envPort = process.env.STIGMERGY_PORT;
    this.port = envPort ? Number(envPort) : (this.config?.server?.port !== undefined ? this.config.server.port : 3010);
    this.clients = new Set();
    this.pendingApprovals = new Map();

    this.setupRoutes();
  }

  broadcastEvent(type, payload) {
    const message = JSON.stringify({ type, payload });
    for (const ws of this.clients) {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(message);
      }
    }
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
    console.log(chalk.yellow(`[Engine] Triggering agent ${agentId} with prompt: "${prompt.slice(0, 50)}..."`));

    // Notify frontend agent started
    this.broadcastEvent("agent_start", { agentId });

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
                const tier = agentName === 'analyst' ? 'research_tier' : 'reasoning_tier';
                const { client, modelName } = this.ai.getModelForTier(tier, null, this.config);
                model = client(modelName);
            }

            let result;
            let attempts = 0;
            const maxAttempts = 4;

            while (attempts < maxAttempts) {
                try {
                    result = await streamTextFunc({
                        model,
                        messages,
                        tools: await executeTool.getTools(agentName)
                    });
                    break; // Success
                } catch (e) {
                    attempts++;
                    if (attempts >= maxAttempts) throw e;
                    const delay = 1000 * Math.pow(2, attempts - 1); // 1s, 2s, 4s
                    console.warn(chalk.yellow(`[AI] Error (Attempt ${attempts}): ${e.message}. Retrying in ${delay}ms...`));
                    await new Promise(r => setTimeout(r, delay));
                }
            }

            const { toolCalls, finishReason, text } = result;
            lastText = text;

            // Broadcast Thought/Text
            if (text) this.broadcastEvent("agent_thought", { agentId, text });

            if (finishReason === "stop" || finishReason === "length") {
                isDone = true;
            } else if (toolCalls && toolCalls.length > 0) {
                messages.push({ role: "assistant", content: text || "", tool_calls: toolCalls });
                const toolResults = [];
                for (const call of toolCalls) {
                    try {
                        console.log(`[Engine] Executing tool: ${call.toolName}`);
                        this.broadcastEvent("tool_start", { tool: call.toolName, args: call.args });
                        const output = await executeTool.execute(call.toolName, call.args, agentName, workingDirectory);
                        this.broadcastEvent("tool_end", { tool: call.toolName, result: output });
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
        this.broadcastEvent("log", { level: "error", message: e.message });
        throw e;
    }
  }

  setupRoutes() {
    // 1. CORS & Logging Middleware
    this.app.use("*", cors());
    this.app.use("*", async (c, next) => {
      console.log(chalk.gray(`[REQ] ${c.req.method} ${c.req.path}`));
      await next();
    });

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

    // 2. Health Check
    this.app.get("/health", (c) => c.json({ status: "ok", mode: "bun-native" }));

    // 2.5 State API
    this.app.get("/api/state", async (c) => {
      try {
        const state = await this.stateManager.getState();
        return c.json(state);
      } catch (e) {
        return c.json({ error: e.message }, 500);
      }
    });

    // 3. Project Listing API
    this.app.get("/api/projects", async (c) => {
      try {
        const basePath = resolveSafePath(c.req.query("basePath"), os.homedir());
        
        if (!await fs.pathExists(basePath)) {
            return c.json({ error: "Path does not exist", currentPath: basePath, folders: [] }, 404);
        }

        const entries = await fs.readdir(basePath, { withFileTypes: true });
        const folders = entries
          .filter(e => e.isDirectory() && !e.name.startsWith('.'))
          .map(e => e.name);

        return c.json({ currentPath: basePath, folders });
      } catch (e) {
        console.error(chalk.red("[API Error]"), e);
        return c.json({ error: e.message }, 500);
      }
    });

    // 4. File Listing API
    this.app.get("/api/files", async (c) => {
       try {
         const targetPath = resolveSafePath(c.req.query("path") || this.projectRoot);
         const files = await fileSystem.listFiles({ directory: targetPath });
         return c.json(files);
       } catch (e) {
         return c.json({ error: e.message }, 500);
       }
    });

    // 5. File Content API
    this.app.get("/api/file-content", async (c) => {
        const filePath = c.req.query("path");
        if (!filePath) return c.json({ error: "No path" }, 400);
        const fullPath = resolveSafePath(filePath);
        if (await fs.pathExists(fullPath)) {
            const content = await fs.readFile(fullPath, "utf-8");
            return c.json({ content });
        }
        return c.json({ error: "File not found" }, 404);
    });

    this.app.post("/api/file-content", async (c) => {
        await this.toolExecutorPromise;
        const { path: fPath, content } = await c.req.json();
        await this.toolExecutor.execute("file_system.writeFile", { path: fPath, content }, "user-ide", this.projectRoot);
        return c.json({ success: true });
    });

    // 6. WebSocket
    this.app.get("/ws", upgradeWebSocket((c) => ({
       onOpen: (event, ws) => {
         console.log(chalk.gray("[WS] Connected"));
         this.clients.add(ws);
       },
       onMessage: async (event, ws) => {
         try {
             const data = JSON.parse(event.data);
             console.log(chalk.gray(`[WS] Received: ${data.type}`));

             if (data.type === 'chat_message') {
               // Trigger the Conductor with the user's message
               // We don't await this so the socket stays responsive
               this.triggerAgent("@conductor", data.payload.content)
                   .catch(e => console.error("Agent failed:", e));
             } else if (data.type === 'stop_mission') {
               console.log(chalk.red.bold("[Engine] Stop Mission requested."));
               if (this.stateManager) {
                   await this.stateManager.updateStatus({ newStatus: 'Stopped', message: 'User requested stop.' });
               }
               this.broadcastEvent('state_update', { project_status: 'Stopped' });
             } else if (data.type === 'human_approval_response') {
               const { requestId, decision } = data.payload;
               if (this.pendingApprovals.has(requestId)) {
                 this.pendingApprovals.get(requestId)(decision);
                 this.pendingApprovals.delete(requestId);
               }
             } else if (data.type === 'set_project') {
                 this.projectRoot = data.payload.path;
                 this.broadcastEvent('state_update', { project_path: this.projectRoot });
             }
         } catch (e) {
             console.error(chalk.red("[WS Error]"), e);
         }
       },
       onClose: (event, ws) => {
         console.log(chalk.gray("[WS] Disconnected"));
         this.clients.delete(ws);
       }
    })));

    // --- STATIC ASSETS ---
    // This MUST be before the "*" route
    this.app.get("/index.js", serveStatic({ path: "./dashboard/public/index.js" }));
    this.app.get("/index.css", serveStatic({ path: "./dashboard/public/index.css" }));

    // Serve other assets
    this.app.use("/*", serveStatic({ root: "./dashboard/public" }));

    // SPA Fallback (Must be last)
    this.app.get("*", serveStatic({ path: "./dashboard/public/index.html" }));
  }

  async start() {
    console.log(chalk.gray(`[Engine] Initializing...`));
    this.server = Bun.serve({
      fetch: this.app.fetch,
      port: this.port,
      websocket: websocket
    });

    // Update port if 0 was used
    this.port = this.server.port;

    console.log(chalk.green.bold(`🚀 Stigmergy Engine is Live!`));
    console.log(chalk.blue(`👉 Dashboard: `) + chalk.white.bold.underline(`http://localhost:${this.port}`));
  }

  async stop() {
    if (this.server) this.server.stop();
    if (this.ownsStateManager && this.stateManager) await this.stateManager.closeDriver();
  }
}
