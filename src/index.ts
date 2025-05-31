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
import "./extensions/root-extensions";
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
  LogLevel } from "./core/logger";

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
} from "./core/extension";

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

// Manual registration verification - this function does nothing at runtime
// but ensures that tree-shaking doesn't remove our extension imports
function ensureExtensionsRegistered() {
  // The mere existence of this function with references prevents tree-shaking
  return [
    "./extensions/from-xml",
    "./extensions/from-json",
    "./extensions/to-xml",
    "./extensions/to-json",
    "./extensions/config-extensions",
    "./extensions/to-xnode",
    "./extensions/from-xnode",
    "./extensions/functional-api",
    "./extensions/root-extensions",
  ];
}

// This will be removed in production builds but helps ensure extensions are loaded
ensureExtensionsRegistered();