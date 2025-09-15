import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Convert callback-based fs functions to promises
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

/**
 * File Manager Service
 * Provides file management capabilities for the Stigmergy system
 */
class FileManager {
  constructor(basePath = process.cwd()) {
    this.basePath = basePath;
  }

  /**
   * Get the full path for a file or directory
   * @param {string} relativePath - Relative path from base path
   * @returns {string} Full path
   */
  getFullPath(relativePath) {
    return path.join(this.basePath, relativePath);
  }

  /**
   * Read a file
   * @param {string} filePath - Path to the file
   * @returns {Promise<string>} File content
   */
  async readFile(filePath) {
    try {
      const fullPath = this.getFullPath(filePath);
      const content = await readFile(fullPath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Write content to a file
   * @param {string} filePath - Path to the file
   * @param {string} content - Content to write
   * @returns {Promise<void>}
   */
  async writeFile(filePath, content) {
    try {
      const fullPath = this.getFullPath(filePath);
      // Ensure directory exists
      const dirPath = path.dirname(fullPath);
      await this.ensureDirectory(dirPath);
      await writeFile(fullPath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Create a directory
   * @param {string} dirPath - Path to the directory
   * @returns {Promise<void>}
   */
  async createDirectory(dirPath) {
    try {
      const fullPath = this.getFullPath(dirPath);
      await mkdir(fullPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Ensure a directory exists
   * @param {string} dirPath - Path to the directory
   * @returns {Promise<void>}
   */
  async ensureDirectory(dirPath) {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Delete a file
   * @param {string} filePath - Path to the file
   * @returns {Promise<void>}
   */
  async deleteFile(filePath) {
    try {
      const fullPath = this.getFullPath(filePath);
      await unlink(fullPath);
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Delete a directory
   * @param {string} dirPath - Path to the directory
   * @returns {Promise<void>}
   */
  async deleteDirectory(dirPath) {
    try {
      const fullPath = this.getFullPath(dirPath);
      await rmdir(fullPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to delete directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Get file or directory stats
   * @param {string} itemPath - Path to the file or directory
   * @returns {Promise<Object>} Stats object
   */
  async getStats(itemPath) {
    try {
      const fullPath = this.getFullPath(itemPath);
      const stats = await stat(fullPath);
      return {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        accessedAt: stats.atime
      };
    } catch (error) {
      throw new Error(`Failed to get stats for ${itemPath}: ${error.message}`);
    }
  }

  /**
   * List directory contents
   * @param {string} dirPath - Path to the directory
   * @returns {Promise<Array>} Array of file/directory info
   */
  async listDirectory(dirPath = '.') {
    try {
      const fullPath = this.getFullPath(dirPath);
      const items = await readdir(fullPath);
      
      const itemList = await Promise.all(items.map(async (item) => {
        const itemPath = path.join(dirPath, item);
        const stats = await this.getStats(itemPath);
        
        return {
          name: item,
          path: itemPath,
          type: stats.isDirectory ? 'directory' : 'file',
          size: stats.size,
          modifiedAt: stats.modifiedAt
        };
      }));
      
      return itemList;
    } catch (error) {
      throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Get file tree structure
   * @param {string} dirPath - Path to the directory
   * @param {number} maxDepth - Maximum depth to traverse
   * @returns {Promise<Object>} File tree structure
   */
  async getFileTree(dirPath = '.', maxDepth = 5) {
    if (maxDepth <= 0) {
      return null;
    }

    try {
      const fullPath = this.getFullPath(dirPath);
      const stats = await this.getStats(dirPath);
      
      if (stats.isFile) {
        return {
          name: path.basename(dirPath),
          path: dirPath,
          type: 'file'
        };
      }
      
      const items = await readdir(fullPath);
      const children = await Promise.all(
        items.map(async (item) => {
          const itemPath = path.join(dirPath, item);
          return await this.getFileTree(itemPath, maxDepth - 1);
        })
      );
      
      return {
        name: path.basename(dirPath),
        path: dirPath,
        type: 'directory',
        children: children.filter(child => child !== null)
      };
    } catch (error) {
      console.warn(`Failed to get file tree for ${dirPath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Rename a file or directory
   * @param {string} oldPath - Current path
   * @param {string} newPath - New path
   * @returns {Promise<void>}
   */
  async rename(oldPath, newPath) {
    try {
      const fullOldPath = this.getFullPath(oldPath);
      const fullNewPath = this.getFullPath(newPath);
      
      // Ensure parent directory exists for new path
      const newDirPath = path.dirname(fullNewPath);
      await this.ensureDirectory(newDirPath);
      
      await fs.promises.rename(fullOldPath, fullNewPath);
    } catch (error) {
      throw new Error(`Failed to rename ${oldPath} to ${newPath}: ${error.message}`);
    }
  }

  /**
   * Copy a file or directory
   * @param {string} sourcePath - Source path
   * @param {string} targetPath - Target path
   * @returns {Promise<void>}
   */
  async copy(sourcePath, targetPath) {
    try {
      const fullSourcePath = this.getFullPath(sourcePath);
      const fullTargetPath = this.getFullPath(targetPath);
      
      // Ensure parent directory exists for target path
      const targetDirPath = path.dirname(fullTargetPath);
      await this.ensureDirectory(targetDirPath);
      
      const stats = await stat(fullSourcePath);
      
      if (stats.isFile()) {
        await fs.promises.copyFile(fullSourcePath, fullTargetPath);
      } else if (stats.isDirectory()) {
        // For directories, we need to implement recursive copy
        await this.copyDirectory(fullSourcePath, fullTargetPath);
      }
    } catch (error) {
      throw new Error(`Failed to copy ${sourcePath} to ${targetPath}: ${error.message}`);
    }
  }

  /**
   * Copy a directory recursively
   * @param {string} sourceDir - Source directory path
   * @param {string} targetDir - Target directory path
   * @returns {Promise<void>}
   */
  async copyDirectory(sourceDir, targetDir) {
    try {
      await mkdir(targetDir, { recursive: true });
      const items = await readdir(sourceDir);
      
      for (const item of items) {
        const sourcePath = path.join(sourceDir, item);
        const targetPath = path.join(targetDir, item);
        
        const stats = await stat(sourcePath);
        
        if (stats.isFile()) {
          await fs.promises.copyFile(sourcePath, targetPath);
        } else if (stats.isDirectory()) {
          await this.copyDirectory(sourcePath, targetPath);
        }
      }
    } catch (error) {
      throw new Error(`Failed to copy directory ${sourceDir} to ${targetDir}: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new FileManager();