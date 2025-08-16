import fs from "fs-extra";
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

export function resolvePath(filePath) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid file path provided");
  }

  const resolved = path.resolve(process.cwd(), filePath);
  const relative = path.relative(process.cwd(), resolved);

  // Block path traversal
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Security violation: Path traversal attempt (${filePath})`);
  }

  // Verify first directory is safe
  const rootDir = relative.split(path.sep)[0] || relative;
  if (!SAFE_DIRECTORIES.includes(rootDir)) {
    throw new Error(`Access restricted to ${rootDir} directory`);
  }

  // Check file size limit
  if (config.security?.maxFileSizeMB) {
    try {
      const stats = fs.statSync(resolved);
      const maxBytes = config.security.maxFileSizeMB * 1024 * 1024;
      if (stats.size > maxBytes) {
        throw new Error(`File exceeds size limit of ${config.security.maxFileSizeMB}MB`);
      }
    } catch (e) {
      // File doesn't exist yet, skip size check
    }
  }

  return resolved;
}

export async function readFile({ path: filePath }) {
  const safePath = resolvePath(filePath);
  return fs.readFile(safePath, "utf-8");
}

export async function writeFile({ path: filePath, content }) {
  const safePath = resolvePath(filePath);
  await fs.ensureDir(path.dirname(safePath));
  await fs.writeFile(safePath, content);
  return `File ${filePath} written successfully`;
}

export async function listFiles({ directory }) {
  const safePath = resolvePath(directory);
  return glob("**/*", { cwd: safePath, nodir: true });
}

export async function appendFile({ path: filePath, content }) {
  const safePath = resolvePath(filePath);
  await fs.ensureDir(path.dirname(safePath));
  // The 'a' flag stands for "append"
  await fs.appendFile(safePath, content + '\\n');
  return `Content successfully appended to ${filePath}`;
}
