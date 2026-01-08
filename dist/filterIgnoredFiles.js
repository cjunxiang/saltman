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
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterIgnoredFiles = void 0;
const minimatch_1 = require("minimatch");
const core = __importStar(require("@actions/core"));
// Common non-text file extensions that should be excluded from analysis
const NON_TEXT_EXTENSIONS = new Set([
    // Images
    "png",
    "jpg",
    "jpeg",
    "gif",
    // Note: SVG is intentionally excluded from this list because:
    // - SVG files are text-based XML that can contain embedded JavaScript
    // - They can include XSS vulnerabilities via <script> tags or event handlers
    // - GitHub provides patches for SVG files (they're text), so they should be analyzed
    "webp",
    "ico",
    "bmp",
    "tiff",
    "tif",
    "heic",
    "heif",
    "avif",
    "raw",
    "psd",
    "ai",
    "eps",
    // Binaries
    "exe",
    "dll",
    "so",
    "dylib",
    "bin",
    "o",
    "obj",
    "class",
    "jar",
    "war",
    "ear",
    // Archives
    "zip",
    "tar",
    "gz",
    "bz2",
    "xz",
    "7z",
    "rar",
    "cab",
    "deb",
    "rpm",
    "dmg",
    "iso",
    // Documents (binary formats)
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "odt",
    "ods",
    "odp",
    // Media
    "mp3",
    "mp4",
    "avi",
    "mov",
    "wmv",
    "flv",
    "mkv",
    "webm",
    "ogg",
    "wav",
    "flac",
    "aac",
    // Fonts
    "ttf",
    "otf",
    "woff",
    "woff2",
    "eot",
    // Other
    "db",
    "sqlite",
    "sqlite3",
    "lockb", // binary lock files
]);
/**
 * Check if a file is a text file using hybrid approach:
 * 1. Check if GitHub provided a patch (binary files don't have patches)
 * 2. Check file extension against known non-text file types
 * @returns Object with isText flag and reason (if not a text file)
 */
const isTextFile = (file) => {
    // First check: GitHub doesn't provide patches for binary files
    // This is the most reliable indicator from GitHub's API
    if (!file.patch || file.patch.length === 0) {
        return {
            isText: false,
            reason: "binary file (no patch provided by GitHub)",
        };
    }
    // Second check: extension-based filtering for known non-text types
    // This catches files early and handles edge cases
    const extension = file.filename.split(".").pop()?.toLowerCase();
    if (extension && NON_TEXT_EXTENSIONS.has(extension)) {
        return {
            isText: false,
            reason: `non-text file extension (.${extension})`,
        };
    }
    // Files without extensions are assumed to be text files (e.g., README, Dockerfile)
    return { isText: true };
};
const filterIgnoredFiles = ({ files, ignorePatterns, }) => {
    const ignoredFiles = [];
    const keptFiles = [];
    const filteredFiles = files.filter((file) => {
        // First, check if file is a text file (using patch + extension checks)
        const textFileCheck = isTextFile(file);
        if (!textFileCheck.isText) {
            ignoredFiles.push({
                filename: file.filename,
                reason: textFileCheck.reason || "non-text file",
            });
            return false; // Exclude non-text files
        }
        // Then, check if the file matches any ignore pattern
        if (ignorePatterns && ignorePatterns.length > 0) {
            let matchedPattern = null;
            const shouldIgnore = ignorePatterns.some((pattern) => {
                try {
                    const matches = (0, minimatch_1.minimatch)(file.filename, pattern);
                    if (matches) {
                        matchedPattern = pattern;
                    }
                    return matches;
                }
                catch (error) {
                    // If pattern is invalid, log warning but don't fail
                    core.warning(`Invalid ignore pattern "${pattern}": ${error instanceof Error ? error.message : "Unknown error"}`);
                    return false;
                }
            });
            if (shouldIgnore && matchedPattern) {
                ignoredFiles.push({
                    filename: file.filename,
                    reason: `matched pattern: "${matchedPattern}"`,
                });
                return false; // Exclude this file
            }
        }
        keptFiles.push(file.filename);
        return true; // Keep this file
    });
    // Log summary
    if (ignoredFiles.length > 0) {
        core.info(`\n📋 Ignored ${ignoredFiles.length} file(s):`);
        for (const { filename, reason } of ignoredFiles) {
            core.info(`  - ${filename} (${reason})`);
        }
    }
    if (ignorePatterns && ignorePatterns.length > 0) {
        core.info(`Ignore patterns configured: ${ignorePatterns.length} pattern(s)`);
        core.info(`Patterns: ${ignorePatterns.map((p) => `"${p}"`).join(", ")}`);
    }
    core.info(`\n✅ Analyzing ${keptFiles.length} file(s) after filtering:`);
    for (const filename of keptFiles) {
        core.info(`  - ${filename}`);
    }
    return filteredFiles;
};
exports.filterIgnoredFiles = filterIgnoredFiles;
