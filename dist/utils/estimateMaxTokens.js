"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateMaxTokens = void 0;
const estimateMaxTokens = ({ diff, defaultMax, multiplier = 3, }) => {
    // Rough estimate: 1 token ≈ 4 characters
    const approxTokens = Math.ceil(diff.length / 4);
    // Multiply by a factor to leave room for model output
    const maxTokens = approxTokens * multiplier;
    return Math.min(maxTokens, defaultMax);
};
exports.estimateMaxTokens = estimateMaxTokens;
