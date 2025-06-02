/**
 * Converters module - Simplified unified pipeline-based converters
 * Phase 2: All legacy hook wrappers and transform references REMOVED
 *
 * This module provides simplified converter functions for transforming between XML, JSON, and XNode.
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
} from "./json-to-xnode-converter";

export {
  xnodeToJsonConverter,
} from "./xnode-to-json-converter";

export {
  jsonHiFiToXNodeConverter,
} from "./json-to-xnode-converter";

export {
  xnodeToJsonHiFiConverter,
} from "./xnode-to-json-converter";
