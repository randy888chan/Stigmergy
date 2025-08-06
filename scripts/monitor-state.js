#!/usr/bin/env node
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

async function monitorState() {
  const stateFile = path.join(process.cwd(), ".ai", "state", "current.json");

  console.log(chalk.blue("📊 Monitoring Stigmergy state..."));

  setInterval(async () => {
    try {
      const state = await fs.readJson(stateFile);
      console.log(
        chalk.green(`[${new Date().toLocaleTimeString()}] Status: ${state.project_status}`)
      );

      if (state.project_manifest?.tasks) {
        const completed = state.project_manifest.tasks.filter(
          (t) => t.status === "COMPLETED"
        ).length;
        const total = state.project_manifest.tasks.length;
        console.log(chalk.blue(`Progress: ${completed}/${total} tasks completed`));
      }
    } catch (error) {
      console.log(chalk.red("State file not found - system may be initializing"));
    }
  }, 5000);
}

monitorState().catch(console.error);
