/**
 * XJX Library - XML/JSON transformation with fluent API
 *
 * Main entry point and exports for the library
 */

// Import extensions to ensure they're registered
import './extensions';

// Main entry point
export { XJX } from "./XJX";

// Configuration types
export { Configuration } from "./core/config";

// Core interfaces and types needed by consumers
export {
  // Transform interfaces for extension authors
  Transform,
  TransformTarget,
  TransformContext,
  TransformResult,
  FormatId,
  FORMATS,
  createTransformResult,
} from "./core/transform";

// Error handling
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
} from "./core/error";

// Key model classes
export { XNode } from "./core/xnode";

// Core transformers - only essential ones for common use cases
export {
  BooleanTransform,
  BooleanTransformOptions,
} from "./transforms/boolean-transform";
export {
  NumberTransform,
  NumberTransformOptions,
} from "./transforms/number-transform";
export { RegexTransform, RegexOptions } from "./transforms/regex-transform";
export {
  MetadataTransform,
  MetadataTransformOptions,
} from "./transforms/metadata-transform";