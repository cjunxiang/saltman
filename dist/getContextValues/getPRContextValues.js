"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPRContextValues = void 0;
const getPRContextValues = (context) => {
    if (!context.payload.pull_request) {
        throw new Error("Expected pull request event but payload.pull_request is missing");
    }
    return {
        prNumber: context.payload.pull_request.number,
        username: context.payload.pull_request.user.login,
        commitSha: context.payload.pull_request.head.sha,
    };
};
exports.getPRContextValues = getPRContextValues;
