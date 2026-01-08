"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSingleIssueForIssue = void 0;
const shared_1 = require("./shared");
const format_1 = require("./format");
// Format a single issue for a GitHub issue body (used for push events)
const formatSingleIssueForIssue = ({ issue, owner, repo, headSha, pingUsers, }) => {
    // Add Saltman label to the title, which can be used for dedeuplication of issues
    let output = `## ${(0, format_1.getSeverityEmoji)(issue.severity)} ${issue.title}\n\n`;
    // Build metadata line
    output += `${(0, format_1.buildMetadataLine)(issue)}\n\n`;
    if (issue.description) {
        output += `${(0, format_1.formatParagraphs)(issue.description)}\n\n`;
    }
    // File and line reference with permalink
    if (issue.location?.file) {
        const { file, startLine, endLine } = issue.location;
        const permalink = (0, format_1.buildFilePermalink)(owner, repo, headSha, file, startLine ?? undefined, endLine ?? undefined);
        output += `**Location:** ${permalink}\n\n`;
    }
    output += (0, format_1.formatExplanation)({ explanation: issue.explanation });
    output += (0, format_1.formatSolution)({ suggestion: issue.suggestion, codeSnippet: issue.codeSnippet });
    output += (0, shared_1.getSaltmanFooter)({
        owner,
        repo,
        commitSha: headSha,
        pingUsers,
    });
    return output;
};
exports.formatSingleIssueForIssue = formatSingleIssueForIssue;
