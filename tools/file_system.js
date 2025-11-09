import defaultFs from "fs-extra";
import path from "path";
import { glob } from "glob";

// ====================================================================================
// Note: This file has been refactored to follow the Single Responsibility Principle.
// The file system tools are now "dumb" and only operate on the absolute paths they
// are given. All path resolution, security checks, and sandboxing logic have been
// moved to the `tool_executor.js`, which acts as a centralized security guard.
// ====================================================================================

export async function readFile({ path: filePath }, fs = defaultFs) {
  try {
    // This tool now expects `filePath` to be a secure, absolute path.
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    return `EXECUTION FAILED: ${error.message}`;
  }
}

export async function writeFile({ path: filePath, content }, fs = defaultFs) {
    try {
        // This tool now expects `filePath` to be a secure, absolute path.
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, content);
        return `File ${filePath} written successfully`;
    } catch (error) {
        return `EXECUTION FAILED: ${error.message}`;
    }
}

export async function listDirectory({ path: dirPath }, fs = defaultFs) {
  try {
    // This tool now expects `dirPath` to be a secure, absolute path.
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    return files.map(file => ({ name: file.name, type: file.isDirectory() ? 'folder' : 'file' }));
  } catch (error) {
    return `EXECUTION FAILED: ${error.message}`;
  }
}

export async function listFiles({ directory }, fs = defaultFs) {
    try {
        // This tool now expects `directory` to be a secure, absolute path.
        return glob("**/*", { cwd: directory, nodir: true, fs });
    } catch (error) {
        return `EXECUTION FAILED: ${error.message}`;
    }
}

export async function appendFile({ path: filePath, content }, fs = defaultFs) {
    try {
        // This tool now expects `filePath` to be a secure, absolute path.
        await fs.ensureDir(path.dirname(filePath));
        await fs.appendFile(filePath, content);
        return `Content successfully appended to ${filePath}`;
    } catch (error) {
        return `EXECUTION FAILED: ${error.message}`;
    }
}

export async function pathExists({ path: targetPath }, fs = defaultFs) {
  try {
    // This tool expects `targetPath` to be a secure, absolute path
    // provided by the tool_executor.
    const exists = await fs.pathExists(targetPath);
    return `Path '${targetPath}' exists: ${exists}`;
  } catch (error) {
    return `EXECUTION FAILED: Error checking path '${targetPath}': ${error.message}`;
  }
}
