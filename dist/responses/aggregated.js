"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatAggregatedComment = void 0;
const shared_1 = require("./shared");
const format_1 = require("./format");
// Format aggregated comment for medium/low/info issues
const formatAggregatedComment = ({ issues, owner, repo, headSha, hasCriticalHighIssues, pingUsers, }) => {
    if (issues.length === 0) {
        return null;
    }
    let output = buildAggregatedHeader({ hasCriticalHighIssues });
    // Sort issues by severity
    const sortedIssues = (0, format_1.sortIssues)(issues);
    sortedIssues.forEach((issue, index) => {
        output += `### ${index + 1}. ${(0, format_1.getSeverityEmoji)(issue.severity)} ${issue.title}\n\n`;
        // Build metadata line
        output += `${(0, format_1.buildMetadataLine)(issue)}\n\n`;
        // Brief description
        if (issue.description) {
            output += `${(0, format_1.formatParagraphs)(issue.description)}\n\n`;
        }
        // File and line reference with permalink
        if (issue.location?.file) {
            const { file, startLine, endLine } = issue.location;
            const permalink = (0, format_1.buildFilePermalink)(owner, repo, headSha, file, startLine ?? undefined, endLine ?? undefined);
            output += `${permalink}\n\n`;
        }
        output += (0, format_1.formatExplanation)({ explanation: issue.explanation });
        output += (0, format_1.formatSolution)({ suggestion: issue.suggestion, codeSnippet: issue.codeSnippet });
    });
    output += (0, shared_1.getSaltmanFooter)({ owner, repo, commitSha: headSha, pingUsers });
    return output;
};
exports.formatAggregatedComment = formatAggregatedComment;
const buildAggregatedHeader = ({ hasCriticalHighIssues, }) => {
    const title = hasCriticalHighIssues
        ? "## Saltman Code Review - Additional Findings"
        : "## Saltman Code Review";
    return `${title}\n\n`;
};
