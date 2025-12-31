import { Engine } from "./server.js";
import { configService } from "../services/config_service.js";
import chalk from "chalk";

console.log("!!! STIGMERGY ENTERPRISE BOOT INITIATED !!!");

async function main() {
  try {
    console.log(chalk.blue("Initializing Configuration..."));
    await configService.initialize();
    const config = configService.getConfig();

    console.log(chalk.blue("Starting Engine..."));
    const engine = new Engine({ config });
    await engine.start();
  } catch (error) {
    console.error(chalk.red("FATAL BOOT ERROR:"), error);
    process.exit(1);
  }
}
main();
