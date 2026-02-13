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
import * as swarmTools from "../tools/swarm_intelligence_tools.js";
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

    this.explicitlySetProject = false;
    this.app = new Hono();
    const envPort = process.env.STIGMERGY_PORT;
    this.port = envPort ? Number(envPort) : (this.config?.server?.port !== undefined ? this.config.server.port : 3010);
    this.clients = new Set();
    this.pendingApprovals = new Map();

    this.setupRoutes();
  }

  broadcastEvent(type, payload) {
    const message = JSON.stringify({ type, payload });
    // Use a copy to avoid modification during iteration
    const activeClients = Array.from(this.clients);

    for (const ws of activeClients) {
      try {
        // In Hono/Bun, ws is a WSContext.
        const readyState = ws.raw?.readyState;
        // readyState 1 is OPEN. If readyState is undefined, we assume it's okay to try.
        if (readyState === undefined || readyState === 1) {
            ws.send(message);
        } else {
            this.clients.delete(ws);
        }
      } catch (e) {
        console.warn(chalk.yellow(`[WS] Broadcast failed (removing client): ${e.message}`));
        this.clients.delete(ws);
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
        const workingDirectory = options.workingDirectory || path.join(this.corePath, "sandboxes", agentName);
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

        // Final response broadcast
        this.broadcastEvent("agent_response", { agentId, text: lastText });
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
      const start = Date.now();
      const method = c.req.method;
      const path = c.req.path;
      console.log(chalk.gray(`[REQ] ${method} ${path}`));
      await next();
      const duration = Date.now() - start;
      const color = c.res.status >= 400 ? chalk.red : chalk.green;
      console.log(chalk.gray(`[RES] ${method} ${path} `) + color(c.res.status) + chalk.gray(` (${duration}ms)`));
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

    this.app.get("/api/health", async (c) => {
      try {
        const health = await swarmTools.get_system_health_overview();
        return c.json(health);
      } catch (e) {
        return c.json({ error: e.message }, 500);
      }
    });

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
         let files = await fileSystem.listFiles({ directory: targetPath });

         // Safety cap: limit to 5000 files to prevent frontend explosion
         if (Array.isArray(files) && files.length > 5000) {
             console.warn(chalk.yellow(`[API] Truncating file list from ${files.length} to 5000 for path: ${targetPath}`));
             files = files.slice(0, 5000);
         }

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

    // 5.5 Mission Plan & Upload APIs
    this.app.get("/api/mission-plan", async (c) => {
        try {
            const state = await this.stateManager.getState();
            return c.json(state.project_manifest || { tasks: [], message: "No active plan." });
        } catch (e) {
            return c.json({ error: e.message }, 500);
        }
    });

    this.app.get("/api/proposals", async (c) => {
        try {
            const proposalsDir = path.join(this.corePath, 'proposals');
            if (!await fs.pathExists(proposalsDir)) {
                return c.json([]);
            }
            const files = await fs.readdir(proposalsDir);
            const proposals = await Promise.all(
                files
                    .filter(f => f.endsWith('.json'))
                    .map(async f => {
                        try {
                            return await fs.readJson(path.join(proposalsDir, f));
                        } catch (e) {
                            return null;
                        }
                    })
            );
            return c.json(proposals.filter(p => p !== null));
        } catch (e) {
            console.error(chalk.red("[API Error] /api/proposals:"), e);
            return c.json({ error: e.message }, 500);
        }
    });

    this.app.post("/api/proposals/:id/:decision", async (c) => {
        try {
            const { id, decision } = c.req.param();
            console.log(chalk.blue(`[API] Proposal ${id} ${decision}`));
            return c.json({ success: true, id, decision });
        } catch (e) {
            return c.json({ error: e.message }, 500);
        }
    });

    this.app.post("/api/upload", async (c) => {
        try {
            const body = await c.req.parseBody();
            const file = body['file'];
            if (!file) return c.json({ error: "No file uploaded" }, 400);

            const uploadDir = path.join(this.projectRoot, "uploads");
            await fs.ensureDir(uploadDir);
            const safeFileName = path.basename(file.name);
            const filePath = path.join(uploadDir, safeFileName);

            const arrayBuffer = await file.arrayBuffer();
            await fs.writeFile(filePath, Buffer.from(arrayBuffer));

            return c.json({ success: true, message: `File ${file.name} uploaded to ${uploadDir}` });
        } catch (e) {
            return c.json({ error: e.message }, 500);
        }
    });

    // 6. WebSocket
    this.app.get("/ws", upgradeWebSocket((c) => ({
       onOpen: (event, ws) => {
         const clientIp = ws.remoteAddress || "unknown";
         console.log(chalk.green(`[WS] Connected from ${clientIp}`));
         this.clients.add(ws);

         // Send initial state asynchronously to avoid blocking the upgrade process
         this.stateManagerInitializationPromise.then(() => this.stateManager.getState()).then(state => {
             const readyState = ws.raw?.readyState;

             // Only send if the client is still in our active set and is OPEN (readyState 1)
             // If readyState is undefined, we are in a non-standard environment (like some tests), so we try to send.
             if (!this.clients.has(ws) || (readyState !== undefined && readyState !== 1)) {
                 if (readyState === 3) { // CLOSED
                    this.clients.delete(ws);
                 } else if (readyState !== undefined) {
                    console.warn(chalk.yellow(`[WS] Skipping initial state: WebSocket readyState is ${readyState}`));
                    this.clients.delete(ws);
                 }
                 return;
             }

             const payload = {
                 project_path: this.explicitlySetProject ? this.projectRoot : '',
                 project_status: state.project_status || 'Idle'
             };

             try {
                ws.send(JSON.stringify({
                    type: 'state_update',
                    payload
                }));
                console.log(chalk.gray("[WS] Initial state sent:"), payload);
             } catch (sendErr) {
                console.warn(chalk.yellow("[WS] Failed to send initial state (client may have disconnected):"), sendErr.message);
                this.clients.delete(ws);
             }
         }).catch(e => {
             console.error(chalk.red("[WS] Failed to retrieve state for initial broadcast:"), e);
         });
       },
       onMessage: async (event, ws) => {
         try {
             const data = JSON.parse(event.data);
             console.log(chalk.blue(`[WS] Received: ${data.type}`), data.payload || "");

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
                 this.explicitlySetProject = true;
                 // Broadcast both state_update (standard) and project_switched (legacy/convenience)
                 this.broadcastEvent('state_update', { project_path: this.projectRoot });
                 this.broadcastEvent('project_switched', { path: this.projectRoot });
             }
         } catch (e) {
             console.error(chalk.red("[WS Error]"), e);
         }
       },
       onClose: (event, ws) => {
         const color = (event.code === 1000 || event.code === 1001) ? chalk.gray : chalk.yellow;
         console.log(color(`[WS] Disconnected (Code: ${event.code}, Reason: ${event.reason || 'none'})`));
         this.clients.delete(ws);
       },
       onError: (event, ws) => {
         console.error(chalk.red("[WS] Server-side WebSocket error:"), event);
       }
    })));

    // --- STATIC ASSETS ---
    // This MUST be before the "*" route
    this.app.get("/index.js", serveStatic({ path: "./dashboard/public/index.js" }));
    this.app.get("/index.css", serveStatic({ path: "./dashboard/public/index.css" }));

    // Silencing Chrome DevTools annoying 404
    this.app.get("/.well-known/appspecific/com.chrome.devtools.json", (c) => c.json({}));

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

    // Start heartbeat to keep connections alive and prune stale ones
    this.startHeartbeat();

    console.log(chalk.green.bold(`🚀 Stigmergy Engine is Live!`));
    console.log(chalk.blue(`👉 Dashboard: `) + chalk.white.bold.underline(`http://localhost:${this.port}`));
  }

  startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.broadcastEvent("heartbeat", { timestamp: Date.now() });
    }, 30000); // 30s heartbeat
  }

  async stop() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.server) this.server.stop();
    if (this.ownsStateManager && this.stateManager) await this.stateManager.closeDriver();
  }
}
