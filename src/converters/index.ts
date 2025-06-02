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

// ================================
// REMOVED: All hook wrapper functions (Phase 2 Complete)
// ================================
// These functions have been completely removed as hooks are integrated into pipeline execution:
// ❌ convertXmlWithHooks() -> Use Pipeline.executeSource(xmlToXNodeConverter, ...)
// ❌ convertJsonWithHooks() -> Use Pipeline.executeSource(jsonToXNodeConverter, ...)
// ❌ convertJsonHiFiWithHooks() -> Use Pipeline.executeSource(jsonHiFiToXNodeConverter, ...)
// ❌ convertXNodeToXmlWithHooks() -> Use Pipeline.executeOutput(xnodeToXmlConverter, ...)
// ❌ convertXNodeToXmlStringWithHooks() -> Use Pipeline.executeOutput(xnodeToXmlStringConverter, ...)
// ❌ convertXNodeToJsonWithHooks() -> Use Pipeline.executeOutput(xnodeToJsonConverter, ...)
// ❌ convertXNodeToJsonHiFiWithHooks() -> Use Pipeline.executeOutput(xnodeToJsonHiFiConverter, ...)

// ================================
// REMOVED: Transform system (Phase 2 Complete)
// ================================
// These functions/files have been completely removed as transform logic moved to unified traversal:
// ❌ transformXNodeWithHooks() -> Use traverseTree() in src/core/functional.ts
// ❌ transformXNode() -> Use functional API map() operation
// ❌ src/converters/xnode-transformer.ts -> ENTIRE FILE DELETED

// ================================
// REMOVED: Performance tracking (Phase 2 Complete)
// ================================
// All performance tracking calls have been removed from converters:
// ❌ context.performance.startStage(stage.name)
// ❌ context.performance.endStage(stageId)
// ❌ Performance metrics collection and reporting

// ================================
// MIGRATION GUIDE
// ================================
//
// OLD HOOK WRAPPER USAGE (REMOVED):
// ```typescript
// import { convertXmlWithHooks } from './converters';
// const result = convertXmlWithHooks(xml, config, hooks);
// ```
//
// NEW UNIFIED APPROACH:
// ```typescript
// // Option 1: Use extensions (recommended for most users)
// const result = xjx.fromXml(xml, hooks).toXnode();
//
// // Option 2: Use pipeline directly (for advanced users)
// const result = Pipeline.executeSource(xmlToXNodeConverter, xml, context, hooks);
// ```
//
// OLD TRANSFORM USAGE (REMOVED):
// ```typescript
// import { transformXNodeWithHooks } from './converters/xnode-transformer';
// const result = transformXNodeWithHooks(node, transform, hooks, config);
// ```
//
// NEW UNIFIED APPROACH:
// ```typescript
// // Use functional API (recommended)
// const result = xjx.fromXnode(node).map(transform, hooks).toXnode()[0];
// ```