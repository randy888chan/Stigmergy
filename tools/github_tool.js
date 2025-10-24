import { Octokit } from "@octokit/rest";
import { configService } from "../services/config_service.js";

/**
 * Creates a new GitHub issue.
 * @param {object} args - The arguments for the function.
 * @param {string} args.title - The title of the issue.
 * @param {string} args.body - The body of the issue.
 * @param {string[]} [args.labels] - An array of labels to add to the issue.
 * @returns {Promise<string>} A promise that resolves with the URL of the created issue.
 */
export async function create_issue({ title, body, labels = ['protocol-proposal'] }) {
    await configService.initialize();
    const config = configService.getConfig();

    const { owner, repo } = config.github || {};
    const githubToken = process.env.GITHUB_TOKEN;

    if (!owner || !repo) {
        throw new Error("GitHub owner and repo are not configured in stigmergy.config.js");
    }

    if (!githubToken) {
        throw new Error("GITHUB_TOKEN environment variable is not set.");
    }

    const octokit = new Octokit({ auth: githubToken });

    try {
        const response = await octokit.issues.create({
            owner,
            repo,
            title,
            body,
            labels,
        });

        console.log(`Successfully created issue: ${response.data.html_url}`);
        return `Successfully created issue: ${response.data.html_url}`;
    } catch (error) {
        console.error(`Failed to create GitHub issue: ${error.message}`);
        throw new Error(`Failed to create GitHub issue: ${error.message}`);
    }
}
