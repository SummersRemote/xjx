/**
 * Core utilities - Static utility functions for the XJX library
 * 
 * This module provides all the static utility functions used throughout the library.
 * Each utility class focuses on a specific domain.
 */

// Common utility functions
export { Common } from './common-utils';

// Error handling utilities
export { ErrorHandler, ErrorType } from './error-utils';

// DOM operations
export { DOM } from './dom-utils';

// XML-specific utilities
export { XmlUtils } from './xml-utils';
export { XmlEntity } from './entity-utils';
export { XmlNamespace } from './namespace-utils';

// JSON operations
export { JSON } from './json-utils';