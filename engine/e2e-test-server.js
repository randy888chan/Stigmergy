import { Engine } from "./server.js";
import { configService } from "../services/config_service.js";
import chalk from "chalk";

/**
 * Creates and initializes a new Engine instance for E2E testing.
 */
async function main() {
  try {
    await configService.initialize();
    const config = configService.getConfig();

    const mockResponses = {
      '@analyst': "This is a mock analyst report.",
      '@specifier': "```yaml\ntasks:\n  - task: Create initial file\n    agent: executor\n    actions:\n      - tool: file_system.writeFile\n        args:\n          path: hello.js\n          content: \"console.log('hello world from mock');\"\n```",
    };

    const mockUnifiedIntelligenceService = {
      isInitialized: true,
      scanCodebase: async () => {
        console.log(chalk.bgYellow.black("[Mock AI] scanCodebase called"));
        return;
      },
      search: async () => ({ results: [], condensed_preamble: "Mock search results." }),
      triggerAgent: async (agentId) => {
        console.log(chalk.bgYellow.black(`[Mock AI] Triggered for agent: ${agentId}`));
        const response = mockResponses[agentId] || `Default mock response for ${agentId}.`;
        console.log(chalk.bgYellow.black(`[Mock AI] Responding with: "${response.substring(0, 50)}..."`));
        return response;
      },
    };

    const engineOptions = {
      config,
      _test_unifiedIntelligenceService: mockUnifiedIntelligenceService,
    };

    const engine = new Engine(engineOptions);

    await engine.stateManagerInitializationPromise;
    await engine.toolExecutorPromise;
    await engine.start();

    process.on("SIGINT", async () => {
      await engine.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await engine.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error(chalk.red("Failed to start the Stigmergy E2E Test Engine:"), error);
    process.exit(1);
  }
}

main();
