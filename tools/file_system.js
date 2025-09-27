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

export function resolvePath(filePath, projectRoot, fs = defaultFs) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid file path provided");
  }

  const rootDir = projectRoot || process.cwd();

  // Enhanced path traversal check
  if (filePath.split(path.sep).includes("..")) {
    throw new Error(`Security violation: Path traversal attempt (${filePath})`);
  }

  const resolved = path.resolve(rootDir, filePath);
  const relative = path.relative(rootDir, resolved);

  // Block path traversal after resolution (double check)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Security violation: Path traversal attempt (${filePath})`);
  }

  // Verify the final resolved path is within a safe directory
  const isSafe = SAFE_DIRECTORIES.some(dir => relative.startsWith(dir + path.sep) || relative === dir);
  if (!isSafe) {
    const rootDir = relative.split(path.sep)[0] || relative;
    throw new Error(`Access restricted to ${rootDir} directory`);
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

export async function readFile({ path: filePath, projectRoot, fs = defaultFs }) {
  const safePath = resolvePath(filePath, projectRoot, fs);
  return fs.readFile(safePath, "utf-8");
}

export async function writeFile({ path: filePath, content, projectRoot, fs = defaultFs }) {
  const safePath = resolvePath(filePath, projectRoot, fs);
  await fs.ensureDir(path.dirname(safePath));
  await fs.writeFile(safePath, content);
  return `File ${filePath} written successfully`;
}

export async function listFiles({ directory, projectRoot, fs = defaultFs }) {
  const safePath = resolvePath(directory, projectRoot, fs);
  return glob("**/*", { cwd: safePath, nodir: true });
}

export async function appendFile({ path: filePath, content, projectRoot, fs = defaultFs }) {
  const safePath = resolvePath(filePath, projectRoot, fs);
  await fs.ensureDir(path.dirname(safePath));
  // The 'a' flag stands for "append"
  await fs.appendFile(safePath, content);
  return `Content successfully appended to ${filePath}`;
}
