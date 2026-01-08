"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePullRequestAccess = void 0;
const validatePullRequestAccess = async ({ octokit, owner, repo, prNumber, }) => {
    try {
        await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: prNumber,
        });
    }
    catch (error) {
        if (error instanceof Error &&
            error.message.includes("Resource not accessible by integration")) {
            throw new Error("Permission denied: The GitHub token does not have sufficient permissions. " +
                "Please ensure the workflow has 'pull-requests: read' permission. " +
                "Add this to your workflow:\n" +
                "permissions:\n" +
                "  pull-requests: write\n" +
                "  contents: read\n" +
                "  issues: write");
        }
        throw error;
    }
};
exports.validatePullRequestAccess = validatePullRequestAccess;
