"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPushContextValues = void 0;
const getPushContextValues = (context) => {
    if (context.eventName !== "push" || !context.payload.head_commit) {
        throw new Error("Expected push event but payload.head_commit is missing");
    }
    return {
        username: context.payload.head_commit.author.username || context.actor,
        commitSha: context.sha,
    };
};
exports.getPushContextValues = getPushContextValues;
