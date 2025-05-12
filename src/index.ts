/**
 * XJX Library - XML/JSON transformation with fluent API
 * 
 * Main entry point and exports for the library
 */

// =====================================================================================
// Core functionality
// =====================================================================================

// Main entry point - only export the main XJX class for the public API
export { XJX } from './XJX';

// =====================================================================================
// Type definitions - only export what's needed by consumers
// =====================================================================================

// Configuration types
export { Configuration } from './core/types/config-types';

// Core interfaces and types needed by consumers
export {
  // Transform interfaces for extension authors
  Transform,
  TransformTarget,
  TransformContext,
  TransformResult,
  FormatId,
  createTransformResult,
} from './core/types/transform-interfaces';

// Error types
export { 
  XJXError, 
  XmlToJsonError, 
  JsonToXmlError, 
  EnvironmentError, 
  ConfigurationError 
} from './core/types/error-types';

// Key model classes
export { XNode } from './core/models/xnode';

// =====================================================================================
// Core transformers - only essential ones for common use cases
// =====================================================================================

export { BooleanTransform, BooleanTransformOptions } from './transforms/boolean-transform';
export { NumberTransform, NumberTransformOptions } from './transforms/number-transform';
export { RegexTransform, RegexOptions } from './transforms/regex-transform';

// =====================================================================================
// Register extensions to ensure all methods are available on XJX
// =====================================================================================

// This import ensures all extension methods are registered with XJX
import './extensions';