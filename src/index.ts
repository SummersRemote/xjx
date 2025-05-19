/**
 * XJX Library - XML/JSON transformation with fluent API
 */

// Register all extensions to the XJX class
import './extensions/from-xml';
// Additional extension imports would be here

// Export the main class (for instantiation)
export { XJX } from './XJX';
export { default } from './XJX';

// Export configuration types
export { Configuration } from './core/config';

// Export core interfaces and types
export {
  Format,
  Transform,
  TransformTarget,
  TransformContext,
  TransformResult,
  createTransformResult,
} from './core/transform';

// Export error handling
export {
  ValidationError,
  ProcessingError,
  XJXError,
  validate,
  logger,
  LogLevel,
} from './core/error';

// Export model interfaces
export { XNode } from './core/xnode';

// Export transform creators
export { createBooleanTransform, BooleanTransformOptions } from './transforms/boolean-transform';
// Additional transform exports would be here