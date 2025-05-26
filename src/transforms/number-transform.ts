/**
 * Number transform - Converts between string values and numbers
 */
import {
  Transform,
  TransformOptions,
  TransformIntent,
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
  
  /**
   * Format string for serializing numbers (default: undefined)
   * Examples:
   * - '0.00' - Fixed 2 decimal places
   * - '0,000.00' - Thousands separator with 2 decimal places
   * - '0.##' - Up to 2 decimal places
   */
  format?: string;
}

/**
 * Create a transform that converts between string values and numbers
 *
 * @example
 * ```
 * // PARSE mode (default): Convert strings to numbers
 * xjx.transform(toNumber());
 *
 * // With options
 * xjx.transform(toNumber({
 *   precision: 2,
 *   thousandsSeparator: '.',
 *   decimalSeparator: ','
 * }));
 * 
 * // SERIALIZE mode: Convert numbers to strings
 * xjx.transform(toNumber({ 
 *   intent: TransformIntent.SERIALIZE,
 *   format: '0.00'
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
    format,
    intent = TransformIntent.PARSE,
    ...transformOptions
  } = options;

  return createTransform((value: any) => {
    // Handle null/undefined
    if (value == null) {
      return value;
    }
    
    // SERIALIZE mode: convert number to string
    if (intent === TransformIntent.SERIALIZE && typeof value === 'number') {
      return formatNumber(value, {
        precision,
        decimalSeparator,
        thousandsSeparator,
        format
      });
    }
    
    // PARSE mode: convert string to number
    if (intent === TransformIntent.PARSE) {
      // If already a number, just apply precision
      if (typeof value === "number") {
        return precision !== undefined ? Number(value.toFixed(precision)) : value;
      }

      // Handle boolean values
      if (typeof value === "boolean") {
        return value ? true : false;
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
    }
    
    // Not applicable for the current intent, return original value
    return value;
  }, transformOptions);
}

/**
 * Format a number as a string using the provided options
 */
function formatNumber(
  value: number,
  options: {
    precision?: number;
    decimalSeparator?: string;
    thousandsSeparator?: string;
    format?: string;
  }
): string {
  const { precision, decimalSeparator = '.', thousandsSeparator = ',', format } = options;
  
  // Apply precision first if specified
  let num = value;
  if (precision !== undefined) {
    num = Number(value.toFixed(precision));
  }
  
  // If format is provided, use it
  if (format) {
    return applyCustomFormat(num, format, decimalSeparator, thousandsSeparator);
  }
  
  // Default formatting
  const parts = num.toString().split('.');
  
  // Format integer part with thousands separator
  if (thousandsSeparator) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  }
  
  // Join with decimal separator
  return parts.join(decimalSeparator);
}

/**
 * Apply a custom format to a number
 * Simple implementation of custom number formatting
 */
function applyCustomFormat(
  value: number,
  format: string,
  decimalSeparator: string,
  thousandsSeparator: string
): string {
  // Handle format patterns
  if (format === '0.00') {
    // Fixed 2 decimal places
    return formatNumber(value, { precision: 2, decimalSeparator, thousandsSeparator });
  } else if (format === '0,000.00') {
    // Thousands separator with 2 decimal places
    return formatNumber(value, { precision: 2, decimalSeparator, thousandsSeparator });
  } else if (format === '0.##') {
    // Up to 2 decimal places (no trailing zeros)
    const str = value.toString();
    const parts = str.split('.');
    if (parts.length === 1) {
      return parts[0]; // No decimal part
    }
    const decimalPart = parts[1].substring(0, 2);
    // Remove trailing zeros
    const trimmedDecimal = decimalPart.replace(/0+$/, '');
    if (trimmedDecimal === '') {
      return parts[0]; // No significant decimal digits
    }
    return parts[0] + decimalSeparator + trimmedDecimal;
  }
  
  // Fallback to default formatting
  return formatNumber(value, { decimalSeparator, thousandsSeparator });
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