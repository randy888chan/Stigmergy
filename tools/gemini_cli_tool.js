import { spawn } from "child_process";
import path from "path";
import "dotenv/config.js";

export function execute({ prompt, projectPath }) {
  return new Promise((resolve, reject) => {
    const geminiExecutable = path.resolve(process.cwd(), "node_modules", ".bin", "gemini");
    const args = ["-p", prompt, "--yolo", "--project-path", projectPath];
    const spawnOptions = { cwd: projectPath, env: { ...process.env }, shell: true };
    if (process.env.GEMINI_API_KEY) spawnOptions.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
    const child = spawn(geminiExecutable, args, spawnOptions);
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (data) => (stdout += data.toString()));
    child.stderr.on("data", (data) => (stderr += data.toString()));
    child.on("close", (code) =>
      code !== 0
        ? reject(new Error(`Gemini CLI exited with code ${code}: ${stderr}`))
        : resolve(stdout.trim())
    );
    child.on("error", (err) => reject(err));
  });
}
