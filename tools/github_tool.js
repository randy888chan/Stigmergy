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

export async function create_pull_request({ title, head, base = 'main' }) {
    await configService.initialize();
    const config = configService.getConfig();
    const { owner, repo } = config.github || {};
    const githubToken = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !githubToken) {
        throw new Error("GitHub configuration (owner, repo, token) is missing.");
    }

    const octokit = new Octokit({ auth: githubToken });

    try {
        const response = await octokit.pulls.create({
            owner,
            repo,
            title,
            head,
            base,
            body: `Pull request created by Stigmergy agent swarm.`,
        });
        return `Successfully created pull request: ${response.data.html_url}`;
    } catch (error) {
        return `EXECUTION FAILED: ${error.message}`;
    }
}

/**
 * Gets the status of a GitHub pull request.
 * @param {object} args - The arguments for the function.
 * @param {number} args.pr_number - The number of the pull request.
 * @returns {Promise<string>} A promise that resolves with the status of the pull request.
 */
export async function get_pr_status({ pr_number }) {
    await configService.initialize();
    const config = configService.getConfig();
    const { owner, repo } = config.github || {};
    const githubToken = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !githubToken) {
        throw new Error("GitHub configuration (owner, repo, token) is missing.");
    }

    const octokit = new Octokit({ auth: githubToken });

    try {
        const response = await octokit.pulls.get({
            owner,
            repo,
            pull_number: pr_number,
        });
        return response.data.state; // e.g., 'open', 'closed'
    } catch (error) {
        return `EXECUTION FAILED: ${error.message}`;
    }
}

/**
 * Gets the status of CI check runs for a specific branch.
 * @param {object} args - The arguments for the function.
 * @param {string} args.branch_name - The name of the branch.
 * @returns {Promise<object>} A promise that resolves with the status and conclusion of the check runs.
 */
export async function get_check_runs({ branch_name }) {
    await configService.initialize();
    const config = configService.getConfig();
    const { owner, repo } = config.github || {};
    const githubToken = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !githubToken) {
        throw new Error("GitHub configuration (owner, repo, token) is missing.");
    }

    const octokit = new Octokit({ auth: githubToken });

    try {
        const response = await octokit.checks.listForRef({
            owner,
            repo,
            ref: branch_name,
        });

        const check_runs = response.data.check_runs.map(run => ({
            status: run.status, // e.g., 'queued', 'in_progress', 'completed'
            conclusion: run.conclusion, // e.g., 'success', 'failure', 'neutral', 'cancelled', 'skipped', 'timed_out', 'action_required'
        }));

        return check_runs;
    } catch (error) {
        return `EXECUTION FAILED: ${error.message}`;
    }
}
