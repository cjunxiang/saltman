"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePR = void 0;
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("openai/helpers/zod");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const core = __importStar(require("@actions/core"));
const zod_2 = require("@anthropic-ai/sdk/helpers/beta/zod");
const openai_compatible_1 = require("@ai-sdk/openai-compatible");
const ai_1 = require("ai");
const format_1 = require("./responses/format");
const inline_1 = require("./responses/inline");
const aggregated_1 = require("./responses/aggregated");
const types_1 = require("./types");
const prompts_1 = require("./prompts");
const githubInputs_1 = require("./validations/githubInputs");
const estimateMaxTokens_1 = require("./utils/estimateMaxTokens");
const filterIssuesBySeverity_1 = require("./filterIssuesBySeverity");
const callOpenAI = async (apiKey, model, diff) => {
    core.info(`📡 Calling OpenAI API with model: ${model}`);
    const openai = new openai_1.default({
        apiKey: apiKey,
    });
    const response = await openai.responses.parse({
        model: model,
        input: [
            {
                role: "system",
                content: (0, prompts_1.getSystemMessage)(),
            },
            {
                role: "user",
                content: (0, prompts_1.buildAnalysisPrompt)(diff),
            },
        ],
        text: {
            format: (0, zod_1.zodTextFormat)(types_1.ReviewResponseSchema, "code_review_response"),
        },
    });
    // Check if output_parsed is null (can happen when model refuses or parsing fails)
    if (response.output_parsed === null) {
        throw new Error("Model response could not be parsed. The model may have refused to respond or the response format was invalid.");
    }
    return response.output_parsed;
};
const callAnthropic = async (apiKey, model, diff) => {
    core.info(`📡 Calling Anthropic API with model: ${model}`);
    const anthropic = new sdk_1.default({
        apiKey: apiKey,
    });
    const response = await anthropic.beta.messages.create({
        model: model,
        max_tokens: (0, estimateMaxTokens_1.estimateMaxTokens)({ diff, defaultMax: 4096 }),
        betas: ["structured-outputs-2025-11-13"],
        system: (0, prompts_1.getSystemMessage)(),
        messages: [
            {
                role: "user",
                content: (0, prompts_1.buildAnalysisPrompt)(diff),
            },
        ],
        output_format: (0, zod_2.betaZodOutputFormat)(types_1.ReviewResponseSchema),
    });
    // Parse the JSON response from the text content
    const responseText = response.content[0]?.type === "text" ? response.content[0].text : null;
    if (!responseText) {
        throw new Error("Model response could not be parsed. The model may have refused to respond or the response format was invalid.");
    }
    // Parse and validate the JSON response using the Zod schema
    const parsed = JSON.parse(responseText);
    return types_1.ReviewResponseSchema.parse(parsed);
};
const callOpenAICompatible = async (apiKey, baseUrl, model, diff) => {
    core.info(`📡 Calling OpenAI-compatible API at ${baseUrl} with model: ${model}`);
    const openaiCompatible = (0, openai_compatible_1.createOpenAICompatible)({
        name: "openai-compatible",
        baseURL: baseUrl,
        apiKey: apiKey,
        supportsStructuredOutputs: true,
    });
    const { object } = await (0, ai_1.generateObject)({
        model: openaiCompatible.chatModel(model),
        system: (0, prompts_1.getSystemMessage)(),
        prompt: (0, prompts_1.buildAnalysisPrompt)(diff),
        schema: types_1.ReviewResponseSchema,
    });
    if (!object) {
        throw new Error("Model response could not be parsed. The model may have refused to respond or the response format was invalid.");
    }
    return object;
};
const analyzePR = async ({ files, apiKey, owner, repo, headSha, provider, baseUrl, model, pingUsers, severityFilter, }) => {
    // Filter out files without patches (binary files, etc.)
    const filesWithPatches = files.filter((file) => file.patch && file.patch.length > 0);
    // No text-based files to review - return null (no analysis performed)
    if (filesWithPatches.length === 0) {
        return null;
    }
    try {
        // Convert file changes to a single diff string
        // Include filename so LLM knows which file each diff belongs to
        const diff = filesWithPatches
            .map((file) => `--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch}`)
            .join("\n\n");
        // Call the appropriate provider
        const modelWithDefault = (0, githubInputs_1.getModelWithDefault)(provider, model);
        core.info(`🚀 Starting code analysis with ${provider} using model: ${modelWithDefault}`);
        let parsedReview;
        switch (provider) {
            case "anthropic":
                parsedReview = await callAnthropic(apiKey, modelWithDefault, diff);
                break;
            case "openai":
                parsedReview = await callOpenAI(apiKey, modelWithDefault, diff);
                break;
            case "openai-compatible":
                if (!baseUrl) {
                    throw new Error('base-url is required when provider is "openai-compatible"');
                }
                if (!model) {
                    throw new Error('model is required when provider is "openai-compatible"');
                }
                parsedReview = await callOpenAICompatible(apiKey, baseUrl, model, diff);
                break;
            default:
                const _exhaustiveCheck = provider;
                throw new Error(`Unsupported provider: ${_exhaustiveCheck}`);
        }
        // Log successful API response
        core.info(`✅ Successfully received response from ${provider} model: ${modelWithDefault}`);
        // Log AI response in nicely formatted JSON for debugging
        core.info("=== AI Response (Parsed) ===");
        core.info(JSON.stringify(parsedReview, null, 2));
        // Return null if there are no issues
        if (!parsedReview.issues || parsedReview.issues.length === 0) {
            return {
                inlineComments: [],
                aggregatedComment: null,
                allIssues: [],
            };
        }
        const filteredIssues = (0, filterIssuesBySeverity_1.filterIssuesBySeverity)({
            issues: parsedReview.issues,
            severityFilter,
        });
        if (filteredIssues.length === 0) {
            return {
                inlineComments: [],
                aggregatedComment: null,
                allIssues: [],
            };
        }
        // Separate issues by severity
        const { criticalHigh, mediumLowInfo } = (0, format_1.separateIssuesBySeverity)(filteredIssues);
        // Generate inline comments for critical/high issues
        const inlineComments = (0, inline_1.generateInlineComments)({
            issues: criticalHigh,
            owner,
            repo,
            headSha,
            pingUsers,
        });
        // Generate aggregated comment for medium/low/info issues
        const aggregatedComment = mediumLowInfo.length > 0
            ? (0, aggregated_1.formatAggregatedComment)({
                issues: mediumLowInfo,
                owner,
                repo,
                headSha,
                hasCriticalHighIssues: criticalHigh.length > 0,
                pingUsers,
            })
            : null;
        return {
            inlineComments,
            aggregatedComment,
            allIssues: filteredIssues,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`${provider} API error: ${errorMessage}`);
        // Re-throw the error so CI fails when there's an API error
        throw error;
    }
};
exports.analyzePR = analyzePR;
