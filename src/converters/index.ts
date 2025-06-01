/**
 * Converters module - Unified pipeline-based converters
 * STAGE 5: All legacy transformer references REMOVED
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

// ================================
// DELETED: All hook wrapper functions removed (Stage 2)
// ================================
// These functions are no longer needed as hooks are integrated into pipeline execution:
// - convertXmlWithHooks() -> Use Pipeline.executeSource(xmlToXNodeConverter, ...)
// - convertJsonWithHooks() -> Use Pipeline.executeSource(jsonToXNodeConverter, ...)
// - convertJsonHiFiWithHooks() -> Use Pipeline.executeSource(jsonHiFiToXNodeConverter, ...)
// - convertXNodeToXmlWithHooks() -> Use Pipeline.executeOutput(xnodeToXmlConverter, ...)
// - convertXNodeToXmlStringWithHooks() -> Use Pipeline.executeOutput(xnodeToXmlStringConverter, ...)
// - convertXNodeToJsonWithHooks() -> Use Pipeline.executeOutput(xnodeToJsonConverter, ...)
// - convertXNodeToJsonHiFiWithHooks() -> Use Pipeline.executeOutput(xnodeToJsonHiFiConverter, ...)

// ================================
// DELETED: Transform system removed (Stage 5)
// ================================
// These functions/files are no longer needed as transform logic moved to unified traversal:
// - transformXNodeWithHooks() -> Use traverseTree() in src/core/functional.ts
// - transformXNode() -> Use functional API map() operation
// - src/converters/xnode-transformer.ts -> ENTIRE FILE DELETED

// ================================
// MIGRATION GUIDE
// ================================
//
// OLD TRANSFORM USAGE (DELETED):
// ```typescript
// import { transformXNodeWithHooks } from './converters/xnode-transformer';
// const result = transformXNodeWithHooks(node, transform, hooks, config);
// ```
//
// NEW UNIFIED APPROACH:
// ```typescript
// // Option 1: Use functional API (recommended)
// const result = xjx.fromXnode(node).map(transform, hooks).toXnode()[0];
//
// // Option 2: Use pipeline directly
// const mapStage: PipelineStage<XNode, XNode> = {
//   name: 'transform',
//   execute: (node, context) => {
//     const visitor: TreeVisitor<XNode> = {
//       visit: (node, ctx) => transform(node),
//       combineResults: (parent, children) => ({ ...parent, children })
//     };
//     return traverseTree(node, visitor, { order: 'both', hooks, context });
//   }
// };
// const result = Pipeline.executeTransform(mapStage, node, context, hooks);
// ```