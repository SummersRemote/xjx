/**
 * Value transformation types and base class for the XJX library
 */
import { Configuration } from '../types/types';

/**
 * Direction of the transformation
 */
export type TransformDirection = 'xml-to-json' | 'json-to-xml';

/**
 * Context provided to value transformers
 */
export interface TransformContext {
  // Core transformation info
  direction: TransformDirection;  // Direction of the current transformation
  
  // Node information
  nodeName: string;              // Name of the current node
  nodeType: number;              // DOM node type (element, text, etc.)
  namespace?: string;            // Namespace URI if available
  prefix?: string;               // Namespace prefix if available
  
  // Structure information
  path: string;                  // Dot-notation path to current node
  isAttribute: boolean;          // Whether the current value is from an attribute
  attributeName?: string;        // Name of attribute if isAttribute is true
  
  // Parent context (creates a chain)
  parent?: TransformContext;     // Reference to parent context for traversal
  
  // Configuration reference
  config: Configuration;         // Reference to the current configuration
}

/**
 * Abstract base class for value transformers
 */
export abstract class ValueTransformer {
  /**
   * Process a value, transforming it if applicable
   * @param value Value to potentially transform
   * @param context Context including direction and other information
   * @returns Transformed value or original if not applicable
   */
  process(value: any, context: TransformContext): any {
    if (context.direction === 'xml-to-json') {
      return this.xmlToJson(value, context);
    } else {
      return this.jsonToXml(value, context);
    }
  }

  /**
   * Transform a value from XML to JSON representation
   * @param value Value from XML
   * @param context Transformation context
   * @returns Transformed value for JSON
   */
  protected xmlToJson(value: any, context: TransformContext): any {
    // Default implementation returns original value
    return value;
  }

  /**
   * Transform a value from JSON to XML representation
   * @param value Value from JSON
   * @param context Transformation context
   * @returns Transformed value for XML
   */
  protected jsonToXml(value: any, context: TransformContext): any {
    // Default implementation returns original value
    return value;
  }
}