/**
 * RegexTransform - Performs regex replacements on values
 *
 * Updated to support format-specific regex replacements and string patterns with flags.
 */
import {
  Transform,
  TransformContext,
  TransformResult,
  TransformTarget,
  FormatId,
  createTransformResult,
} from "../core/types/transform-interfaces";
import { ErrorUtils } from "../core/utils/error-utils";

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
   * If not provided, the transform will be applied for all formats
   */
  format?: FormatId;
}

/**
 * RegexTransform - Performs regex replacements on text and attribute values
 *
 * Example usage:
 * ```
 * // Simple string replacement
 * XJX.fromXml(xml)
 *    .withTransforms(new RegexTransform({
 *      pattern: "foo",
 *      replacement: "bar"
 *    }))
 *    .toJson();
 *
 * // RegExp with flags for case-insensitive global replacement
 * XJX.fromXml(xml)
 *    .withTransforms(new RegexTransform({
 *      pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/gi,
 *      replacement: '<a href="$1">$1</a>'
 *    }))
 *    .toJson();
 *
 * // String pattern with embedded flags - NEW!
 * XJX.fromXml(xml)
 *    .withTransforms(new RegexTransform({
 *      pattern: "/world/i",
 *      replacement: "World"
 *    }))
 *    .toJson();
 *
 * // Format-specific replacement (only applied when converting to XML)
 * XJX.fromJson(json)
 *    .withTransforms(new RegexTransform({
 *      pattern: /([A-Z])/g,
 *      replacement: '-$1',
 *      format: 'xml' // Only apply when converting to XML
 *    }))
 *    .toXml();
 * ```
 */
export class RegexTransform implements Transform {
  // Target text values, CDATA, and comments
  targets = [
    TransformTarget.Value,
    TransformTarget.Text,
    TransformTarget.CDATA,
    TransformTarget.Comment,
  ];

  private regex!: RegExp;
  private replacement: string;
  private format?: FormatId;

  /**
   * Create a new regex transformer
   * @param options Transformer options
   */
  constructor(options: RegexOptions) {
    ErrorUtils.validate(
      !!options.pattern,
      "RegexTransform requires a pattern option",
      "general"
    );

    ErrorUtils.validate(
      options.replacement !== undefined,
      "RegexTransform requires a replacement option",
      "general"
    );

    this.replacement = options.replacement;
    this.format = options.format;

    // Create regex from pattern
    if (options.pattern instanceof RegExp) {
      // Use the RegExp directly with its flags
      this.regex = options.pattern;
    } else if (typeof options.pattern === "string") {
      const parsed = this.parseRegExpString(options.pattern);
      if (parsed) {
        try {
          this.regex = new RegExp(parsed.source, parsed.flags || "g");
        } catch (err) {
          const escapedPattern = this.escapeRegExp(options.pattern);
          this.regex = new RegExp(escapedPattern, "g");
        }
      } else {
        const escapedPattern = this.escapeRegExp(options.pattern);
        this.regex = new RegExp(escapedPattern, "g");
      }
    }
  }

  /**
   * Transform a string value using the configured regex replacement
   * @param value Value to transform
   * @param context Transformation context
   * @returns Transformed value result
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    // If format-specific and doesn't match current format, skip
    if (this.format !== undefined && this.format !== context.targetFormat) {
      return createTransformResult(value);
    }

    // Skip non-string values
    if (typeof value !== "string") {
      return createTransformResult(value);
    }

    // Perform the replacement
    const result = value.replace(this.regex, this.replacement);

    // Only return the new value if something changed
    return createTransformResult(result !== value ? result : value);
  }

  /**
   * Escape special characters in a string for use in a RegExp
   * @param string String to escape
   * @returns Escaped string
   * @private
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Parses a string in the format /pattern/flags, respecting escaped slashes.
   * Returns null if the string isn't a valid regex string.
   */
  private parseRegExpString(
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
}
