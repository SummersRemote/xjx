/**
 * Utils module - exports all utility classes and functions
 * 
 * This barrel file centralizes all utility-related exports for easier imports
 * and better tree-shaking capabilities.
 */

// XML utilities
export { XmlUtil, ValidationResult } from './xml-utils';
export { XmlEntityHandler } from './xml-entity-handler';
export { NamespaceUtil } from './namespace-util';

// JSON utilities
export { JsonUtil } from './json-utils';

// Transform utilities
export { TransformUtils } from './transform-utils';