/**
 * RegexTransform - Performs regex replacements on values
 *
 * Simplified implementation using the BaseTransform from core
 */
import {
  TransformContext,
  TransformResult,
  TransformTarget,
  BaseTransform,
  FORMAT
} from "../core/transform";
import { logger, validate, ValidationError, handleError, ErrorType } from "../core/error";

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
  format?: FORMAT;
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
export class RegexTransform extends BaseTransform {
  private regex!: RegExp;
  private replacement: string;
  private format?: FORMAT;

  /**
   * Create a new regex transformer
   * @param options Transformer options
   */
  constructor(options: RegexOptions) {
    // Target text values, CDATA, and comments
    super([
      TransformTarget.Value,
      TransformTarget.Text,
      TransformTarget.CDATA,
      TransformTarget.Comment,
    ]);

    try {
      // Validate required options
      validate(!!options.pattern, "RegexTransform requires a pattern option");
      validate(options.replacement !== undefined, "RegexTransform requires a replacement option");

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
      } else {
        throw new ValidationError("RegexTransform pattern must be a RegExp or string", options);
      }

      logger.debug('Created RegexTransform', {
        pattern: options.pattern instanceof RegExp ? options.pattern.source : options.pattern,
        replacement: options.replacement,
        format: options.format
      });
    } catch (err) {
      throw handleError(err, "create RegexTransform", {
        data: {
          pattern: options?.pattern instanceof RegExp ? options.pattern.source : options?.pattern,
          replacement: options?.replacement,
          format: options?.format
        },
        errorType: ErrorType.VALIDATION
      });
    }
  }

  /**
   * Transform a string value using the configured regex replacement
   * @param value Value to transform
   * @param context Transformation context
   * @returns Transformed value result
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    try {
      // Validate context using base class method
      this.validateContext(context);
      
      // If format-specific and doesn't match current format, skip
      if (this.format !== undefined && this.format !== context.targetFormat) {
        return this.success(value);
      }

      // Skip non-string values
      if (typeof value !== "string") {
        return this.success(value);
      }

      // Perform the replacement
      const result = value.replace(this.regex, this.replacement);

      // Only return the new value if something changed
      return this.success(result !== value ? result : value);
    } catch (err) {
      return handleError(err, "apply regex transform", {
        data: {
          valueType: typeof value,
          valuePreview: typeof value === 'string' ? value.substring(0, 50) : null,
          path: context.path,
          targetFormat: context.targetFormat,
          pattern: this.regex.source,
          replacement: this.replacement
        },
        errorType: ErrorType.TRANSFORM,
        fallback: this.success(value) // Return original value as fallback
      });
    }
  }

  /**
   * Escape special characters in a string for use in a RegExp
   * @param string String to escape
   * @returns Escaped string
   * @private
   */
  private escapeRegExp(string: string): string {
    try {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    } catch (err) {
      return handleError(err, "escape regex pattern", {
        data: { stringLength: string?.length },
        fallback: string // Return original string as fallback
      });
    }
  }

  /**
   * Parses a string in the format /pattern/flags, respecting escaped slashes.
   * Returns null if the string isn't a valid regex string.
   */
  private parseRegExpString(
    input: string
  ): { source: string; flags: string } | null {
    try {
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
    } catch (err) {
      return handleError(err, "parse regex string", {
        data: { input },
        fallback: null
      });
    }
  }
}