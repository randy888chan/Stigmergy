const fs = require('fs-extra');
const path = require('path');

// All paths are resolved from the project root to prevent directory traversal.
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

module.exports = {
  readFile,
  writeFile,
};
