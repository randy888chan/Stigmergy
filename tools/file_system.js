import fs from "fs-extra";
import path from "path";
import { glob } from "glob";

const SAFE_DIRECTORIES = new Set([
  "src",
  "public",
  "docs",
  "tests",
  "scripts",
  ".ai",
  "services",
  "engine",
]);

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
  const rootDir = relative.split(path.sep)[0];
  if (!SAFE_DIRECTORIES.has(rootDir)) {
    throw new Error(`Access restricted to ${rootDir} directory`);
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
