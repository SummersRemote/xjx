/**
 * Extensions module
 * 
 * This module exports all extension implementations for the XJX library.
 */

// Source extensions
export * from './from-xml';
export * from './from-json';
export * from './from-xnode';

// Output extensions
export * from './to-xml';
export * from './to-json';
export * from './to-xnode';

// Configuration extensions
export * from './config-extensions';

// Transform extension
export * from './transform-extension';

// Functional extensions (core operations)
export * from './functional-extensions';

// Axis navigation extensions (downward traversal and root navigation)
export * from './axis-extensions';

// Utilities (for custom extensions)
export * from './functional-utils';