import type { ParsedReview } from "../types";
import { SECURITY_CATEGORY_VALUES } from "../types";

/**
 * Sanitizes a parsed review response from an LLM to fix common validation errors.
 *
 * This handles cases where models without proper structured output support
 * (e.g., GLM-4.7) return invalid values for enum fields like securityCategory.
 *
 * Known issues:
 * - securityCategory is sometimes an array instead of a string
 * - securityCategory can be an invalid string not in the allowed enum
 *
 * @param parsed - The parsed review response from the LLM
 * @returns Sanitized review response with valid enum values
 */
export function sanitizeReviewResponse(parsed: any): ParsedReview {
  if (!parsed || !parsed.issues || !Array.isArray(parsed.issues)) {
    return parsed;
  }

  return {
    ...parsed,
    issues: parsed.issues.map((issue: any) => {
      // Fix securityCategory if it's invalid
      if (issue.securityCategory !== undefined && issue.securityCategory !== null) {
        // If securityCategory is an array, convert to "other"
        if (Array.isArray(issue.securityCategory)) {
          console.warn(
            `⚠️  Invalid securityCategory (array) in issue "${issue.title}": defaulting to "other"`
          );
          return { ...issue, securityCategory: "other" };
        }

        // If securityCategory is an invalid string, default to "other"
        if (
          typeof issue.securityCategory === "string" &&
          !SECURITY_CATEGORY_VALUES.includes(issue.securityCategory as any)
        ) {
          console.warn(
            `⚠️  Invalid securityCategory "${issue.securityCategory}" in issue "${issue.title}": defaulting to "other"`
          );
          return { ...issue, securityCategory: "other" };
        }
      }

      return issue;
    }),
  };
}
