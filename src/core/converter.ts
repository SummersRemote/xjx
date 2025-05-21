/**
 * Core converter interfaces and types
 */
import { Configuration } from './config';

/**
 * Basic converter interface
 */
export interface Converter<TInput, TOutput, TOptions = any> {
  /**
   * Convert from input to output format
   * @param input Input to convert
   * @param options Optional conversion options
   * @returns Converted output
   */
  convert(input: TInput, options?: TOptions): TOutput;
}

/**
 * Create a converter with configuration
 * @param config Configuration for the converter
 * @param convertFn Implementation function
 * @returns Converter implementation
 */
export function createConverter<TInput, TOutput, TOptions = any>(
  config: Configuration,
  convertFn: (input: TInput, config: Configuration, options?: TOptions) => TOutput
): Converter<TInput, TOutput, TOptions> {
  return {
    convert(input: TInput, options?: TOptions): TOutput {
      return convertFn(input, config, options);
    }
  };
}

/**
 * Input validation function
 * @param input Input to validate
 * @param message Error message if validation fails
 * @param validator Optional custom validator function
 */
export function validateInput<T>(
  input: T, 
  message: string,
  validator?: (value: T) => boolean
): void {
  const isValid = validator ? validator(input) : input !== null && input !== undefined;
  if (!isValid) {
    throw new Error(message);
  }
}

/**
 * Options for JSON conversion
 */
export interface JsonOptions {
  /**
   * Whether to use high-fidelity mode
   */
  highFidelity?: boolean;
  
  /**
   * Override attribute strategy
   */
  attributeStrategy?: 'merge' | 'prefix' | 'property';
  
  /**
   * Override text strategy
   */
  textStrategy?: 'direct' | 'property';
  
  /**
   * Override namespace strategy
   */
  namespaceStrategy?: 'prefix' | 'property';
  
  /**
   * Override array strategy
   */
  arrayStrategy?: 'multiple' | 'always' | 'never';
  
  /**
   * Override empty element strategy
   */
  emptyElementStrategy?: 'object' | 'null' | 'string';
  
  /**
   * Override mixed content strategy
   */
  mixedContentStrategy?: 'preserve' | 'prioritize-text' | 'prioritize-elements';

  /**
   * Override formatting options
   */
  formatting?: Partial<Configuration['formatting']>;
}

/**
 * Context for JSON processing
 */
export interface JsonProcessingContext {
  /**
   * Current configuration
   */
  config: Configuration;
  
  /**
   * Namespace map for resolving namespaces
   */
  namespaceMap: Record<string, string>;
  
  /**
   * Parent node (for fromJson direction)
   */
  parentNode?: any;
  
  /**
   * Current path in the document
   */
  path: string[];
  
  /**
   * Current processing depth
   */
  depth: number;
}

/**
 * JSON value types
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue }
export type JsonArray = JsonValue[];

/**
 * Format detection result
 */
export interface FormatDetectionResult {
  /**
   * Whether the JSON is in high-fidelity format
   */
  isHighFidelity: boolean;
  
  /**
   * Whether the JSON is an array
   */
  isArray: boolean;
  
  /**
   * Root element name (if object)
   */
  rootName?: string;
}