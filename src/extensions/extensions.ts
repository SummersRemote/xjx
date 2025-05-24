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

// Functional extensions (including transform)
export * from './functional-extensions';