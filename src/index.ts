/**
 * XJX Library - XML/JSON transformation with fluent API
 */

// Register all extensions to the XJX class
import './extensions/from-xml';
import './extensions/from-json';
import './extensions/to-xml';
import './extensions/to-json';
import './extensions/config-extensions';
import './extensions/with-transforms';

// Export the main class (for instantiation)
export { XJX } from './XJX';
export { default } from './XJX';

// Export core interfaces and types
export {
  // Configuration
  Configuration,
} from './core/config';

export {
  // Transform system
  FORMAT,
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
export {
  createBooleanTransform,
  createNumberTransform,
  createRegexTransform,
  createMetadataTransform,
  BooleanTransformOptions,
  NumberTransformOptions,
  RegexOptions,
  MetadataTransformOptions,
} from './transforms';