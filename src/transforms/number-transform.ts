/**
 * Number transform - Converts string values to numbers
 */
import {
  Transform,
  TransformOptions,
  createTransform,
} from "../core/transform";

/**
 * Options for number transform
 */
export interface NumberOptions extends TransformOptions {
  /**
   * Number of decimal places to round to (default: undefined = no rounding)
   */
  precision?: number;

  /**
   * Character used as decimal separator (default: '.')
   */
  decimalSeparator?: string;

  /**
   * Character used as thousands separator (default: ',')
   */
  thousandsSeparator?: string;

  /**
   * Whether to parse integers (default: true)
   */
  integers?: boolean;

  /**
   * Whether to parse decimals (default: true)
   */
  decimals?: boolean;

  /**
   * Whether to parse scientific notation (default: true)
   */
  scientific?: boolean;
}

/**
 * Create a transform that converts string values to numbers
 *
 * @example
 * ```
 * // Simple usage with defaults
 * xjx.transform(toNumber());
 *
 * // With options
 * xjx.transform(toNumber({
 *   precision: 2,
 *   thousandsSeparator: '.',
 *   decimalSeparator: ','
 * }));
 * ```
 *
 * @param options Number transform options
 * @returns A number transform function
 */
export function toNumber(options: NumberOptions = {}): Transform {
  const {
    precision,
    decimalSeparator = ".",
    thousandsSeparator = ",",
    integers = true,
    decimals = true,
    scientific = true,
    ...transformOptions
  } = options;

  return createTransform((value: any) => {
    // If already a number, just apply precision
    if (typeof value === "number") {
      return precision !== undefined ? Number(value.toFixed(precision)) : value;
    }

    // Handle null/undefined
    if (value == null) {
      return value;
    }

    // Convert to string for parsing
    const strValue = String(value).trim();
    if (!strValue) {
      return value;
    }

    // Quick check for simple configuration
    if (isSimpleConfig(options)) {
      const parsed = Number(strValue);
      if (!isNaN(parsed)) {
        return precision !== undefined
          ? Number(parsed.toFixed(precision))
          : parsed;
      }
    }

    // Complex parsing with custom separators
    return parseComplexNumber(strValue, {
      precision,
      decimalSeparator,
      thousandsSeparator,
      integers,
      decimals,
      scientific,
    });
  }, transformOptions);
}

/**
 * Check if using simple configuration for optimization
 */
function isSimpleConfig(options: NumberOptions): boolean {
  return (
    (options.integers === undefined || options.integers === true) &&
    (options.decimals === undefined || options.decimals === true) &&
    (options.scientific === undefined || options.scientific === true) &&
    (options.decimalSeparator === undefined ||
      options.decimalSeparator === ".") &&
    (options.thousandsSeparator === undefined ||
      options.thousandsSeparator === ",")
  );
}

/**
 * Parse complex numbers with custom separators
 */
function parseComplexNumber(
  strValue: string,
  options: {
    precision?: number;
    decimalSeparator: string;
    thousandsSeparator: string;
    integers: boolean;
    decimals: boolean;
    scientific: boolean;
  }
): any {
  const {
    precision,
    decimalSeparator,
    thousandsSeparator,
    integers,
    decimals,
    scientific,
  } = options;

  // Build regex pattern based on configuration
  const patterns: string[] = [];
  const escapedDecimal = escapeRegex(decimalSeparator);
  const escapedThousands = escapeRegex(thousandsSeparator);

  // Integer pattern
  if (integers) {
    patterns.push(`-?(?:\\d{1,3}(?:${escapedThousands}\\d{3})*|\\d+)`);
  }

  // Decimal pattern
  if (decimals) {
    patterns.push(
      `-?(?:\\d{1,3}(?:${escapedThousands}\\d{3})*|\\d*)${escapedDecimal}\\d+`
    );
  }

  // Scientific notation pattern
  if (scientific) {
    patterns.push(
      `-?(?:\\d+(?:${escapedDecimal}\\d+)?|\\d*${escapedDecimal}\\d+)[eE][+-]?\\d+`
    );
  }

  if (patterns.length === 0) {
    return strValue;
  }

  const fullPattern = `^(${patterns.join("|")})$`;
  const regex = new RegExp(fullPattern);

  if (!regex.test(strValue)) {
    return strValue;
  }

  // Normalize for JavaScript parsing
  let normalized = strValue;

  // Remove thousands separators
  if (thousandsSeparator) {
    const sepRegex = new RegExp(escapeRegex(thousandsSeparator), "g");
    normalized = normalized.replace(sepRegex, "");
  }

  // Replace decimal separator
  if (decimalSeparator !== ".") {
    const decRegex = new RegExp(escapeRegex(decimalSeparator), "g");
    normalized = normalized.replace(decRegex, ".");
  }

  const parsed = parseFloat(normalized);
  if (isNaN(parsed)) {
    return strValue;
  }

  // Apply precision if specified
  if (precision !== undefined) {
    return Number(parsed.toFixed(precision));
  }

  return parsed;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}