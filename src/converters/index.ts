/**
 * Converters module - Updated for minimal transform system
 *
 * This module provides converter functions for transforming between XML, JSON, and XNode.
 */

// Base converter interface
export * from "../core/converter";

// XML converters
export {
  xmlToXNodeConverter,
  convertXmlWithHooks,
} from "./xml-to-xnode-converter";

export {
  xnodeToXmlConverter,
  xnodeToXmlStringConverter,
  convertXNodeToXmlWithHooks,
  convertXNodeToXmlStringWithHooks,
} from "./xnode-to-xml-converter";

// JSON converters - unified implementation with hooks
export {
  jsonToXNodeConverter,
  convertJsonWithHooks,
} from "./json-std-to-xnode-converter";
export {
  xnodeToJsonConverter,
  convertXNodeToJsonWithHooks,
} from "./xnode-to-json-std-converter";
export {
  jsonHiFiToXNodeConverter,
  convertJsonHiFiWithHooks,
} from "./json-hifi-to-xnode-converter";
export {
  xnodeToJsonHiFiConverter,
  convertXNodeToJsonHiFiWithHooks,
} from "./xnode-to-json-hifi-converter";

// Node transformer - updated for minimal transform system
export {
  transformXNodeWithHooks,
  transformXNode, // Legacy wrapper
} from "./xnode-transformer";