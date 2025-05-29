/**
 * Node Transforms module - Node transformer factories for use with map()
 *
 * This module provides node transformer factories that work directly with the map() function.
 * All transforms are node transformers that take an XNode and return a transformed XNode.
 */

// Core transform types and utilities
export {
  Transform,
  TransformOptions,
  TransformIntent,
  compose,
  createTransform
} from '../core/transform';

// Number node transform
export {
  toNumber,
  NumberTransformOptions
} from './number-transform';

// Boolean node transform
export {
  toBoolean,
  BooleanTransformOptions
} from './boolean-transform';

// Regex node transform
export {
  regex,
  RegexTransformOptions
} from './regex-transform';

/**
 * Quick reference for the node transform system:
 * 
 * All transforms work directly with map() and transform XNode objects:
 * 
 * ```typescript
 * // Transform all boolean-like values
 * xjx.fromXml(xml)
 *    .map(toBoolean())
 *    .toJson();
 * 
 * // Transform only specific nodes
 * xjx.fromXml(xml)
 *    .map(toNumber({ nodeNames: ['price', 'total'] }))
 *    .toJson();
 * 
 * // Chain multiple transforms
 * xjx.fromXml(xml)
 *    .map(toBoolean({ nodeNames: ['active', 'enabled'] }))
 *    .map(toNumber({ nodeNames: ['price', 'count'] }))
 *    .map(regex(/\s+/g, ' '))  // Clean up whitespace
 *    .toJson();
 * 
 * // Create reusable configured transforms
 * const cleanPhoneNumbers = regex(/[^\d]/g, '');
 * const parseBoolean = toBoolean({ 
 *   trueValues: ['yes', '1', 'true'], 
 *   falseValues: ['no', '0', 'false'] 
 * });
 * const parseCurrency = toNumber({ 
 *   precision: 2,
 *   nodeNames: ['price', 'total', 'tax'] 
 * });
 * 
 * xjx.fromXml(xml)
 *    .map(cleanPhoneNumbers)
 *    .map(parseBoolean)
 *    .map(parseCurrency)
 *    .toJson();
 * ```
 * 
 * Key differences from legacy transforms:
 * - Work directly with map(), no wrapper needed
 * - Transform entire nodes, not just values
 * - Support node filtering (nodeNames, skipNodes)
 * - Preserve non-matching nodes unchanged
 * - Composable and chainable
 */