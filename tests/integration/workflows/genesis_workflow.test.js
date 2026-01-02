import { test, describe, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";
import yaml from "js-yaml";

const mockStreamText = mock();

describe("Genesis Agent Workflow", () => {
  let engine;
  let projectRoot;
  let stateManager;
  let Engine;

  beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();

    projectRoot = path.resolve("/test-genesis-project");
    await vol.promises.mkdir(projectRoot, { recursive: true });

    // --- 1. Robust Mocks ---

    mock.module("../../../services/tracing.js", () => ({
      sdk: { shutdown: () => Promise.resolve() },
    }));

    mock.module("../../../services/unified_intelligence.js", () => ({
      unifiedIntelligenceService: {},
    }));

    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);

    // SMART SHELL MOCK
    mock.module("../../../tools/shell.js", () => ({
      execute: async ({ command, cwd }) => {
        console.log(`[Mock Shell] Executing: '${command}' in '${cwd}'`);

        if (!command) return "";

        // Handle mkdir (with support for -p and multiple args)
        if (command.startsWith("mkdir")) {
           // Split by space, filter out 'mkdir' and flags starting with '-'
           const dirs = command.split(" ")
             .map(s => s.trim())
             .filter(s => s && s !== "mkdir" && !s.startsWith("-"));

           for (const dir of dirs) {
               // Use cwd if available, otherwise relative to root
               const targetPath = cwd ? path.join(cwd, dir) : dir;
               try {
                   await vol.promises.mkdir(targetPath, { recursive: true });
                   console.log(`[Mock Shell] Created dir: ${targetPath}`);
               } catch (e) {
                   console.error(`[Mock Shell] Error creating ${targetPath}:`, e);
               }
           }
           return "";
        }

        // Handle npm/bun init
        if (command.includes("init")) {
           const targetPath = cwd ? path.join(cwd, "package.json") : "package.json";
           await vol.promises.writeFile(targetPath, JSON.stringify({ name: "test-project" }));
           return "";
        }

        // Handle git init (fallback if git_tool isn't used)
        if (command.includes("git init")) {
            const gitDir = cwd ? path.join(cwd, ".git") : ".git";
            await vol.promises.mkdir(gitDir, { recursive: true });
            return "";
        }

        return "mock execution success";
      }
    }));

    // SIMPLE GIT MOCK
    mock.module("simple-git", () => {
      return {
        default: (basePath) => ({
            init: async () => ({ initialized: true }),
            add: async () => ({ success: true }),
            commit: async () => ({ commit: "mock-hash", summary: { changes: 1 } }),
            cwd: () => basePath || "/"
        }),
        simpleGit: (basePath) => ({
             init: async () => ({ initialized: true }),
             add: async () => ({ success: true }),
             commit: async () => ({ commit: "mock-hash", summary: { changes: 1 } }),
             cwd: () => basePath || "/"
        })
      };
    });

    mock.module("ai", () => ({ streamText: mockStreamText }));

    mock.module("../../../services/config_service.js", () => ({
      configService: {
        getConfig: () => ({
          model_tiers: { reasoning_tier: { provider: "mock", model_name: "mock-model" } },
          providers: { mock_provider: { api_key: "mock-key" } },
          security: { allowedDirs: ["/"] } // Allow all for test
        }),
      },
    }));

    // --- 2. Engine Setup ---

    const engineModule = await import("../../../engine/server.js");
    Engine = engineModule.Engine;
    const stateManagerModule = await import("../../../src/infrastructure/state/GraphStateManager.js");
    const GraphStateManager = stateManagerModule.GraphStateManager;
    const toolExecutorModule = await import("../../../engine/tool_executor.js");
    const realCreateExecutor = toolExecutorModule.createExecutor;

    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.ensureDir(agentDir);

    // Create Agent Definition
    const genesisAgentContent = `
\`\`\`yaml
agent:
  id: "@genesis"
  engine_tools: ["shell.*", "git_tool.*", "file_system.*"]
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, "genesis.md"), genesisAgentContent);
    await mockFs.promises.writeFile(path.join(agentDir, "auditor.md"), `\`\`\`yaml\nagent:\n  id: "auditor"\n\`\`\``);

    // Create Mock Driver
    const mockDriver = {
      session: () => ({
        run: () => Promise.resolve({ records: [], summary: {} }),
        close: () => Promise.resolve(),
      }),
      close: () => Promise.resolve(),
    };

    stateManager = new GraphStateManager(projectRoot, mockDriver);

    // Factory with Mock FS injection
    const testExecutorFactory = async (engineInstance, ai, options, fs) => {
      const finalOptions = {
        ...options,
        unifiedIntelligenceService: {},
        fs: mockFs
      };
      return await realCreateExecutor(engineInstance, ai, finalOptions, fs);
    };

    const { configService } = await import("../../../services/config_service.js");
    const mockConfig = configService.getConfig();

    engine = new Engine({
      projectRoot,
      corePath: process.env.STIGMERGY_CORE_PATH,
      stateManager,
      config: mockConfig,
      startServer: false,
      _test_streamText: mockStreamText,
      _test_fs: mockFs, // Critical: Engine uses mock fs
      _test_executorFactory: testExecutorFactory,
    });
  });

  afterEach(async () => {
    if (engine) await engine.stop();
    mock.restore();
  });

  test("should initialize a new project according to ENTERPRISE_SCAFFOLD_PROTOCOL", async () => {
    const prompt = "Create a new project";

    // Simulate the sequence of tool calls expected from the Enterprise Protocol
    // 1. mkdir -p apps/web apps/api packages/shared
    // 2. npm init (shell)
    // 3. git init
    // 4. docker-compose (file_system)

    const toolCalls = [
      {
        toolCallId: "1",
        toolName: "shell.execute",
        args: { command: "mkdir -p apps/web apps/api packages/shared" }
      },
      {
        toolCallId: "2",
        toolName: "file_system.writeFile",
        args: { path: "docker-compose.yml", content: "version: '3'" }
      }
    ];

    mockStreamText
      .mockResolvedValueOnce({
        text: "I will scaffold the enterprise structure.",
        toolCalls: [toolCalls[0]],
        finishReason: "tool-calls",
      })
      .mockResolvedValueOnce({
         // Auditor Check (if active)
         text: JSON.stringify({ compliant: true }),
         finishReason: "stop"
      })
      .mockResolvedValueOnce({
        text: "Directory created. Now creating docker-compose.",
        toolCalls: [toolCalls[1]],
        finishReason: "tool-calls",
      })
      .mockResolvedValueOnce({
         text: JSON.stringify({ compliant: true }),
         finishReason: "stop"
      })
      .mockResolvedValueOnce({
        text: "Done.",
        finishReason: "stop",
      });

    await engine.triggerAgent("@genesis", prompt);

    const agentSandboxPath = path.join(projectRoot, ".stigmergy", "sandboxes", "genesis");

    // Verify directory creation (The assertion that was failing)
    let dirExists = false;
    try {
      const stats = await mockFs.promises.stat(path.join(agentSandboxPath, "apps/api"));
      dirExists = stats.isDirectory();
    } catch (e) {
      console.log("Directory verification failed:", e.message);
    }
    expect(dirExists).toBe(true);

    // Verify file creation
    let fileContent;
    try {
        fileContent = await mockFs.promises.readFile(path.join(agentSandboxPath, "docker-compose.yml"), "utf-8");
    } catch(e) {}
    expect(fileContent).toBe("version: '3'");
  });
});
