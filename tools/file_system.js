const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// All paths are resolved from the project root to prevent directory traversal attacks.
function resolvePath(filePath) {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!resolved.startsWith(process.cwd())) {
    throw new Error(`Forbidden path: ${filePath}. Only paths within the project are allowed.`);
  }
  return resolved;
}

async function readFile({ path: filePath }) {
  const resolvedPath = resolvePath(filePath);
  return await fs.readFile(resolvedPath, 'utf-8');
}

async function writeFile({ path: filePath, content }) {
  const resolvedPath = resolvePath(filePath);
  await fs.ensureDir(path.dirname(resolvedPath));
  await fs.writeFile(resolvedPath, content);
  return `File ${filePath} written successfully.`;
}

async function listFiles({ directory }) {
    const resolvedDir = resolvePath(directory);
    const files = glob.sync('**/*', { cwd: resolvedDir, nodir: true });
    return files;
}

module.exports = {
  readFile,
  writeFile,
  listFiles,
};
