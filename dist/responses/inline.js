"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInlineComments = void 0;
const shared_1 = require("./shared");
const format_1 = require("./format");
// Format a single issue for inline comment (concise and actionable)
const formatInlineComment = ({ issue, owner, repo, headSha, pingUsers, }) => {
    let output = `### ${(0, format_1.getSeverityEmoji)(issue.severity)} ${issue.title}\n\n`;
    // Build metadata line
    output += `${(0, format_1.buildMetadataLine)(issue)}\n\n`;
    // Description (always visible, keep it concise)
    if (issue.description) {
        output += `${(0, format_1.formatParagraphs)(issue.description)}\n\n`;
    }
    output += (0, format_1.formatExplanation)({ explanation: issue.explanation });
    output += (0, format_1.formatSolution)({ suggestion: issue.suggestion, codeSnippet: issue.codeSnippet });
    output += (0, shared_1.getSaltmanFooter)({ owner, repo, commitSha: headSha, pingUsers });
    return output;
};
// Generate inline comments for critical/high issues
const generateInlineComments = ({ issues, owner, repo, headSha, pingUsers, }) => {
    const inlineComments = [];
    issues.forEach((issue) => {
        // Only create inline comments for issues with valid location and line numbers
        if (issue.location?.file && issue.location.startLine) {
            // Always use startLine and endLine (use startLine for endLine if not provided)
            const endLine = issue.location.endLine && issue.location.endLine > issue.location.startLine
                ? issue.location.endLine
                : issue.location.startLine;
            inlineComments.push({
                path: issue.location.file,
                startLine: issue.location.startLine,
                endLine,
                body: formatInlineComment({ issue, owner, repo, headSha, pingUsers }),
            });
        }
    });
    return inlineComments;
};
exports.generateInlineComments = generateInlineComments;
