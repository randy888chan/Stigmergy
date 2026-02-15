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
    // FIX: Prioritize options.corePath (for tests) over Env Var
    this.corePath = options.corePath || process.env.STIGMERGY_CORE_PATH || path.join(this.projectRoot, ".stigmergy-core");
    this.config = options.config || {};

    this.fs = options._test_fs || fs;
    this.fsPromises = this.fs.promises || this.fs;
    this._test_streamText = options._test_streamText;
    this._test_unifiedIntelligenceService = options._test_unifiedIntelligenceService;
    this._test_executorFactory = options._test_executorFactory;

    this.unifiedIntelligenceService = this._test_unifiedIntelligenceService || unifiedIntelligenceService;
    this.ownsStateManager = !options.stateManager;

    this.stateManager = options.stateManager || new GraphStateManager(this.projectRoot);
    this.stateManagerInitializationPromise = options.stateManager ? Promise.resolve() : this.stateManager.initialize();

    if (!this._test_streamText && this.config.model_tiers) {
      this.ai = getAiProviders(this.config);
    }

    this.toolExecutorPromise = this.stateManagerInitializationPromise.then(() => {
      this.trajectoryRecorder = options.trajectoryRecorder || new TrajectoryRecorder(this.stateManager);
      return this.initializeToolExecutor();
    });

    this.app = new Hono();
    // FIX: Use random port (0) if options.port is explicitly 0, else fallback to Env/3010
    this.port = options.port !== undefined ? options.port : (Number(process.env.STIGMERGY_PORT) || 3010);
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
        try {
            // Bun/Hono WSContext doesn't always have readyState 1.
            // We trust the Set since we manage onOpen/onClose.
            ws.send(message);
        } catch (e) {
            console.error(`[Engine] Failed to broadcast to a client: ${e.message}`);
            this.clients.delete(ws);
        }
    }
  }

  async triggerAgent(agentId, prompt, options = {}) {
    console.log(chalk.yellow(`[Engine] Triggering agent ${agentId}`));
    this.broadcastEvent("agent_start", { agentId });

    await this.toolExecutorPromise;
    const executeTool = this.toolExecutor;
    const agentName = agentId.replace("@", "");
    const workingDirectory = options.workingDirectory || path.join(this.corePath, "sandboxes", agentName);

    try { await this.fsPromises.mkdir(workingDirectory, { recursive: true }); } catch(e) {}

    try {
        const agentPath = path.join(this.corePath, "agents", `${agentName}.md`);
        let systemPrompt = "You are a helpful AI assistant.";

        try {
            // Use this.fs (which handles mocks) instead of fs directly
            const content = await this.fsPromises.readFile(agentPath, "utf-8");
            const match = content.match(/```yaml\s*([\s\S]*?)```/);
            if (match) {
                const def = yaml.load(match[1]);
                if (def.agent?.persona) systemPrompt = `${def.agent.persona.role} ${def.agent.persona.identity}`;
                if (def.agent?.core_protocols) systemPrompt += `\nProtocols:\n${def.agent.core_protocols.join('\n')}`;
            }
        } catch (e) { console.warn(`[Engine] Failed to load def for ${agentName}: ${e.message}`); }

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
                    if (!this._test_streamText && this.ai) {
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
                    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts)));
                    if(attempts === 3) throw e;
                }
            }

            // Explicitly await results for compatibility with Vercel AI SDK
            const text = await result.text;
            const toolCalls = await result.toolCalls;
            const finishReason = await result.finishReason;
            lastText = text;

            if (text) {
                this.broadcastEvent("agent_thought", { agentId, text });
            }

            // Consolidate text and tool_calls into a single assistant message
            const assistantMsg = { role: "assistant", content: text || "" };
            if (toolCalls && toolCalls.length > 0) {
                assistantMsg.tool_calls = toolCalls;
            }
            messages.push(assistantMsg);

            if (finishReason === "stop" || finishReason === "length") {
                isDone = true;
            } else if (toolCalls?.length > 0) {
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

    const resolveSafePath = (p) => {
        if (!p || p === 'undefined') return this.projectRoot;
        if (p.startsWith("~")) return path.join(os.homedir(), p.slice(1));
        return path.resolve(this.projectRoot, p);
    };

    // APIs
    this.app.get("/health", (c) => c.json({ status: "ok" }));
    this.app.get("/api/health", (c) => c.json({ status: "ok" }));
    this.app.get("/api/state", async(c) => c.json(await this.stateManager.getState()));
    this.app.get("/api/proposals", (c) => c.json([]));
    this.app.get("/api/mission-plan", (c) => c.json({ phases: [] }));
    this.app.get("/api/activity", (c) => c.json([]));

    this.app.get("/api/projects", async (c) => {
        try {
            const basePath = resolveSafePath(c.req.query("basePath") || "~");
            try {
                await this.fsPromises.access(basePath);
            } catch (e) {
                return c.json({error: "Path not found"}, 404);
            }
            const ent = await this.fsPromises.readdir(basePath, {withFileTypes:true});
            return c.json({
                currentPath: basePath,
                folders: ent.filter(e=>e.isDirectory()&&!e.name.startsWith('.')).map(e=>e.name)
            });
        } catch(e) { return c.json({error: e.message}, 500); }
    });

    this.app.get("/api/files", async (c) => {
        try {
            // Restore listFiles for flat array and cap at 5000
            const files = await fileSystem.listFiles({ directory: resolveSafePath(c.req.query("path")) }, this.fs);
            return c.json(files.slice(0, 5000));
        } catch (e) { return c.json({error:e.message}, 500); }
    });

    this.app.get("/api/file-content", async (c) => {
        try {
            const p = resolveSafePath(c.req.query("path"));
            try {
                await this.fsPromises.access(p);
                return c.json({ content: await this.fsPromises.readFile(p, 'utf-8') });
            } catch (e) {
                return c.json({error:"Not found"}, 404);
            }
        } catch(e) { return c.json({error:e.message}, 500); }
    });

    this.app.post("/api/file-content", async (c) => {
        try {
            const {path:p, content} = await c.req.json();
            await this.toolExecutor.execute("file_system.writeFile", {path:p, content}, "user-ide", this.projectRoot);
            return c.json({success:true});
        } catch(e) { return c.json({error:e.message}, 500); }
    });

    this.app.post("/api/upload", async (c) => {
        try {
            const formData = await c.req.formData();
            const file = formData.get("file");
            const target = c.req.query("target") || "global"; // 'project' or 'global'

            if (!file || !(file instanceof Blob)) {
                return c.json({ error: "No file uploaded" }, 400);
            }

            const buffer = await file.arrayBuffer();
            // SECURITY: Sanitize fileName to prevent path traversal
            const fileName = path.basename(file.name);

            let uploadDir;
            if (target === 'project') {
                uploadDir = path.join(this.projectRoot, "uploads");
            } else {
                uploadDir = path.join(this.corePath, "uploads");
            }

            await this.fsPromises.mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, fileName);
            await this.fsPromises.writeFile(filePath, new Uint8Array(buffer));

            console.log(chalk.green(`[Engine] File uploaded: ${fileName} -> ${filePath}`));

            return c.json({
                success: true,
                message: `File ${fileName} uploaded successfully to ${target} storage.`,
                path: filePath
            });
        } catch (e) {
            console.error(chalk.red(`[Engine] Upload Error: ${e.message}`));
            return c.json({ error: e.message }, 500);
        }
    });

    // WEBSOCKET (Heartbeat 10s)
    this.app.get("/ws", upgradeWebSocket((c) => {
        return {
            onOpen: (_event, ws) => { this.clients.add(ws); },
            onMessage: async (event, ws) => {
                // Heartbeat must be handled first, before any other logic.
                if (event.data?.toString() === "ping") {
                    ws.send("pong");
                    return;
                }

                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'chat_message') {
                        this.triggerAgent("@conductor", data.payload.content).catch(e => console.error(e));
                    } else if (data.type === 'stop_mission') {
                        this.broadcastEvent("state_update", { project_status: "Stopped" });
                    } else if (data.type === 'set_project') {
                        console.log(`[WS] Switching to: ${data.payload.path}`);
                        this.projectRoot = data.payload.path;
                        if (this.ownsStateManager && this.stateManager) await this.stateManager.closeDriver();
                        this.stateManager = new GraphStateManager(this.projectRoot);
                        await this.stateManager.initialize();
                        this.trajectoryRecorder = new TrajectoryRecorder(this.stateManager);
                        this.toolExecutor = await this.initializeToolExecutor();

                        try {
                            await this.fsPromises.mkdir(data.payload.path, { recursive: true });
                        } catch (e) {}

                        this.broadcastEvent("project_switched", { path: data.payload.path });

                        this.triggerAgent("@system", `Scan docs in ${data.payload.path}`, { timeout: 30000 }).catch(()=>{});
                    } else if (data.type === 'human_approval_response') {
                        const { requestId, decision } = data.payload;
                        const resolve = this.pendingApprovals.get(requestId);
                        if (resolve) { resolve(decision); this.pendingApprovals.delete(requestId); }
                    }
                } catch (e) { console.error("WS Error:", e); }
            },
            onClose: (_event, ws) => { this.clients.delete(ws); },
        };
    }));

    // STATIC
    this.app.get("/index.js", serveStatic({ path: "./dashboard/public/index.js" }));
    this.app.get("/index.css", serveStatic({ path: "./dashboard/public/index.css" }));
    this.app.use("/*", serveStatic({ root: "./dashboard/public" }));
    this.app.get("*", serveStatic({ path: "./dashboard/public/index.html" }));
  }

  async start() {
    console.log(chalk.gray(`[Engine] Initializing...`));
    this.server = Bun.serve({ fetch: this.app.fetch, port: this.port, websocket: websocket });
    this.port = this.server.port;
    console.log(chalk.green.bold(`🚀 Stigmergy Engine is Live!`));
    console.log(chalk.blue(`👉 Dashboard: `) + chalk.white.bold.underline(`http://localhost:${this.port}`));
  }

  async stop() { if(this.server) this.server.stop(); if(this.stateManager) await this.stateManager.closeDriver(); }
}
