"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const getPRContextValues_1 = require("./getContextValues/getPRContextValues");
const getPushContextValues_1 = require("./getContextValues/getPushContextValues");
const validateUserAccess_1 = require("./validations/validateUserAccess");
const validatePullRequestAccess_1 = require("./validations/validatePullRequestAccess");
const analyzePR_1 = require("./analyzePR");
const getPullRequestFiles_1 = require("./getPullRequestFiles");
const getPushFiles_1 = require("./getPushFiles");
const githubInputs_1 = require("./validations/githubInputs");
const shared_1 = require("./responses/shared");
const filterIgnoredFiles_1 = require("./filterIgnoredFiles");
const issue_1 = require("./responses/issue");
const format_1 = require("./responses/format");
async function run() {
    try {
        // Get inputs
        const inputToken = core.getInput("github-token", { required: true });
        const inputProvider = core.getInput("provider", { required: true });
        const inputApiKey = core.getInput("api-key", { required: true });
        const inputBaseUrl = core.getInput("base-url");
        const inputModel = core.getInput("model");
        const inputPostCommentWhenNoIssues = core.getInput("post-comment-when-no-issues");
        const inputIgnorePatterns = core.getInput("ignore-patterns");
        const inputTargetBranch = core.getInput("target-branch");
        const inputPingUsers = core.getInput("ping-users");
        const inputSeverityFilter = core.getInput("severity-filter");
        const { token, provider, apiKey, baseUrl, model, postCommentWhenNoIssues, ignorePatterns, targetBranch, pingUsers, severityFilter, } = (0, githubInputs_1.validateGithubInputs)({
            token: inputToken,
            provider: inputProvider,
            apiKey: inputApiKey,
            baseUrl: inputBaseUrl,
            model: inputModel,
            postCommentWhenNoIssues: inputPostCommentWhenNoIssues,
            ignorePatterns: inputIgnorePatterns,
            targetBranch: inputTargetBranch,
            pingUsers: inputPingUsers,
            severityFilter: inputSeverityFilter,
        });
        // Initialize GitHub client
        const octokit = github.getOctokit(token);
        const context = github.context;
        // Get context values based on event type
        const isPullRequest = !!context.payload.pull_request;
        const contextValues = isPullRequest
            ? (0, getPRContextValues_1.getPRContextValues)(context)
            : (0, getPushContextValues_1.getPushContextValues)(context);
        const owner = context.repo.owner;
        const repo = context.repo.repo;
        if (isPullRequest) {
            // PR mode - existing behavior
            const prNumber = contextValues.prNumber;
            await (0, validateUserAccess_1.validateUserAccess)({ octokit, owner, repo, username: contextValues.username });
            await (0, validatePullRequestAccess_1.validatePullRequestAccess)({ octokit, owner, repo, prNumber: prNumber });
            // Get PR details to get head SHA for permalinks
            const prResponse = await octokit.rest.pulls.get({
                owner,
                repo,
                pull_number: prNumber,
            });
            const headSha = prResponse.data.head.sha;
            const files = await (0, getPullRequestFiles_1.getPullRequestFiles)({ octokit, owner, repo, prNumber: prNumber });
            // Filter out files that match ignore patterns
            const filteredFiles = (0, filterIgnoredFiles_1.filterIgnoredFiles)({ files, ignorePatterns });
            const analysis = await (0, analyzePR_1.analyzePR)({
                files: filteredFiles,
                apiKey,
                owner,
                repo,
                headSha,
                provider,
                baseUrl,
                model,
                pingUsers,
                severityFilter,
            });
            // If no analysis was performed (e.g., no text files), skip posting comments
            if (!analysis) {
                return;
            }
            // Post inline comments for critical/high issues
            if (analysis.inlineComments.length > 0) {
                // Create individual review comments for critical/high issues
                // If a comment fails (e.g., line number not in diff), we skip it to avoid incorrect line references
                for (const comment of analysis.inlineComments) {
                    try {
                        await octokit.rest.pulls.createReviewComment({
                            owner,
                            repo,
                            pull_number: prNumber,
                            commit_id: headSha,
                            path: comment.path,
                            body: comment.body,
                            // For multi-line comments, we need both 'side' and 'start_side' to specify which side of the diff.
                            // side: the side where the comment ends (RIGHT = new file)
                            // start_side: the side where the comment starts (RIGHT = new file)
                            // We use RIGHT because we're reviewing the new code (the proposed changes).
                            side: "RIGHT",
                            start_side: "RIGHT",
                            start_line: comment.startLine,
                            line: comment.endLine, // For multi-line comments, 'line' is the end line (not 'end_line')
                        });
                    }
                    catch (error) {
                        // If inline comment fails (e.g., line number not in diff), skip it
                        // This can happen if the LLM provides a line number that's not in the changed lines
                        // We skip rather than fall back to avoid posting potentially incorrect line references
                        console.warn(`Skipping inline comment for ${comment.path}:${comment.startLine}-${comment.endLine}: ${error instanceof Error ? error.message : "Unknown error"}`);
                    }
                }
            }
            // Post aggregated comment for medium/low/info issues
            if (analysis.aggregatedComment) {
                await octokit.rest.issues.createComment({
                    owner,
                    repo,
                    issue_number: prNumber,
                    body: analysis.aggregatedComment,
                });
            }
            // Post "no issues" comment if enabled and no issues found
            if (analysis.allIssues.length === 0 && postCommentWhenNoIssues) {
                await octokit.rest.issues.createComment({
                    owner,
                    repo,
                    issue_number: prNumber,
                    body: `## Saltman Code Review\n\nNo issues detected! 🎉\n\n${(0, shared_1.getSaltmanFooter)({ owner, repo, commitSha: headSha, pingUsers })}`,
                });
            }
            return;
        }
        // Determine if we're in push mode (push event with target branch specified)
        const isPushMode = !isPullRequest && context.eventName === "push" && targetBranch;
        if (isPushMode) {
            const currentBranch = context.ref.replace("refs/heads/", "");
            if (currentBranch !== targetBranch) {
                // Push event but not on target branch, skip
                core.info(`Push event detected but branch '${currentBranch}' does not match target branch '${targetBranch}'. Skipping.`);
                return;
            }
            // Check if this push is from a merged PR by checking if the commit is associated with any PRs
            const commitSha = contextValues.commitSha;
            try {
                const pullsResponse = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
                    owner,
                    repo,
                    commit_sha: commitSha,
                });
                // If the commit is associated with any pull requests, skip push mode
                if (pullsResponse.data.length > 0) {
                    core.info(`Push event detected but commit ${commitSha} is associated with pull request(s). Skipping push mode.`);
                    return;
                }
            }
            catch (error) {
                // If we can't check the commit, log a warning but continue
                // This could happen if there are permission issues, but we don't want to fail the entire action
                core.warning(`Could not verify if commit ${commitSha} is associated with a PR: ${error instanceof Error ? error.message : "Unknown error"}. Proceeding with push mode.`);
            }
            // Push mode - create GitHub issue
            const headSha = contextValues.commitSha;
            const baseSha = context.payload.before;
            const pusherUsername = contextValues.username;
            const files = await (0, getPushFiles_1.getPushFiles)({
                octokit,
                owner,
                repo,
                commitSha: headSha,
                baseSha: baseSha,
            });
            // Filter out files that match ignore patterns
            const filteredFiles = (0, filterIgnoredFiles_1.filterIgnoredFiles)({ files, ignorePatterns });
            const analysis = await (0, analyzePR_1.analyzePR)({
                files: filteredFiles,
                apiKey,
                owner,
                repo,
                headSha,
                provider,
                baseUrl,
                model,
                pingUsers: [pusherUsername, ...(pingUsers ?? [])],
                severityFilter,
            });
            // If no analysis was performed (e.g., no text files), skip creating issue
            if (!analysis) {
                return;
            }
            // Create one GitHub issue per finding
            // Note: In push mode, we never create issues when there are no findings,
            // even if postCommentWhenNoIssues is enabled (this setting only applies to PR comments)
            if (analysis.allIssues.length > 0) {
                for (const issue of analysis.allIssues) {
                    const issueBody = (0, issue_1.formatSingleIssueForIssue)({
                        issue,
                        owner,
                        repo,
                        headSha,
                        pingUsers: [pusherUsername, ...(pingUsers ?? [])],
                    });
                    // Create a descriptive title for each issue
                    const location = issue.location?.file
                        ? ` in ${issue.location.file}${issue.location.startLine ? `:${issue.location.startLine}` : ""}`
                        : "";
                    const title = `${(0, format_1.getSeverityEmoji)(issue.severity)} ${issue.title}${location}`;
                    await octokit.rest.issues.create({
                        owner,
                        repo,
                        title,
                        body: issueBody,
                        labels: ["security", "saltman", issue.severity],
                    });
                }
            }
            return;
        }
        throw new Error("This action must be run on a pull request event or a push event with target-branch specified");
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed("Unknown error occurred");
        }
    }
}
// Execute the action
run();
