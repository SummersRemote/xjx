/**
 * Converters module - Unified pipeline-based converters for semantic XNode
 * Phase 2: All legacy hook wrappers and transform references REMOVED
 *
 * This module provides converter functions for transforming between XML, JSON, and semantic XNode.
 * All converters use the pipeline execution framework with integrated hook support.
 */

// Base converter and pipeline interfaces
export * from "../core/converter";
export * from "../core/pipeline";

// Semantic XML converters
export {
  xmlToXNodeConverter,
} from "./xml-to-xnode-converter";

export {
  xnodeToXmlConverter,
  xnodeToXmlStringConverter,
} from "./xnode-to-xml-converter";

// Semantic JSON converters
export {
  jsonToXNodeConverter,
  validateJsonForSemantic,
  filterEmptyValues,
  getSemanticTypeForJsonValue
} from "./json-to-xnode-converter";

export {
  xnodeToJsonConverter,
  xnodeToJsonHiFiConverter,
} from "./xnode-to-json-converter";