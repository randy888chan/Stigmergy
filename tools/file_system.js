import fs from "fs-extra";
import path from "path";
import { glob } from "glob";

function resolvePath(filePath) {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!resolved.startsWith(process.cwd())) throw new Error(`Forbidden path: ${filePath}.`);
  return resolved;
}
export async function readFile({ path: filePath }) {
  return fs.readFile(resolvePath(filePath), "utf-8");
}
export async function writeFile({ path: filePath, content }) {
  const p = resolvePath(filePath);
  await fs.ensureDir(path.dirname(p));
  await fs.writeFile(p, content);
  return `File ${filePath} written.`;
}
export async function listFiles({ directory }) {
  return glob("**/*", { cwd: resolvePath(directory), nodir: true });
}
