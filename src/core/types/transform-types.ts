/**
 * Transform Types for XJX Hybrid Transformation API
 */
import { Configuration } from './config-types';
import { NodeType } from './dom-types';

/**
 * Direction of transformation
 */
export enum TransformDirection {
  /**
   * XML to JSON transformation
   */
  XML_TO_JSON = 'xml-to-json',
  
  /**
   * JSON to XML transformation
   */
  JSON_TO_XML = 'json-to-xml'
}

/**
 * Context provided during transformations
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
 * Internal node representation for transformations
 */
export interface XNode {
  name: string;                       // Element name
  type: NodeType;                     // Element type (element, text, etc.)
  value?: any;                        // Node value
  attributes?: Record<string, any>;   // Attributes
  children?: XNode[];                 // Child nodes
  namespace?: string;                 // Namespace URI
  prefix?: string;                    // Namespace prefix
}

/**
 * Result of a transformation operation
 */
export interface TransformResult<T> {
  // The transformed value/node/etc.
  value: T;
  
  // Whether the value should be removed
  remove?: boolean;
}

/**
 * Value transformer interface for primitive values
 */
export interface ValueTransformer {
  /**
   * Transform a value
   * @param value The value to transform
   * @param node The node containing the value
   * @param context The transformation context
   * @returns Transform result with the transformed value
   */
  transform(value: any, node: XNode, context: TransformContext): TransformResult<any>;
}

/**
 * Attribute transformer interface
 */
export interface AttributeTransformer {
  /**
   * Transform an attribute name and value
   * @param name The attribute name
   * @param value The attribute value
   * @param node The node containing the attribute
   * @param context The transformation context
   * @returns Transform result with the transformed name and value
   */
  transform(name: string, value: any, node: XNode, context: TransformContext): TransformResult<[string, any]>;
}

/**
 * Children transformer interface
 */
export interface ChildrenTransformer {
  /**
   * Transform child nodes
   * @param children The array of child nodes
   * @param node The parent node
   * @param context The transformation context
   * @returns Transform result with the transformed children array
   */
  transform(children: XNode[], node: XNode, context: TransformContext): TransformResult<XNode[]>;
}

/**
 * Node transformer interface
 */
export interface NodeTransformer {
  /**
   * Transform a node
   * @param node The node to transform
   * @param context The transformation context
   * @returns Transform result with the transformed node
   */
  transform(node: XNode, context: TransformContext): TransformResult<XNode>;
}

/**
 * Helper function to create a transform result
 */
export function transformResult<T>(value: T, remove: boolean = false): TransformResult<T> {
  return { value, remove };
}