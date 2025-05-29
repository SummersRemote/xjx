/**
 * Number node transform - Converts string node values to numbers
 */
import { XNode } from '../core/xnode';

/**
 * Options for number node transform
 */
export interface NumberTransformOptions {
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
   * Only transform nodes with these names (default: transform all)
   */
  nodeNames?: string[];
  
  /**
   * Skip nodes with these names (default: none)
   */
  skipNodes?: string[];
}

/**
 * Create a node transformer that converts string values to numbers
 *
 * @example
 * ```typescript
 * // Transform all numeric nodes
 * xjx.fromXml(xml).map(toNumber()).toJson();
 * 
 * // Transform only specific nodes with precision
 * xjx.fromXml(xml).map(toNumber({
 *   nodeNames: ['price', 'total', 'amount'],
 *   precision: 2
 * })).toJson();
 * 
 * // Custom separators (European format)
 * xjx.fromXml(xml).map(toNumber({
 *   decimalSeparator: ',',
 *   thousandsSeparator: '.'
 * })).toJson();
 * ```
 *
 * @param options Number transform options
 * @returns A node transformer function for use with map()
 */
export function toNumber(options: NumberTransformOptions = {}): (node: XNode) => XNode {
  const {
    precision,
    decimalSeparator = ".",
    thousandsSeparator = ",",
    integers = true,
    decimals = true,
    scientific = true,
    nodeNames,
    skipNodes = []
  } = options;

  return (node: XNode): XNode => {
    // Skip if this node should be skipped
    if (skipNodes && skipNodes.length > 0 && skipNodes.includes(node.name)) {
      return node;
    }
    
    // Skip if nodeNames is specified with items and this node isn't included
    if (nodeNames && nodeNames.length > 0 && !nodeNames.includes(node.name)) {
      return node;
    }
    
    // Skip if node has no value
    if (node.value === undefined) {
      return node;
    }
    
    // If already a number, just apply precision if specified
    if (typeof node.value === "number") {
      const finalValue = precision !== undefined 
        ? Number(node.value.toFixed(precision)) 
        : node.value;
      return { ...node, value: finalValue };
    }

    // Convert to string for parsing
    const strValue = String(node.value).trim();
    if (!strValue) {
      return node;
    }

    // Try parsing the number
    const parsedNumber = parseNumberString(strValue, {
      precision,
      decimalSeparator,
      thousandsSeparator,
      integers,
      decimals,
      scientific,
    });
    
    // If parsing succeeded, return transformed node
    if (parsedNumber !== null) {
      return { ...node, value: parsedNumber };
    }
    
    // No match, return original node unchanged
    return node;
  };
}

/**
 * Parse a number string with custom separators and options
 */
function parseNumberString(
  strValue: string,
  options: {
    precision?: number;
    decimalSeparator: string;
    thousandsSeparator: string;
    integers: boolean;
    decimals: boolean;
    scientific: boolean;
  }
): number | null {
  const {
    precision,
    decimalSeparator,
    thousandsSeparator,
    integers,
    decimals,
    scientific,
  } = options;

  // Quick check for simple configuration
  if (isSimpleConfig(options)) {
    const parsed = Number(strValue);
    if (!isNaN(parsed)) {
      return precision !== undefined
        ? Number(parsed.toFixed(precision))
        : parsed;
    }
    return null;
  }

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
    return null;
  }

  const fullPattern = `^(${patterns.join("|")})$`;
  const regex = new RegExp(fullPattern);

  if (!regex.test(strValue)) {
    return null;
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
    return null;
  }

  // Apply precision if specified
  if (precision !== undefined) {
    return Number(parsed.toFixed(precision));
  }

  return parsed;
}

/**
 * Check if using simple configuration for optimization
 */
function isSimpleConfig(options: {
  decimalSeparator: string;
  thousandsSeparator: string;
  integers: boolean;
  decimals: boolean;
  scientific: boolean;
}): boolean {
  return (
    options.integers === true &&
    options.decimals === true &&
    options.scientific === true &&
    options.decimalSeparator === "." &&
    options.thousandsSeparator === ","
  );
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}