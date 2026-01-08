"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewResponseSchema = exports.ReviewIssueSchema = exports.SECURITY_CATEGORY_VALUES = exports.IMPACT_VALUES = exports.EXPLOITABILITY_VALUES = exports.SEVERITY_VALUES = void 0;
const zod_1 = require("zod");
// ============================================================================
// Single source of truth for all enum values and types
// ============================================================================
exports.SEVERITY_VALUES = ["critical", "high", "medium", "low", "info"];
exports.EXPLOITABILITY_VALUES = ["easy", "medium", "hard"];
exports.IMPACT_VALUES = [
    "system_compromise",
    "data_breach",
    "privilege_escalation",
    "information_disclosure",
    "denial_of_service",
    "data_modification",
    "minimal",
];
exports.SECURITY_CATEGORY_VALUES = [
    "injection",
    "authentication",
    "authorization",
    "cryptography",
    "xss",
    "xxe",
    "deserialization",
    "ssrf",
    "csrf",
    "idor",
    "secrets",
    "config",
    "logging",
    "api",
    "other",
];
const LocationSchema = zod_1.z
    .object({
    file: zod_1.z
        .string()
        .describe("File path where the issue is located (from the diff, e.g., 'src/file.ts')"),
    startLine: zod_1.z
        .number()
        .int()
        .positive()
        .nullable()
        .optional()
        .describe("Starting line number (1-indexed)"),
    endLine: zod_1.z
        .number()
        .int()
        .positive()
        .nullable()
        .optional()
        .describe("Ending line number (1-indexed, only if issue spans multiple lines)"),
})
    .nullable()
    .optional()
    .describe("Location of the issue in the codebase");
exports.ReviewIssueSchema = zod_1.z.object({
    title: zod_1.z.string().describe("Concise title for the issue (3-8 words)"),
    severity: zod_1.z
        .enum(exports.SEVERITY_VALUES)
        .describe("Severity level based on VAPT urgency: critical (fix within 24-48h, system compromise), high (fix within 1 week, significant impact), medium (fix within 1 month, moderate impact), low (fix when convenient, minimal impact), info (informational only, no action required)"),
    description: zod_1.z
        .string()
        .describe("Brief 2-line summary of the issue (visible by default, keep it concise and to the point)"),
    explanation: zod_1.z
        .string()
        .describe("More detailed but succinct explanation of the issue, why it matters, and its impact (straight-to-the-point, will be shown in a dropdown). For vulnerabilities, clearly explain the attack vector and potential consequences."),
    location: LocationSchema,
    suggestion: zod_1.z.string().nullable().optional().describe("Helpful suggestion for fixing the issue"),
    codeSnippet: zod_1.z
        .string()
        .nullable()
        .optional()
        .describe("Optional code snippet showing the proposed solution. Only include this when a code example would genuinely help the engineer understand the fix better. Most issues should NOT include this field. Only include when the solution is complex or when seeing actual code would significantly clarify the approach."),
    // Security-specific fields
    securityCategory: zod_1.z
        .enum(exports.SECURITY_CATEGORY_VALUES)
        .nullable()
        .optional()
        .describe("Security vulnerability category (only for vulnerability and misconfiguration type issues): injection (SQL, NoSQL, Command, etc.), authentication, authorization, cryptography, xss, xxe, deserialization, ssrf, csrf, idor, secrets (hardcoded credentials), config (misconfiguration), logging (insufficient logging), api (API security issues), other"),
    exploitability: zod_1.z
        .enum(exports.EXPLOITABILITY_VALUES)
        .nullable()
        .optional()
        .describe("How easy it is to exploit this vulnerability: easy (trivial to exploit, no special conditions), medium (requires some conditions or knowledge), hard (requires significant effort or specific conditions). Only for vulnerability type issues. Do not report issues that are impossible to exploit."),
    impact: zod_1.z
        .enum(exports.IMPACT_VALUES)
        .nullable()
        .optional()
        .describe("Potential impact if exploited: system_compromise (full system control), data_breach (sensitive data exposure), privilege_escalation (unauthorized access elevation), information_disclosure (leakage of sensitive info), denial_of_service (service unavailability), data_modification (unauthorized data changes), minimal (negligible impact). Only for vulnerability type issues."),
});
exports.ReviewResponseSchema = zod_1.z.object({
    issues: zod_1.z.array(exports.ReviewIssueSchema).describe("List of issues found in the code"),
});
