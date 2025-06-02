/**
 * XJX Library - XML/JSON transformation with fluent API and minimal transform system
 */

// IMPORTANT: Register all extensions by importing their files
// These imports MUST be kept as they register methods on the XJX prototype
import "./extensions/from-xml";
import "./extensions/from-json";
import "./extensions/to-xml";
import "./extensions/to-json";
import "./extensions/config-extensions";
import "./extensions/to-xnode";
import "./extensions/from-xnode";
import "./extensions/functional-api";

// Export the main class (for instantiation)
export { XJX } from "./XJX";
export { default } from "./XJX";

// Export core interfaces and types
export {
  // Configuration
  Configuration,
} from "./core/config";

export {
  // Minimal transform system
  Transform,
  compose,
} from "./core/functional";

// Export logging
export { 
  LoggerFactory, 
  LogLevel 
} from "./core/logger";

// Export error handling
export {
  ValidationError,
  ProcessingError,
  XJXError,
  validate,
} from "./core/error";

// Export model interfaces
export { XNode } from "./core/xnode";

// Export extension context interfaces
export {
  TerminalExtensionContext,
  NonTerminalExtensionContext,
  BranchContext,
  UnifiedExtensionContext
} from "./core/extension";

// Export pipeline system
export {
  PipelineStage,
  UnifiedConverter,
  Pipeline
} from "./core/pipeline";

export {
  PipelineContext,
  PipelineContextImpl,
  ConfigurationManager,
  ResourceManager,
  ClonePolicy,
  ClonePolicies
} from "./core/context";

// Export converter types and hook interfaces
export {
  Converter,
  JsonValue,
  JsonObject,
  JsonArray,
  applySourceHooks,
  applyOutputHooks,
  applyNodeHooks,
} from "./core/converter";

// Hooks system
export {
  SourceHooks,
  OutputHooks,
  NodeHooks,
  PipelineHooks
} from './core/hooks';

// Export transform functions and creators
export {
  // Transform Factories
  toNumber,
  toBoolean,
  regex,

  // Options interfaces
  NumberTransformOptions,
  BooleanTransformOptions,
} from "./transforms";

// Export simplified utilities (removed unused functions)
export {
  // Only the used JSON utilities
  isEmptyElement,
  removeEmptyElements
} from "./core/json-utils";

export {
  // Only the used XML utilities  
  parseXml,
  serializeXml,
  formatXml,
  ensureXmlDeclaration,
  escapeXml,
  safeXmlText,
  normalizeWhitespace,
  createQualifiedName,
  addNamespaceDeclarations
} from "./core/xml-utils";

// Manual registration verification - this function does nothing at runtime
// but ensures that tree-shaking doesn't remove our extension imports
function ensureExtensionsRegistered() {
  return [
    "./extensions/from-xml",
    "./extensions/from-json",
    "./extensions/to-xml",
    "./extensions/to-json",
    "./extensions/config-extensions",
    "./extensions/to-xnode",
    "./extensions/from-xnode",
    "./extensions/functional-api",
  ];
}

// This will be removed in production builds but helps ensure extensions are loaded
ensureExtensionsRegistered();