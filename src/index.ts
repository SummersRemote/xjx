/**
 * XJX Library - XML/JSON transformation with fluent API and semantic XNode system
 */

// IMPORTANT: Register all extensions by importing their files
// These imports MUST be kept as they register methods on the XJX prototype
import "./extensions/source";
import "./extensions/output";
import "./extensions/config";
import "./extensions/functional-api";

// Export the main class (for instantiation)
export { XJX } from "./XJX";
export { default } from "./XJX";

// Export core interfaces and types
export {
  // Configuration
  Configuration,
  BaseConfiguration,
  XmlConfiguration,
  JsonConfiguration,
  ConfigurationHelper,
  getDefaultConfig,
  mergeConfig,
  createConfig,
  validateConfig
} from "./core/config";

export {
  // Semantic XNode model
  XNode,
  XNodeType,
  Primitive,
  createCollection,
  createRecord,
  createField,
  createValue,
  createAttributes,
  createComment,
  createInstruction,
  createData,
  addChild,
  addAttribute,
  cloneNode,
  getTextContent,
  setTextContent,
  getAttribute,
  getAttributeValue,
  hasAttributes,
  hasChildren,
  getNodeTypeName,
  isCollection,
  isRecord,
  isField,
  isValue,
  isAttribute,
  isComment,
  isInstruction,
  isData,
  isPrimitive,
  isContainer,
  getChildrenByType,
  getChildrenByName,
  getChild
} from "./core/xnode";

export {
  // Minimal transform system
  Transform,
  compose,
  createResultsContainer,
  collectNodesWithPaths,
  replaceNodeAtPath,
  removeNodeAtPath,
  getNodeAtPath,
  traverseTree,
  TreeVisitor,
  TraversalContext,
  TraversalOptions
} from "./core/functional";

// Export logging
export { 
  LoggerFactory, 
  LogLevel,
  Logger
} from "./core/logger";

// Export error handling
export {
  ValidationError,
  ProcessingError,
  XJXError,
  validate,
  handleError
} from "./core/error";

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

// Export semantic converters
export {
  xmlToXNodeConverter,
  xnodeToXmlConverter,
  xnodeToXmlStringConverter,
  jsonToXNodeConverter,
  xnodeToJsonConverter,
  xnodeToJsonHiFiConverter,
  validateJsonForSemantic,
  filterEmptyValues,
  getSemanticTypeForJsonValue
} from "./converters";

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

// Export DOM utilities
export {
  DOM,
  NodeType
} from "./core/dom";

// Export common utilities
export {
  deepClone,
  deepMerge,
  isEmpty,
  getPath,
  setPath
} from "./core/common";

// Manual registration verification - this function does nothing at runtime
// but ensures that tree-shaking doesn't remove our extension imports
function ensureExtensionsRegistered() {
  return [
    "./extensions/source",
    "./extensions/output",
    "./extensions/config-extensions",
    "./extensions/functional-api"
  ];
}

// This will be removed in production builds but helps ensure extensions are loaded
ensureExtensionsRegistered();