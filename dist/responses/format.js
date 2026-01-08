"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSolution = exports.formatExplanation = exports.formatCodeSnippet = exports.buildMetadataLine = exports.buildFilePermalink = exports.formatParagraphs = exports.sortIssues = exports.separateIssuesBySeverity = exports.getSeverityOrder = exports.getImpactLabel = exports.getExploitabilityLabel = exports.getSecurityCategoryLabel = exports.getSeverityEmoji = void 0;
// Shared utility functions for formatting
const getSeverityEmoji = (severity) => {
    switch (severity) {
        case "critical":
            return "🔴";
        case "high":
            return "🟠";
        case "medium":
            return "🟡";
        case "low":
            return "🟢";
        case "info":
            return "ℹ️";
    }
};
exports.getSeverityEmoji = getSeverityEmoji;
const getSecurityCategoryLabel = (category) => {
    if (!category)
        return "";
    switch (category) {
        case "injection":
            return "Injection";
        case "authentication":
            return "Authentication";
        case "authorization":
            return "Authorization";
        case "cryptography":
            return "Cryptography";
        case "xss":
            return "XSS";
        case "xxe":
            return "XXE";
        case "deserialization":
            return "Deserialization";
        case "ssrf":
            return "SSRF";
        case "csrf":
            return "CSRF";
        case "idor":
            return "IDOR";
        case "secrets":
            return "Secrets";
        case "config":
            return "Configuration";
        case "logging":
            return "Logging";
        case "api":
            return "API Security";
        case "other":
            return "Security";
    }
};
exports.getSecurityCategoryLabel = getSecurityCategoryLabel;
const getExploitabilityLabel = (exploitability) => {
    if (!exploitability)
        return "";
    switch (exploitability) {
        case "easy":
            return "Easy";
        case "medium":
            return "Medium";
        case "hard":
            return "Hard";
    }
};
exports.getExploitabilityLabel = getExploitabilityLabel;
const getImpactLabel = (impact) => {
    if (!impact)
        return "";
    switch (impact) {
        case "system_compromise":
            return "System Compromise";
        case "data_breach":
            return "Data Breach";
        case "privilege_escalation":
            return "Privilege Escalation";
        case "information_disclosure":
            return "Information Disclosure";
        case "denial_of_service":
            return "Denial of Service";
        case "data_modification":
            return "Data Modification";
        case "minimal":
            return "Minimal";
    }
};
exports.getImpactLabel = getImpactLabel;
const getSeverityOrder = (severity) => {
    switch (severity) {
        case "critical":
            return 0;
        case "high":
            return 1;
        case "medium":
            return 2;
        case "low":
            return 3;
        case "info":
            return 4;
    }
};
exports.getSeverityOrder = getSeverityOrder;
// Separate issues by severity: critical/high for inline, medium/low/info for aggregated
const separateIssuesBySeverity = (issues) => {
    const criticalHigh = [];
    const mediumLowInfo = [];
    issues.forEach((issue) => {
        if (issue.severity === "critical" || issue.severity === "high") {
            criticalHigh.push(issue);
        }
        else {
            mediumLowInfo.push(issue);
        }
    });
    return { criticalHigh, mediumLowInfo };
};
exports.separateIssuesBySeverity = separateIssuesBySeverity;
// Sort issues by severity only
const sortIssues = (issues) => {
    return [...issues].sort((a, b) => {
        return (0, exports.getSeverityOrder)(a.severity) - (0, exports.getSeverityOrder)(b.severity);
    });
};
exports.sortIssues = sortIssues;
// Format text with proper paragraph breaks for markdown
const formatParagraphs = (text) => {
    // Split by double newlines (paragraph breaks) or single newline if followed by content
    // This preserves intentional paragraph breaks while handling various formats
    return text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0)
        .join("\n\n");
};
exports.formatParagraphs = formatParagraphs;
const buildFilePermalink = (owner, repo, headSha, file, startLine, endLine) => {
    const baseUrl = `https://github.com/${owner}/${repo}/blob/${headSha}/${file}`;
    if (startLine) {
        if (endLine && endLine > startLine) {
            return `${baseUrl}#L${startLine}-L${endLine}`;
        }
        else {
            return `${baseUrl}#L${startLine}`;
        }
    }
    return baseUrl;
};
exports.buildFilePermalink = buildFilePermalink;
// Build metadata line for an issue (severity, category, exploitability, impact)
const buildMetadataLine = (issue) => {
    const formattedSeverity = issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1);
    const metadataLine = [`**Severity:** ${formattedSeverity}`];
    if (issue.securityCategory) {
        metadataLine.push(`**Category:** ${(0, exports.getSecurityCategoryLabel)(issue.securityCategory)}`);
    }
    if (issue.exploitability) {
        metadataLine.push(`**Exploitability:** ${(0, exports.getExploitabilityLabel)(issue.exploitability)}`);
    }
    if (issue.impact) {
        metadataLine.push(`**Impact:** ${(0, exports.getImpactLabel)(issue.impact)}`);
    }
    return metadataLine.join(" | ");
};
exports.buildMetadataLine = buildMetadataLine;
// Format code snippet consistently
const formatCodeSnippet = (codeSnippet) => {
    if (!codeSnippet) {
        return "";
    }
    return `\`\`\`\n${codeSnippet}\n\`\`\`\n\n`;
};
exports.formatCodeSnippet = formatCodeSnippet;
const formatExplanation = ({ explanation }) => {
    if (!explanation) {
        return "";
    }
    return `<details>\n<summary><strong>💡 Explanation</strong></summary>\n\n${(0, exports.formatParagraphs)(explanation)}\n\n</details>\n\n`;
};
exports.formatExplanation = formatExplanation;
const formatSolution = ({ suggestion, codeSnippet }) => {
    if (!suggestion) {
        return "";
    }
    const formattedSuggestion = (0, exports.formatParagraphs)(suggestion);
    const formattedCode = (0, exports.formatCodeSnippet)(codeSnippet);
    let output = `<details>\n<summary><strong>🛠️ Fix</strong></summary>\n\n`;
    output += `${formattedSuggestion}\n\n`;
    if (formattedCode) {
        output += `**Code example:**\n\n${formattedCode}`;
    }
    output += `</details>\n\n`;
    return output;
};
exports.formatSolution = formatSolution;
