import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";

export class GeminiAuthManager {
  constructor() {
    this.configPath = path.join(process.cwd(), ".gemini", "config.json");
  }

  async ensureAuthenticated() {
    const config = await this.loadConfig();

    if (!config || !config.authenticated) {
      console.log("🔐 Setting up Gemini CLI authentication...");
      await this.runAuthenticationFlow();
    }

    return true;
  }

  async runAuthenticationFlow() {
    return new Promise((resolve, reject) => {
      const gemini = spawn("npx", ["@google/gemini-cli"], {
        stdio: ["inherit", "pipe", "pipe"],
      });

      let output = "";
      gemini.stdout.on("data", (data) => {
        output += data.toString();
        if (output.includes("Successfully authenticated")) {
          this.saveConfig({ authenticated: true, method: "gmail" });
          resolve();
        }
      });

      gemini.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error("Gemini authentication failed"));
        }
      });
    });
  }

  async loadConfig() {
    try {
      return await fs.readJson(this.configPath);
    } catch {
      return null;
    }
  }

  async saveConfig(config) {
    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeJson(this.configPath, { ...config, lastUpdated: new Date().toISOString() });
  }
}
