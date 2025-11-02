import { Engine } from "./server.js";
import { configService } from "../services/config_service.js";
import chalk from "chalk";

/**
 * Creates and initializes a new Engine instance.
 * This is the correct, asynchronous way to start the application.
 */
async function main() {
  try {
    // 1. Initialize the configuration service. This is the source of all config.
    await configService.initialize();
    const config = configService.getConfig();

    // 2. Create the engine instance with the loaded configuration.
    const engineOptions = { config };
    if (process.env.NODE_ENV === 'test') {
      console.log(chalk.yellow("[main] Test environment detected. Injecting mock UnifiedIntelligenceService."));
      engineOptions._test_unifiedIntelligenceService = {
        isInitialized: true,
        search: async () => ({ results: [], condensed_preamble: "Mock search results." }),
        triggerAgent: async () => "Mock agent response.",
      };
    }
    const engine = new Engine(engineOptions);

    // 3. Await the asynchronous initialization of all engine components.
    await engine.stateManagerInitializationPromise;
    await engine.toolExecutorPromise;

    // 4. Start the server only after everything is ready.
    await engine.start();

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log(chalk.yellow("SIGINT received, shutting down gracefully."));
      await engine.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log(chalk.yellow("SIGTERM received, shutting down gracefully."));
      await engine.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error(chalk.red("Failed to start the Stigmergy Engine:"), error);
    process.exit(1);
  }
}

main();
