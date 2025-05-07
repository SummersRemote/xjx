/**
 * XJX Full Bundle
 * 
 * Exports core functionality plus all extensions
 */

// Export core components
export * from './index';

// Ensure all core extensions are registered
import './extensions/core';

// Register additional extensions
import './extensions/GetPathExtension';
import './extensions/GetJsonSchemaExtension';

// This file creates the "full" bundle with core functionality, converters, and all extensions