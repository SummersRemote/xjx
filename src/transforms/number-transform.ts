/**
 * NumberTransform - Converts string values to numbers
 */
import { 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult,
  FORMAT
} from '../core/transform';
import { logger } from '../core/error';

/**
 * Options for number transformer
 */
export interface NumberTransformOptions {
  /**
   * Whether to convert integers (default: true)
   */
  integers?: boolean;
  
  /**
   * Whether to convert decimals (default: true)
   */
  decimals?: boolean;
  
  /**
   * Whether to convert scientific notation (default: true)
   */
  scientific?: boolean;
  
  /**
   * Decimal separator character (default: ".")
   */
  decimalSeparator?: string;
  
  /**
   * Thousands separator character (default: ",")
   * Will be removed before parsing
   */
  thousandsSeparator?: string;
}

/**
 * Create a number transform
 * @param options Number transform options
 * @returns Transform implementation
 */
export function createNumberTransform(options: NumberTransformOptions = {}) {
  // Get options with defaults
  const integers = options.integers !== false; // Default to true
  const decimals = options.decimals !== false; // Default to true
  const scientific = options.scientific !== false; // Default to true
  const decimalSeparator = options.decimalSeparator || '.';
  const thousandsSeparator = options.thousandsSeparator || ',';
  
  // Create the transform
  return {
    // Target values only
    targets: [TransformTarget.Value],
    
    // Transform implementation
    transform(value: any, context: TransformContext): TransformResult<any> {
      try {
        // Check if we're transforming to JSON or XML
        if (context.targetFormat === FORMAT.JSON) {
          // To JSON: Convert strings to numbers
          return stringToNumber(value, integers, decimals, scientific, decimalSeparator, thousandsSeparator);
        } else if (context.targetFormat === FORMAT.XML) {
          // To XML: Convert numbers to strings
          return numberToString(value);
        }
        
        // For any other format, keep as is
        return createTransformResult(value);
      } catch (err) {
        logger.error(`Number transform error: ${err instanceof Error ? err.message : String(err)}`, {
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
 * Convert a string to number
 */
function stringToNumber(
  value: any,
  integers: boolean,
  decimals: boolean,
  scientific: boolean,
  decimalSeparator: string,
  thousandsSeparator: string
): TransformResult<any> {
  // Already a number, return as is
  if (typeof value === 'number') {
    return createTransformResult(value);
  }
  
  // Skip non-string values
  if (typeof value !== 'string') {
    return createTransformResult(value);
  }
  
  // Try simple conversion first
  if (isDefaultConfiguration(integers, decimals, scientific, decimalSeparator, thousandsSeparator)) {
    const trimmed = value.trim();
    const parsed = Number(trimmed);
    
    if (!isNaN(parsed)) {
      return createTransformResult(parsed);
    }
  }
  
  // For more complex cases or custom options, use the full implementation
  return transformComplex(value, integers, decimals, scientific, decimalSeparator, thousandsSeparator);
}

/**
 * Convert a number to string
 */
function numberToString(value: any): TransformResult<any> {
  // Only convert number values
  if (typeof value === 'number') {
    return createTransformResult(String(value));
  }
  
  // Otherwise return unchanged
  return createTransformResult(value);
}

/**
 * Check if using default configuration
 */
function isDefaultConfiguration(
  integers: boolean,
  decimals: boolean,
  scientific: boolean,
  decimalSeparator: string,
  thousandsSeparator: string
): boolean {
  return integers === true && 
         decimals === true && 
         scientific === true && 
         decimalSeparator === '.' &&
         thousandsSeparator === ',';
}

/**
 * Complex transformation with custom options
 */
function transformComplex(
  value: any,
  integers: boolean,
  decimals: boolean,
  scientific: boolean,
  decimalSeparator: string,
  thousandsSeparator: string
): TransformResult<any> {
  const strValue = String(value).trim();
  if (!strValue) return createTransformResult(value);

  let patternParts: string[] = [];
  let escapedDecimal = decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let escapedThousands = thousandsSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Build integer pattern with proper thousands separator grouping
  if (integers) {
    let intPattern = `(?:-?(?:\\d{1,3}(?:${escapedThousands}\\d{3})*))`;
    patternParts.push(intPattern);
  }

  // Build decimal pattern
  if (decimals) {
    let decPattern = `(?:-?(?:\\d{1,3}(?:${escapedThousands}\\d{3})*|\\d*)${escapedDecimal}\\d+)`;
    patternParts.push(decPattern);
  }

  // Build scientific notation pattern (with optional decimal)
  if (scientific) {
    let sciPattern = `(?:-?(?:\\d+(?:${escapedDecimal}\\d+)?|\\d*${escapedDecimal}\\d+)[eE][+-]?\\d+)`;
    patternParts.push(sciPattern);
  }

  const fullPattern = `^(${patternParts.join('|')})$`;
  const regex = new RegExp(fullPattern);

  if (!regex.test(strValue)) {
    return createTransformResult(value);
  }

  // Normalize to JS-parsable format
  let normalized = strValue;

  if (thousandsSeparator) {
    const sepRegex = new RegExp(escapedThousands, 'g');
    normalized = normalized.replace(sepRegex, '');
  }

  if (decimalSeparator !== '.') {
    const decRegex = new RegExp(escapedDecimal, 'g');
    normalized = normalized.replace(decRegex, '.');
  }

  const parsed = parseFloat(normalized);
  return createTransformResult(isNaN(parsed) ? value : parsed);
}