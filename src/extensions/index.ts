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
export * from './functional/transform-extension';

// Functional extensions (core operations)
export * from './functional/functional-extensions';

// Axis navigation extensions
export * from './functional/axis-extensions';

// Utilities (for custom extensions)
export * from './functional/functional-utils';