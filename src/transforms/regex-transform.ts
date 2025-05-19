/**
 * RegexTransform - Performs regex replacements on values
 */
import {
  TransformContext,
  TransformResult,
  TransformTarget,
  createTransformResult,
  FORMAT
} from "../core/transform";
import { logger, validate } from "../core/error";

/**
 * Options for regex transformer
 */
export interface RegexOptions {
  /**
   * The pattern to search for
   * Can be a RegExp (with flags), a string, or a string in the format "/pattern/flags"
   */
  pattern: RegExp | string;

  /**
   * The replacement string
   * Can use RegExp capture groups with $1, $2, etc.
   */
  replacement: string;

  /**
   * Optional format this regex applies to
   * If provided, the transform will only be applied for this format
   */
  format?: FORMAT;
}

/**
 * Create a regex transform
 * @param options Regex transform options
 * @returns Transform implementation
 */
export function createRegexTransform(options: RegexOptions) {
  // Validate required options
  validate(!!options.pattern, "RegexTransform requires a pattern option");
  validate(options.replacement !== undefined, "RegexTransform requires a replacement option");
  
  // Process the pattern to create a RegExp
  const regex = processPattern(options.pattern);
  const replacement = options.replacement;
  const format = options.format;
  
  logger.debug('Created RegexTransform', {
    pattern: regex.source,
    replacement: replacement,
    format: format
  });
  
  // Create the transform
  return {
    // Target text values, CDATA, and comments
    targets: [
      TransformTarget.Value,
      TransformTarget.Text,
      TransformTarget.CDATA,
      TransformTarget.Comment,
    ],
    
    // Transform implementation
    transform(value: any, context: TransformContext): TransformResult<any> {
      try {
        // If format-specific and doesn't match current format, skip
        if (format !== undefined && format !== context.targetFormat) {
          return createTransformResult(value);
        }
  
        // Skip non-string values
        if (typeof value !== "string") {
          return createTransformResult(value);
        }
  
        // Perform the replacement
        const result = value.replace(regex, replacement);
  
        // Only return the new value if something changed
        return createTransformResult(result !== value ? result : value);
      } catch (err) {
        logger.error(`Regex transform error: ${err instanceof Error ? err.message : String(err)}`, {
          value,
          valueType: typeof value,
          path: context.path
        });
        
        // Return original value on error
        return createTransformResult(value);
      }
    }
  };
}

/**
 * Process pattern to create a RegExp
 */
function processPattern(pattern: RegExp | string): RegExp {
  if (pattern instanceof RegExp) {
    // Use the RegExp directly with its flags
    return pattern;
  } else if (typeof pattern === "string") {
    const parsed = parseRegExpString(pattern);
    if (parsed) {
      try {
        return new RegExp(parsed.source, parsed.flags || "g");
      } catch (err) {
        const escapedPattern = escapeRegExp(pattern);
        return new RegExp(escapedPattern, "g");
      }
    } else {
      const escapedPattern = escapeRegExp(pattern);
      return new RegExp(escapedPattern, "g");
    }
  } else {
    throw new Error("RegexTransform pattern must be a RegExp or string");
  }
}

/**
 * Escape special characters in a string for use in a RegExp
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parses a string in the format /pattern/flags, respecting escaped slashes
 */
function parseRegExpString(
  input: string
): { source: string; flags: string } | null {
  if (!input.startsWith("/")) return null;

  let i = 1;
  let inEscape = false;
  while (i < input.length) {
    const char = input[i];

    if (!inEscape && char === "/") {
      // End of pattern, everything after is flags
      const source = input.slice(1, i);
      const flags = input.slice(i + 1);
      return { source, flags };
    }

    inEscape = !inEscape && char === "\\";
    i++;
  }

  // If no closing / found
  return null;
}