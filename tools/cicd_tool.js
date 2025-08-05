import axios from "axios";
import "dotenv/config.js";

/**
 * @module cicd_tool
 * @description A tool for triggering CI/CD pipelines.
 */

/**
 * Triggers a GitHub Actions workflow dispatch event.
 * Requires a `GITHUB_TOKEN` with `actions:write` permission in the .env file.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.owner - The owner of the repository (e.g., 'randy888chan').
 * @param {string} args.repo - The name of the repository (e.g., 'Stigmergy').
 * @param {string} args.workflow_id - The ID or filename of the workflow (e.g., 'release.yml').
 * @param {string} args.ref - The git ref (branch, tag, or commit SHA) to run the workflow from (e.g., 'main').
 * @returns {Promise<string>} A confirmation message.
 */
export async function trigger_github_workflow({ owner, repo, workflow_id, ref }) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is not set in the environment variables. This is required to trigger a GitHub workflow."
    );
  }
  if (!owner || !repo || !workflow_id || !ref) {
    throw new Error("Parameters 'owner', 'repo', 'workflow_id', and 'ref' are all required.");
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`;

  try {
    const response = await axios.post(
      url,
      {
        ref: ref,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (response.status === 204) {
      return `Successfully triggered workflow '${workflow_id}' on repository '${owner}/${repo}' for ref '${ref}'.`;
    } else {
      throw new Error(`GitHub API responded with status ${response.status}`);
    }
  } catch (error) {
    console.error("Error triggering GitHub workflow:", error.response?.data || error.message);
    throw new Error(
      `Failed to trigger GitHub workflow. Please check the parameters and your GITHUB_TOKEN permissions. Details: ${error.response?.data?.message || error.message}`
    );
  }
}
