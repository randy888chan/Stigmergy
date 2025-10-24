import { simpleGit } from 'simple-git';
import path from 'path';

// ====================================================================================
// Note: This file follows the project's convention where tools are "dumb" and
// operate on the secure, absolute paths provided by the tool_executor.
// All path resolution and security checks are handled by the centralized executor.
// ====================================================================================

/**
 * Initializes a new Git repository in the specified directory.
 * @param {object} args - The arguments for the function.
 * @param {string} args.path - The absolute path to the directory where the repository should be initialized.
 * @returns {Promise<string>} A message indicating success or failure.
 */
export async function init({ path: repoPath }) {
  try {
    const git = simpleGit();
    await git.init(repoPath);
    return `Git repository initialized successfully at ${repoPath}`;
  } catch (error) {
    console.error(`Failed to initialize git repository at ${repoPath}:`, error);
    return `EXECUTION FAILED: ${error.message}`;
  }
}

/**
 * Gets the diff of staged changes.
 * @param {object} args - The arguments for the function.
 * @param {string} args.workingDirectory - The absolute path to the directory of the git repo.
 * @returns {Promise<string>} The git diff as a string, or an error message.
 */
export async function get_staged_diff({ workingDirectory }) {
    try {
        const git = simpleGit(workingDirectory);
        const diff = await git.diff(['--staged']);
        return diff || 'No staged changes found.';
    } catch (error) {
        console.error(`Failed to get staged diff in ${workingDirectory}:`, error);
        return `EXECUTION FAILED: ${error.message}`;
    }
}

/**
 * Commits changes to the Git repository.
 * @param {object} args - The arguments for the function.
 * @param {string} args.message - The commit message.
 * @param {string} args.workingDirectory - The absolute path to the directory of the git repo.
 * @returns {Promise<string>} A message indicating the result of the commit.
 */
export async function commit({ message, workingDirectory }) {
  try {
    const git = simpleGit(workingDirectory);
    // It's crucial to stage all changes before committing.
    await git.add('./*');
    const commitSummary = await git.commit(message);

    if (commitSummary.commit) {
      return `Successfully committed changes with hash ${commitSummary.commit}. Files changed: ${commitSummary.summary.changes}.`;
    } else {
      return 'No changes to commit.';
    }
  } catch (error) {
    console.error(`Failed to commit changes in ${workingDirectory}:`, error);
    return `EXECUTION FAILED: ${error.message}`;
  }
}