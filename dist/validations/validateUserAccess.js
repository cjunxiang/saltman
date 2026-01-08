"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserAccess = void 0;
const validateUserAccess = async ({ octokit, owner, repo, username, }) => {
    const { data: permission } = await octokit.rest.repos.getCollaboratorPermissionLevel({
        owner,
        repo,
        username,
    });
    const hasWriteAccess = ["write", "maintain", "admin"].includes(permission.permission);
    if (!hasWriteAccess) {
        throw new Error("User does not have collaborator access to the repository");
    }
};
exports.validateUserAccess = validateUserAccess;
