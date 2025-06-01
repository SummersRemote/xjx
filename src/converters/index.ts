/**
 * Converters module - Unified pipeline-based converters
 *
 * This module provides unified converter functions for transforming between XML, JSON, and XNode.
 * All converters now use the pipeline execution framework with integrated hook support.
 */

// Base converter and pipeline interfaces
export * from "../core/converter";
export * from "../core/pipeline";

// Unified XML converters
export {
  xmlToXNodeConverter,
} from "./xml-to-xnode-converter";

export {
  xnodeToXmlConverter,
  xnodeToXmlStringConverter,
} from "./xnode-to-xml-converter";

// Unified JSON converters
export {
  jsonToXNodeConverter,
} from "./json-std-to-xnode-converter";

export {
  xnodeToJsonConverter,
} from "./xnode-to-json-std-converter";

export {
  jsonHiFiToXNodeConverter,
} from "./json-hifi-to-xnode-converter";

export {
  xnodeToJsonHiFiConverter,
} from "./xnode-to-json-hifi-converter";

// DELETED: All hook wrapper functions removed
// These functions are no longer needed as hooks are integrated into pipeline execution:
// - convertXmlWithHooks() -> Use Pipeline.executeSource(xmlToXNodeConverter, ...)
// - convertJsonWithHooks() -> Use Pipeline.executeSource(jsonToXNodeConverter, ...)
// - convertJsonHiFiWithHooks() -> Use Pipeline.executeSource(jsonHiFiToXNodeConverter, ...)
// - convertXNodeToXmlWithHooks() -> Use Pipeline.executeOutput(xnodeToXmlConverter, ...)
// - convertXNodeToXmlStringWithHooks() -> Use Pipeline.executeOutput(xnodeToXmlStringConverter, ...)
// - convertXNodeToJsonWithHooks() -> Use Pipeline.executeOutput(xnodeToJsonConverter, ...)
// - convertXNodeToJsonHiFiWithHooks() -> Use Pipeline.executeOutput(xnodeToJsonHiFiConverter, ...)

// NOTE: transformXNodeWithHooks and transformXNode will be addressed in Stage 5 (Functional API Integration)