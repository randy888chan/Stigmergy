import defaultFs from "fs-extra";
import path from "path";
import { glob } from "glob";
import config from "../stigmergy.config.js";

const SAFE_DIRECTORIES = config.security?.allowedDirs || [
  "src",
  "public",
  "docs",
  "tests",
  "scripts",
  ".ai",
  "services",
  "engine",
  "stories",
  "system-proposals",
];

export function resolvePath(filePath, projectRoot, workingDirectory, fs = defaultFs) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid file path provided");
  }

  // Determine the base directory for resolution. Prioritize the sandboxed workingDirectory.
  const baseDir = workingDirectory || projectRoot || process.cwd();

  // Prevent path traversal attacks.
  if (filePath.includes("..")) {
    throw new Error(`Security violation: Path traversal attempt ("..") in path "${filePath}"`);
  }

  const resolved = path.resolve(baseDir, filePath);

  // After resolving, ensure the path is still within the intended scope (either project root or sandbox).
  const projectScope = projectRoot || process.cwd();
  if (!resolved.startsWith(projectScope)) {
      throw new Error(`Security violation: Path "${filePath}" resolves outside the project scope.`);
  }

  // If a workingDirectory is defined, all operations must be within it.
  if (workingDirectory && !resolved.startsWith(workingDirectory)) {
      throw new Error(`Security violation: Path "${filePath}" attempts to escape the agent's sandbox.`);
  }

  // Verify the final resolved path is within a safe directory if not in a sandbox
  if (!workingDirectory) {
    const relative = path.relative(projectScope, resolved);
    const isSafe = SAFE_DIRECTORIES.some(dir => relative.startsWith(dir + path.sep) || relative === dir);
    if (!isSafe) {
      const rootDir = relative.split(path.sep)[0] || relative;
      throw new Error(`Access restricted to ${rootDir} directory`);
    }
  }


  // Check file size limit
  if (config.security?.maxFileSizeMB) {
    let stats;
    try {
      stats = fs.statSync(resolved);
    } catch (e) {
      // File doesn't exist yet, skip size check
    }

    if (stats) {
      const maxBytes = config.security.maxFileSizeMB * 1024 * 1024;
      if (stats.size > maxBytes) {
        throw new Error(`File exceeds size limit of ${config.security.maxFileSizeMB}MB`);
      }
    }
  }

  return resolved;
}

export async function readFile({ path: filePath, projectRoot, workingDirectory, fs = defaultFs }) {
  try {
    const safePath = resolvePath(filePath, projectRoot, workingDirectory, fs);
    return await fs.readFile(safePath, "utf-8");
  } catch (error) {
    return `EXECUTION FAILED: ${error.message}`;
  }
}

export async function writeFile({ path: filePath, content, projectRoot, workingDirectory, fs = defaultFs }) {
    try {
        const safePath = resolvePath(filePath, projectRoot, workingDirectory, fs);
        await fs.ensureDir(path.dirname(safePath));
        await fs.writeFile(safePath, content);
        return `File ${filePath} written successfully`;
    } catch (error) {
        return `EXECUTION FAILED: ${error.message}`;
    }
}

export async function listFiles({ directory, projectRoot, workingDirectory, fs = defaultFs }) {
    try {
        // If no directory is provided, list files in the current working directory.
        const targetDirectory = directory || ".";
        const safePath = resolvePath(targetDirectory, projectRoot, workingDirectory, fs);
        // Pass the fs instance to glob to ensure it uses the in-memory file system for tests.
        return glob("**/*", { cwd: safePath, nodir: true, fs });
    } catch (error) {
        return `EXECUTION FAILED: ${error.message}`;
    }
}

export async function appendFile({ path: filePath, content, projectRoot, workingDirectory, fs = defaultFs }) {
    try {
        const safePath = resolvePath(filePath, projectRoot, workingDirectory, fs);
        await fs.ensureDir(path.dirname(safePath));
        await fs.appendFile(safePath, content);
        return `Content successfully appended to ${filePath}`;
    } catch (error) {
        return `EXECUTION FAILED: ${error.message}`;
    }
}
