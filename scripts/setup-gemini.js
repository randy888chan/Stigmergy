#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";

async function setupGemini() {
  console.log(chalk.blue("🔧 Setting up Gemini CLI with Gmail authentication..."));

  // Check if Gemini CLI is installed
  try {
    execSync("gemini --version", { stdio: "ignore" });
    console.log(chalk.green("✅ Gemini CLI already installed"));
  } catch {
    console.log(chalk.yellow("📦 Installing Gemini CLI..."));
    execSync("npm install -g @google/gemini-cli", { stdio: "inherit" });
  }

  // Configure authentication
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "useGmail",
      message: "Use Gmail account for authentication?",
      default: true,
    },
  ]);

  if (answers.useGmail) {
    console.log(chalk.blue("🔄 Opening browser for Gmail authentication..."));

    // Create config directory
    await fs.ensureDir(".gemini");

    // Start Gemini CLI which will trigger OAuth flow
    try {
      execSync("gemini", { stdio: "inherit" });

      // Verify authentication
      const verifyCmd = execSync('gemini "echo authenticated"', { encoding: "utf8" });
      if (verifyCmd.includes("authenticated")) {
        console.log(chalk.green("✅ Gemini CLI authenticated successfully"));

        // Create config file
        await fs.writeJson(".gemini/config.json", {
          authMethod: "gmail",
          configuredAt: new Date().toISOString(),
          version: "1.0.0",
        });
      }
    } catch (error) {
      console.log(chalk.red("❌ Authentication failed:", error.message));
      process.exit(1);
    }
  }
}

setupGemini().catch(console.error);
