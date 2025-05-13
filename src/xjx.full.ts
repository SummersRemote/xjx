/**
 * XJX Full Bundle
 * 
 * Comprehensive bundle that includes the core library plus all extensions and addons.
 * This is the "batteries included" version of XJX.
 */

// Export all core functionality
export * from './index';

// Export additional utilities
export * from './core/common';
export * from './core/error';
export * from './core/dom';
export * from './core/config';
export * from './core/transform';
export * from './core/extension';
export * from './core/json';
export * from './core/xnode';
export * from './core/xml';

// Export all models
export * from './core/xnode';

// Export all converters
export * from './converters';

// Export all transforms
export * from './transforms';

// Ensure all extensions are registered
import './extensions';

// Note: Any additional extensions should be added here