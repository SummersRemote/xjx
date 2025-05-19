/**
 * Transforms module
 *
 * This module provides the transformers for converting between data types
 * and modifying XML/JSON data during transformation.
 */

// Re-export transform interfaces and base class from core
export {
  BaseTransform,
  Transform,
  TransformContext,
  TransformResult,
  TransformTarget,
  FORMAT,
  createTransformResult,
} from "../core/transform";

// Core transformers for data type conversion
export { BooleanTransform, BooleanTransformOptions } from "./boolean-transform";
export { NumberTransform, NumberTransformOptions } from "./number-transform";
export { RegexTransform, RegexOptions } from "./regex-transform";
export { MetadataTransform, MetadataTransformOptions } from "./metadata-transform";

// Add other transforms as they're implemented:
