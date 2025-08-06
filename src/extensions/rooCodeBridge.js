import vscode from "vscode";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";

export class RooCodeBridge {
  constructor() {
    this.extensionId = "rooveterinaryinc.roo-cline";
    this.designChannel = vscode.window.createOutputChannel("SuperDesign");
  }

  async activateSuperDesign() {
    const extension = vscode.extensions.getExtension(this.extensionId);

    if (!extension) {
      throw new Error("Roo Code extension not found. Please install from VS Code marketplace.");
    }

    if (!extension.isActive) {
      await extension.activate();
    }

    // Register custom commands
    this.registerCommands();
  }

  registerCommands() {
    vscode.commands.registerCommand("stigmergy.openSuperDesign", async () => {
      const panel = vscode.window.createWebviewPanel(
        "superDesign",
        "SuperDesign Canvas",
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      panel.webview.html = this.getSuperDesignHTML();

      // Handle messages from webview
      panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.type) {
          case "loadDesign":
            await this.loadDesign(message.designPath);
            break;
          case "saveDesign":
            await this.saveDesign(message.designData);
            break;
        }
      });
    });
  }

  getSuperDesignHTML() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SuperDesign Canvas</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .canvas { border: 1px solid #ccc; width: 100%; height: 600px; }
          .toolbar { margin-bottom: 10px; }
          button { margin: 5px; padding: 10px 20px; }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button onclick="loadDesign()">Load Design</button>
          <button onclick="saveDesign()">Save Design</button>
        </div>
        <canvas id="designCanvas" class="canvas"></canvas>
        <script>
          const vscode = acquireVsCodeApi();

          function loadDesign() {
            vscode.postMessage({ type: 'loadDesign', designPath: '.superdesign/design_iterations/' });
          }

          function saveDesign() {
            const canvas = document.getElementById('designCanvas');
            // Implementation for saving design
            vscode.postMessage({ type: 'saveDesign', designData: { /* design data */ } });
          }
        </script>
      </body>
      </html>
    `;
  }

  async loadDesign(designPath) {
    try {
      const designData = await fs.readJson(designPath);
      this.designChannel.appendLine(`Loaded design from ${designPath}`);
      return designData;
    } catch (error) {
      this.designChannel.appendLine(`Error loading design: ${error.message}`);
      vscode.window.showErrorMessage(`Failed to load design: ${error.message}`);
      return null;
    }
  }

  async saveDesign(designData) {
    try {
      const designDir = path.join(process.cwd(), ".superdesign", "design_iterations");
      await fs.ensureDir(designDir);
      const fileName = `design-${Date.now()}.json`;
      const filePath = path.join(designDir, fileName);
      await fs.writeJson(filePath, designData, { spaces: 2 });
      this.designChannel.appendLine(`Saved design to ${filePath}`);
      vscode.window.showInformationMessage(`Design saved to ${fileName}`);
    } catch (error) {
      this.designChannel.appendLine(`Error saving design: ${error.message}`);
      vscode.window.showErrorMessage(`Failed to save design: ${error.message}`);
    }
  }
}
