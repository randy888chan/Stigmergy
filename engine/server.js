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

// Infrastructure
import { GraphStateManager } from "./infrastructure/state/GraphStateManager.js";
import { createExecutor } from "./tool_executor.js";
import { getAiProviders } from "../ai/providers.js";
import { unifiedIntelligenceService } from "../services/unified_intelligence.js";
import { TrajectoryRecorder } from "../services/trajectory_recorder.js";
import * as fileSystem from "../tools/file_system.js";
import { createCoderagTool } from "../tools/coderag_tool.js";

const { upgradeWebSocket, websocket } = createBunWebSocket();

export class Engine {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    // Allow override via options, otherwise look in current dir
    this.corePath = options.corePath || path.join(process.cwd(), ".stigmergy-core");
    this.config = options.config;

    if (!this.config) throw new Error("Engine requires config.");

    this.fs = options._test_fs || fs;
    this._test_streamText = options._test_streamText;
    this._test_unifiedIntelligenceService = options._test_unifiedIntelligenceService;
    this._test_executorFactory = options._test_executorFactory;

    this.unifiedIntelligenceService = this._test_unifiedIntelligenceService || unifiedIntelligenceService;
    this.ownsStateManager = !options.stateManager;

    this.stateManager = options.stateManager || new GraphStateManager(this.projectRoot);
    this.stateManagerInitializationPromise = options.stateManager ? Promise.resolve() : this.stateManager.initialize();

    if (!this._test_streamText) {
      this.ai = getAiProviders(this.config);
    }

    this.toolExecutorPromise = this.stateManagerInitializationPromise.then(() => {
      this.trajectoryRecorder = options.trajectoryRecorder || new TrajectoryRecorder(this.stateManager);
      return this.initializeToolExecutor();
    });

    this.app = new Hono();
    this.port = Number(process.env.STIGMERGY_PORT) || 3010;
    this.clients = new Set();
    this.pendingApprovals = new Map();

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

  broadcastEvent(type, payload) {
    const message = JSON.stringify({ type, payload });
    for (const ws of this.clients) {
        if (ws.readyState === 1) ws.send(message);
        else if (ws.readyState === 3) this.clients.delete(ws);
    }
  }

