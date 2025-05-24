/**
 * Transforms module - Consolidated exports
 *
 * This module provides transformation functions for modifying XML/JSON data
 * using the simplified mode-aware transform system.
 */

// Re-export transform interfaces and utilities from core (now consolidated)
export {
  Transform,
  TransformContext,
  TransformResult,
  TransformTarget,
  TransformOptions,
  ProcessingIntent,
  FORMAT,
  createTransformResult,
  getDefaultMode,
  shouldParse,
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
  RegexTransformOptions 
} from "./regex-transform";

// Keep existing MetadataTransform (unchanged)
export { 
  MetadataTransform,
  createMetadataTransform,
  MetadataTransformOptions,
  NodeSelector,
  FormatMetadata
} from "./metadata-transform";

/**
 * Quick reference for the consolidated transform system:
 * 
 * ProcessingIntent.PARSE (default):
 * - Converts strings to typed values
 * - Perfect for functional operations (filter, map, etc.)
 * - Examples: "123" → 123, "true" → true
 * 
 * ProcessingIntent.SERIALIZE:
 * - Converts typed values to strings
 * - Used for final formatting/output
 * - Examples: 123 → "123", true → "true"
 * 
 * Usage patterns:
 * ```typescript
 * // Default PARSE mode - perfect for functional pipelines
 * new NumberTransform()
 * 
 * // Explicit SERIALIZE mode when needed
 * new NumberTransform({ mode: ProcessingIntent.SERIALIZE })
 * 
 * // Combined with other options
 * new NumberTransform({ 
 *   mode: ProcessingIntent.PARSE,
 *   precision: 2 
 * })
 * ```
 */