/**
 * XJX Core Module - Updated for simplified utilities
 * 
 * This module exports all core functionality for the XJX library.
 */

// Common utilities
export * from './common';

// Error handling
export * from './error';

// Logging 
export * from './logger';

// DOM operations
export * from './dom';

// Configuration
export * from './config';

// Converter system
export * from './converter';

// Hooks system
export * from './hooks';

// Pipeline system
export * from './pipeline';
export * from './context';

// Extension system
export * from './extension';

// Unified tree traversal and transforms
export * from './functional';

// Simplified utilities (unused functions removed)
export {
  // JSON utilities - only used functions
  isEmptyElement,
  removeEmptyElements
} from './json-utils';

export {
  // XML utilities - unused functions removed
  parseXml,
  serializeXml,
  formatXml,
  ensureXmlDeclaration,
  escapeXml,
  safeXmlText,
  normalizeWhitespace,
  createQualifiedName,
  addNamespaceDeclarations
} from './xml-utils';

// XNode model
export * from './xnode';