/**
 * XJX Library - XML/JSON transformation with fluent API
 * Self-registering extensions for webpack compatibility
 */

// Pre-register all extensions to prevent tree-shaking issues
// IMPORTANT: This import has side effects!
import './extensions';

// Export the main class (for instantiation)
export { XJX } from './XJX.js';

// Export configuration types
export { Configuration } from './core/config.js';

// Export core interfaces and types
export {
  Transform,
  TransformTarget,
  TransformContext,
  TransformResult,
  FormatId,
  FORMATS,
  createTransformResult,
} from './core/transform.js';

// Export error handling
export {
  ValidationError,
  ParseError,
  SerializeError,
  ConfigurationError,
  TransformError,
  EnvironmentError,
  validate,
  logger,
  LogLevel,
} from './core/error.js';

// Export model classes
export { XNode } from './core/xnode.js';

// Export core transformers
export {
  BooleanTransform,
  BooleanTransformOptions,
} from './transforms/boolean-transform.js';
export {
  NumberTransform,
  NumberTransformOptions,
} from './transforms/number-transform.js';
export { 
  RegexTransform, 
  RegexOptions 
} from './transforms/regex-transform.js';
export {
  MetadataTransform,
  MetadataTransformOptions,
} from './transforms/metadata-transform.js';