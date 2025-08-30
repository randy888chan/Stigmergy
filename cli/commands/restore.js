import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";

const execPromise = promisify(exec);

export default async function restore() {
  console.log(chalk.yellow("♻️ Restoring .stigmergy-core to its original state from git..."));
  try {
    await execPromise("git checkout HEAD -- .stigmergy-core");
    console.log(chalk.green("✅ Core restored successfully."));
    return true;
  } catch (error) {
    console.error(chalk.red("❌ Failed to restore .stigmergy-core using git."), error);
    console.log(chalk.yellow("This can happen if the directory is not committed to git. Please ensure it is part of your repository."));
    return false;
  }
}
