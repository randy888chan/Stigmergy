#!/usr/bin/env node
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import coreBackup from "../services/core_backup.js";

async function setupLightweight() {
  console.log(chalk.blue("🚀 Setting up Stigmergy 3.0 (Lightweight)..."));

  const steps = [
    {
      name: "Core Backup",
      action: async () => {
        console.log(chalk.yellow("📦 Backing up .stigmergy-core..."));
        const backupPath = await coreBackup.autoBackup();
        if (backupPath) {
          console.log(chalk.green(`✅ Core backed up to ${backupPath}`));
        } else {
          console.log(chalk.yellow("⚠️ .stigmergy-core not found, skipping backup."));
        }
      },
    },
    {
      name: "File Structure",
      action: async () => {
        await fs.ensureDir(".ai/state");
        await fs.ensureDir(".ai/health");
        await fs.ensureDir(".ai/events");
        console.log(chalk.green("✅ File structure created"));
      },
    },
    {
      name: "Health Monitoring",
      action: async () => {
        console.log(chalk.yellow("📊 Starting health monitor..."));

        // Create initial health file
        await fs.writeJson(".ai/health/agents.json", {
          system: { status: "healthy", lastSeen: Date.now() },
          dispatcher: { status: "healthy", lastSeen: Date.now() },
        });

        console.log(chalk.green("✅ Health monitoring ready"));
      },
    },
  ];

  for (const step of steps) {
    try {
      console.log(chalk.blue(`\n--- ${step.name} ---`));
      await step.action();
    } catch (error) {
      console.log(chalk.red(`❌ ${step.name} failed:`, error.message));
    }
  }

  console.log(chalk.green("\n🎉 Lightweight setup complete!"));
  console.log(chalk.blue("\nUsage:"));
  console.log("• npm run stigmergy:start    - Start the engine");
  console.log("• npm run health:check       - Check agent health");
  console.log("• npm run state:monitor      - Monitor state changes");
}

setupLightweight().catch(console.error);
