/**
 * Transforms module
 *
 * This module provides transformation functions for modifying XML/JSON data.
 */
// Re-export transform interfaces and utilities from core
export {
  Transform,
  TransformContext,
  TransformResult,
  TransformTarget,
  FORMAT,
  createTransformResult,
} from "../core/transform";

// Export transform classes and factory functions
export { 
  BooleanTransform,
  createBooleanTransform,
  BooleanTransformOptions 
} from "./boolean-transform";

export { 
  NumberTransform,
  createNumberTransform,
  NumberTransformOptions 
} from "./number-transform";

export { 
  RegexTransform,
  createRegexTransform,
  RegexOptions 
} from "./regex-transform";

export { 
  MetadataTransform,
  createMetadataTransform,
  MetadataTransformOptions,
  NodeSelector,
  FormatMetadata
} from "./metadata-transform";