/**
 * XJX Full Bundle
 * 
 * Comprehensive bundle that includes the core library plus all extensions and addons.
 * This is the "batteries included" version of XJX.
 */

// Export all core functionality
export * from './index';

// Export additional core modules not covered by the main index
export * from './core/common';
export * from './core/dom';
export * from './core/json';
export * from './core/xml-utils';

// Export all converters
export * from './converters';

// Export all transforms
export * from './transforms';

// Ensure all extensions are registered
import './extensions';

// Note: Any additional extensions should be added here