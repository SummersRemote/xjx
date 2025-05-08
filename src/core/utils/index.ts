/**
 * Core utilities - Static utility functions for the XJX library
 * 
 * This module provides all the static utility functions used throughout the library.
 * Each utility class focuses on a specific domain.
 */

// Common utility functions
export { CommonUtils } from './common-utils';

// Error handling utilities
export { ErrorUtils, ErrorType } from './error-utils';

// DOM operations
export { DomUtils } from './dom-utils';

// XML-specific utilities
export { XmlUtils, ValidationResult } from './xml-utils';
export { EntityUtils } from './entity-utils';
export { NamespaceUtils } from './namespace-utils';

// JSON operations
export { JsonUtils } from './json-utils';