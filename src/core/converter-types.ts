/**
 * Types and interfaces for converters
 */
import { XNode } from './xnode';
import { Configuration } from './config';

/**
 * Basic converter interface
 */
export interface Converter<TInput, TOutput> {
  /**
   * Convert from input to output format
   * @param input Input to convert
   * @returns Converted output
   */
  convert(input: TInput): TOutput;
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
  parentNode?: XNode;
  
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

/**
 * Interface for JSON to XNode converter
 */
export interface JsonToXNodeConverter {
  /**
   * Convert JSON to XNode
   * @param json JSON value to convert
   * @param options Conversion options
   * @returns XNode representation
   */
  convert(json: JsonValue, options?: JsonOptions): XNode;
  
  /**
   * Detect format of JSON input
   * @param json JSON value to analyze
   * @returns Format detection result
   */
  detectFormat(json: JsonValue): FormatDetectionResult;
}

/**
 * Interface for XNode to JSON converter
 */
export interface XNodeToJsonConverter {
  /**
   * Convert XNode to JSON
   * @param node XNode to convert
   * @param options Conversion options
   * @returns JSON representation
   */
  convert(node: XNode, options?: JsonOptions): JsonValue;
}

/**
 * Unified interface for JSON converters
 */
export interface JsonConverter {
  /**
   * Convert to JSON
   * @param node XNode to convert
   * @param options Conversion options
   * @returns JSON representation
   */
  toJson(node: XNode, options?: JsonOptions): JsonValue;
  
  /**
   * Convert from JSON
   * @param json JSON value to convert
   * @param options Conversion options
   * @returns XNode representation
   */
  fromJson(json: JsonValue, options?: JsonOptions): XNode;
  
  /**
   * Detect if JSON is in high-fidelity format
   * @param json JSON value to analyze
   * @returns Format detection result
   */
  detectFormat(json: JsonValue): FormatDetectionResult;
}