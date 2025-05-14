/**
 * XJX Library - XML/JSON transformation with fluent API
 *
 * Main entry point and exports for the library
 */

// =====================================================================================
// Core functionality
// =====================================================================================

// Main entry point
export { XJX } from "./XJX";
export default XJX;

// =====================================================================================
// Type definitions - only export what's needed by consumers
// =====================================================================================

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

// =====================================================================================
// Core transformers - only essential ones for common use cases
// =====================================================================================

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

// =====================================================================================
// Auto-load core extensions
// =====================================================================================

// Import the extension registry to auto-load all core extensions
// Note: This automatically loads all core extensions - no explicit initialization needed
import "./extensions";