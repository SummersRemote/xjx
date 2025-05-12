/**
 * Core interfaces for the XJX transformation system
 * Update this in src/core/types/transform-interfaces.ts
 */
import { Configuration } from './config-types';
import { NodeType } from './dom-types';
import { XNode } from '../models/xnode';

// Re-export Configuration and NodeType so they can be imported from this file
export { Configuration, NodeType };

// Also re-export XNode for backward compatibility
export { XNode };

/**
 * Format identifier type
 */
export type FormatId = string;

/**
 * Standard formats
 */
export const FORMATS = {
  XML: 'xml' as FormatId,
  JSON: 'json' as FormatId
};

/**
 * Transform target types enum - specifies which nodes a transformer can target
 */
export enum TransformTarget {
  Value = 'value',
  Attribute = 'attribute',
  Element = 'element',
  Text = 'text',
  CDATA = 'cdata',
  Comment = 'comment',
  ProcessingInstruction = 'processingInstruction',
  Namespace = 'namespace'
}

/**
 * Context for transformation operations
 */
export interface TransformContext {
  // Node information
  nodeName: string;
  nodeType: number;
  path: string;
  
  // Type-specific information
  isAttribute?: boolean;
  attributeName?: string;
  isText?: boolean;
  isCDATA?: boolean;
  isComment?: boolean;
  isProcessingInstruction?: boolean;
  
  // Namespace information
  namespace?: string;
  prefix?: string;
  
  // Hierarchical context
  parent?: TransformContext;
  
  // Configuration
  config: Configuration;
  
  // Target format
  targetFormat: FormatId;
}

/**
 * Result of a transformation operation
 */
export interface TransformResult<T> {
  // The transformed value
  value: T;
  
  // Whether the node/value should be removed
  remove: boolean;
}

/**
 * Unified Transform interface
 */
export interface Transform {
  // Target types this transformer can handle
  targets: TransformTarget[];
  
  // Transform method with context
  transform(value: any, context: TransformContext): TransformResult<any>;
}

/**
 * Helper function to create a transform result
 */
export function createTransformResult<T>(value: T, remove: boolean = false): TransformResult<T> {
  return { value, remove };
}