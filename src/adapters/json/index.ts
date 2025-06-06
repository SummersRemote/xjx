/**
 * JSON adapter - Complete JSON support for XJX
 */

// IMPORTANT: Register extensions by importing the extensions file
import "./extensions";

// Export separated configurations
export {
  JsonSourceConfiguration,
  JsonOutputConfiguration,
  DEFAULT_JSON_SOURCE_CONFIG,
  DEFAULT_JSON_OUTPUT_CONFIG
} from "./config";

// Export utilities
export {
  JsonValue,
  JsonObject,
  JsonArray,
  isEmptyElement,
  removeEmptyElements,
  isHighFidelityJson,
  isSemanticMetadata,
  getContentProperties,
  getSemanticMetadata,
  hasSemanticValue,
  getSemanticValue,
  hasSemanticChildren,
  getSemanticChildren,
  detectSemanticFormat,
  normalizeSemanticObject,
  getJsonArrayItemName
} from "./utils";

// Export converters
export {
  jsonToXNodeConverter,
  jsonHiFiToXNodeConverter,
  getSemanticTypeForJsonValue
} from "./source";

export {
  xnodeToJsonConverter,
  xnodeToJsonHiFiConverter
} from "./output";

// Export extension functions (for direct use if needed)
export { fromJson } from "./source";
export { toJson, toJsonString, toJsonHiFi } from "./output";