  async triggerAgent(agentId, prompt, options = {}) {
    console.log(chalk.yellow(`[Engine] Triggering agent ${agentId}`));
    this.broadcastEvent("agent_start", { agentId });

    await this.toolExecutorPromise;
    const executeTool = this.toolExecutor;
    const agentName = agentId.replace("@", "");
    const workingDirectory = path.join(this.projectRoot, ".stigmergy/sandboxes", agentName);

    try {
        await this.fs.promises.mkdir(workingDirectory, { recursive: true });
    } catch(e) { /* Ignore if exists */ }

    try {
        // 1. Load Definition (Hardened)
        const agentPath = path.join(this.corePath, "agents", `${agentName}.md`);
        let systemPrompt = "You are a helpful AI assistant.";

        try {
            if (await this.fs.pathExists(agentPath)) {
                const content = await this.fs.readFile(agentPath, "utf-8");
                const match = content.match(/```yaml\s*([\s\S]*?)```/);
                if (match) {
                    const def = yaml.load(match[1]);
                    if (def.agent?.persona) systemPrompt = `${def.agent.persona.role} ${def.agent.persona.identity}`;
                    if (def.agent?.core_protocols) systemPrompt += `\nProtocols:\n${def.agent.core_protocols.join('\n')}`;
                }
            } else {
                console.warn(`[Engine] Agent definition not found at: ${agentPath}. Using default prompt.`);
            }
        } catch (e) {
            console.warn(`[Engine] Failed to load agent def: ${e.message}. Using default prompt.`);
        }

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ];

        let isDone = false;
        let turnCount = 0;
        let lastText = "";

        while (!isDone && turnCount < 15) {
            turnCount++;
            let attempts = 0;
            let result = null;

            while(attempts < 3) {
                try {
                    const streamTextFunc = this._test_streamText || streamText;
                    let model = null;
                    if (!this._test_streamText) {
                        const tier = agentName === 'analyst' ? 'research_tier' : 'reasoning_tier';
                        const { client, modelName } = this.ai.getModelForTier(tier, null, this.config);
                        model = client(modelName);
                    }

                    result = await streamTextFunc({
                        model,
                        messages,
                        tools: await executeTool.getTools(agentName)
                    });
                    break;
                } catch(e) {
                    attempts++;
                    console.warn(`[AI] Error ${attempts}: ${e.message}`);
                    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts)));
                    if(attempts === 3) throw e;
                }
            }

            // Await promises from result (Crucial for AI SDK compatibility)
            const text = await result.text;
            const toolCalls = await result.toolCalls;
            const finishReason = await result.finishReason;
            lastText = text;

            if (text || (toolCalls && toolCalls.length > 0)) {
                if (text) this.broadcastEvent("agent_thought", { agentId, text });
                messages.push({
                    role: "assistant",
                    content: text || "",
                    tool_calls: toolCalls?.length > 0 ? toolCalls : undefined
                });
            }

            if (finishReason === "stop" || finishReason === "length") {
                isDone = true;
            } else if (toolCalls && toolCalls.length > 0) {
                const toolResults = [];
                for (const call of toolCalls) {
                    this.broadcastEvent("tool_start", { tool: call.toolName, args: call.args });
                    try {
                        if (call.toolName === 'system.request_human_approval') {
                            const requestId = `req_${Date.now()}`;
                            this.broadcastEvent("human_approval_request", { requestId, message: call.args.message, data: call.args.data });
                            const decision = await new Promise((resolve) => { this.pendingApprovals.set(requestId, resolve); });
                            const output = decision === 'approved' ? "Approved" : "Rejected";
                            toolResults.push({ role: "tool", tool_call_id: call.toolCallId, tool_name: call.toolName, content: output });
                            this.broadcastEvent("tool_end", { tool: call.toolName, result: output });
                            continue;
                        }

                        const output = await executeTool.execute(call.toolName, call.args, agentName, workingDirectory);
                        toolResults.push({ role: "tool", tool_call_id: call.toolCallId, tool_name: call.toolName, content: JSON.stringify(output) });
                        this.broadcastEvent("tool_end", { tool: call.toolName, result: output });
                    } catch (e) {
                        toolResults.push({ role: "tool", tool_call_id: call.toolCallId, tool_name: call.toolName, content: `Error: ${e.message}` });
                        this.broadcastEvent("tool_end", { tool: call.toolName, error: e.message });
                    }
                }
                messages.push(...toolResults);
                isDone = false;
            }
        }
        this.broadcastEvent("agent_response", { agentId, text: lastText });
        return lastText;

    } catch (e) {
        console.error(chalk.red(`[Engine] Agent Error: ${e.message}`));
        this.broadcastEvent("log", { level: "error", message: e.message });
        throw e;
    }
  }

  setupRoutes() {
    this.app.use("*", cors());

    // Resolve Helper
    const resolveSafePath = (p) => {
        if (!p || p === 'undefined') return this.projectRoot;
        if (p.startsWith("~")) return path.join(os.homedir(), p.slice(1));
        return path.resolve(this.projectRoot, p);
    };

    // --- API ROUTES ---
    this.app.get("/api/health", (c) => c.json({ status: "ok" }));

    this.app.get("/api/projects", async (c) => {
        try {
            const basePath = resolveSafePath(c.req.query("basePath") || "~");
            console.log(`[API] Projects at ${basePath}`);
            if (!await fs.pathExists(basePath)) return c.json({error: "Path not found"}, 404);
            const ent = await fs.readdir(basePath, {withFileTypes:true});
            const folders = ent.filter(e=>e.isDirectory()&&!e.name.startsWith('.')).map(e=>e.name);
            return c.json({ currentPath: basePath, folders });
        } catch(e) { return c.json({error: e.message}, 500); }
    });

    this.app.get("/api/files", async (c) => {
        try {
            // Use listFiles for recursive list as expected by the dashboard
            const files = await fileSystem.listFiles({ directory: resolveSafePath(c.req.query("path")) });
            return c.json(files);
        } catch (e) { return c.json({error:e.message}, 500); }
    });

    this.app.get("/api/file-content", async (c) => {
        try {
            const p = resolveSafePath(c.req.query("path"));
            if(await fs.pathExists(p)) return c.json({ content: await fs.readFile(p, 'utf-8') });
            return c.json({error:"Not found"}, 404);
        } catch(e) { return c.json({error:e.message}, 500); }
    });

    this.app.post("/api/file-content", async (c) => {
        try {
            const {path:p, content} = await c.req.json();
            await this.toolExecutor.execute("file_system.writeFile", {path:p, content}, "user-ide", this.projectRoot);
            return c.json({success:true});
        } catch(e) { return c.json({error:e.message}, 500); }
    });

    this.app.get("/api/state", async(c) => c.json(await this.stateManager.getState()));

    this.app.get("/api/mission-plan", async (c) => {
        try {
            const state = await this.stateManager.getState();
            return c.json(state.project_manifest || { tasks: [], message: "No active plan." });
        } catch (e) { return c.json({ error: e.message }, 500); }
    });

    this.app.get("/api/proposals", async (c) => {
        try {
            const proposalsDir = path.join(this.corePath, 'proposals');
            if (!await fs.pathExists(proposalsDir)) return c.json([]);
            const files = await fs.readdir(proposalsDir);
            const proposals = await Promise.all(
                files.filter(f => f.endsWith('.json')).map(async f => {
                    try { return await fs.readJson(path.join(proposalsDir, f)); } catch (e) { return null; }
                })
            );
            return c.json(proposals.filter(p => p !== null));
        } catch (e) { return c.json({ error: e.message }, 500); }
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
        } catch (e) { return c.json({ error: e.message }, 500); }
    });

    // --- WEBSOCKET ---
    this.app.get("/ws", upgradeWebSocket((c) => {
        return {
            onOpen: (_event, ws) => {
                this.clients.add(ws);
            },
            onMessage: async (event, ws) => {
                if (event.data === "ping") { ws.send("pong"); return; }
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'chat_message') {
                        this.triggerAgent("@conductor", data.payload.content).catch(e => console.error(e));
                    } else if (data.type === 'stop_mission') {
                        this.broadcastEvent("state_update", { project_status: "Stopped" });
                    } else if (data.type === 'set_project') {
                        console.log(`[WS] Switching to: ${data.payload.path}`);
                        this.projectRoot = data.payload.path;
                        await fs.ensureDir(data.payload.path);

                        // FIX: Broadcast the switch back to the client so it knows to load files
                        this.broadcastEvent("project_switched", { path: data.payload.path });

                        this.triggerAgent("@system", `Scan docs in ${data.payload.path}`, { timeout: 30000 }).catch(()=>{});
                    } else if (data.type === 'human_approval_response') {
                        const { requestId, decision } = data.payload;
                        const resolve = this.pendingApprovals.get(requestId);
                        if (resolve) {
                            resolve(decision);
                            this.pendingApprovals.delete(requestId);
                        }
                    }
                } catch (e) { console.error("WS Error:", e); }
            },
            onClose: (_event, ws) => {
                this.clients.delete(ws);
            },
        };
    }));

    // --- STATIC FILES ---
    this.app.get("/index.js", serveStatic({ path: "./dashboard/public/index.js" }));
    this.app.get("/index.css", serveStatic({ path: "./dashboard/public/index.css" }));
    this.app.use("/*", serveStatic({ root: "./dashboard/public" }));
    this.app.get("*", serveStatic({ path: "./dashboard/public/index.html" }));
  }

  async start() {
    console.log(chalk.gray(`[Engine] Initializing...`));
    this.server = Bun.serve({ fetch: this.app.fetch, port: this.port, websocket: websocket });
    console.log(chalk.green.bold(`🚀 Stigmergy Engine is Live!`));
    console.log(chalk.blue(`👉 Dashboard: `) + chalk.white.bold.underline(`http://localhost:${this.port}`));
  }

  async stop() { if(this.server) this.server.stop(); if(this.stateManager) await this.stateManager.closeDriver(); }
}
