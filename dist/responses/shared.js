"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSaltmanFooter = void 0;
const zod_1 = require("zod");
const SALTMAN_REPO_URL = "https://github.com/adriangohjw/saltman";
const SHORT_SHA_LENGTH = 7;
const pingUsersSchema = zod_1.z
    .array(zod_1.z.string().transform((val) => (val.startsWith("@") ? val : `@${val}`)))
    .transform((arr) => [...new Set(arr)])
    .optional()
    .default([]);
const getSaltmanFooter = ({ owner, repo, commitSha, pingUsers, }) => {
    const saltmanLink = `[Saltman](${SALTMAN_REPO_URL})`;
    const footerBase = `<sub>

---

Written by ${saltmanLink}`;
    const validatedPingUsers = pingUsersSchema.safeParse(pingUsers);
    const uniqueMentions = validatedPingUsers.success ? validatedPingUsers.data : [];
    const mentionsText = uniqueMentions.length > 0 ? `\n\nCC: ${uniqueMentions.join(" ")}` : "";
    if (commitSha) {
        const shortSha = commitSha.substring(0, SHORT_SHA_LENGTH);
        const commitUrl = `https://github.com/${owner}/${repo}/commit/${commitSha}`;
        const commitLink = `[${shortSha}](${commitUrl})`;
        return `${footerBase} for commit ${commitLink}.${mentionsText}</sub>`;
    }
    return `${footerBase}.${mentionsText}</sub>`;
};
exports.getSaltmanFooter = getSaltmanFooter;
