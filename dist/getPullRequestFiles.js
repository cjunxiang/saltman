"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPullRequestFiles = void 0;
const getPullRequestFiles = async ({ octokit, owner, repo, prNumber, }) => {
    try {
        const response = await octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: prNumber,
        });
        return response.data;
    }
    catch (error) {
        if (error instanceof Error &&
            error.message.includes("Resource not accessible by integration")) {
            throw new Error("Permission denied: The GitHub token does not have sufficient permissions to list PR files. " +
                "Please ensure the workflow has 'pull-requests: read' permission.");
        }
        throw error;
    }
};
exports.getPullRequestFiles = getPullRequestFiles;
