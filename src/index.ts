/**
 * XJX Library - XML/JSON transformation with fluent API
 * 
 * Main entry point and exports for the library
 */

// =====================================================================================
// Core functionality
// =====================================================================================

// Main XJX class with fluent API
export { XJX } from './core/XJX';

// Configuration
export { DEFAULT_CONFIG } from './core/config/config';
export { ConfigProvider } from './core/config/config-provider';

// =====================================================================================
// Type definitions
// =====================================================================================

// Core interfaces and types
export {
  // Transform related types
  Transform,
  TransformTarget,
  TransformContext,
  TransformResult,
  TransformDirection,
  XNode as XNode,
  createTransformResult as transformResult,
  
  // Configuration types
  Configuration
} from './core/types/transform-interfaces';

// JSON types
export { 
  JSONPrimitive, 
  JSONArray, 
  JSONObject, 
  JSONValue, 
  XMLJSONNode, 
  XMLJSONElement 
} from './core/types/json-types';

// DOM types
export { NodeType } from './core/types/dom-types';

// Error types
export { 
  XJXError, 
  XmlToJsonError, 
  JsonToXmlError, 
  EnvironmentError, 
  ConfigurationError 
} from './core/types/error-types';

// Extension types
export {
  XJXContext,
  TerminalExtensionContext,
  NonTerminalExtensionContext
} from './core/types/extension-types';

// =====================================================================================
// Converters
// =====================================================================================

// Converter interfaces
export {
  Converter,
  XmlToXNodeConverter,
  JsonToXNodeConverter,
  XNodeToXmlConverter,
  XNodeToJsonConverter,
  XNodeTransformer
} from './core/converters/converter-interfaces';

// Default converter implementations
export { DefaultXmlToXNodeConverter } from './core/converters/xml-to-xnode-converter';
export { DefaultJsonToXNodeConverter } from './core/converters/json-to-xnode-converter';
export { DefaultXNodeToXmlConverter } from './core/converters/xnode-to-xml-converter';
export { DefaultXNodeToJsonConverter } from './core/converters/xnode-to-json-converter';
export { DefaultXNodeTransformer } from './core/converters/xnode-transformer';

// =====================================================================================
// Utilities
// =====================================================================================

// XML utilities
export { XmlUtil, ValidationResult } from './core/utils/xml-utils';
export { XmlEntityHandler } from './core/utils/xml-entity-handler';
export { NamespaceUtil } from './core/utils/namespace-util';

// JSON utilities
export { JsonUtil } from './core/utils/json-utils';

// Transform utilities
export { TransformUtils } from './core/utils/transform-utils';

// DOM adapter
export { DOMAdapter } from './core/adapters/dom-adapter';

// =====================================================================================
// Core Transformers
// =====================================================================================

// Export only essential transformers - others are in addons
export { BooleanTransform, BooleanTransformOptions } from './core/transforms/boolean-transform';
export { NumberTransform, NumberTransformOptions } from './core/transforms/number-transform';
export { RegexTransform, RegexOptions } from './core/transforms/regex-transform';

// =====================================================================================
// Register core extensions
// =====================================================================================

// This ensures all extension methods are available on XJX and XjxBuilder
import './core/commands';