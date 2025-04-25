/**
 * XJX Library - Main entry point
 */
import { XJX } from "./XJX";
import { XMLToJSON } from "./core/XmlToJsonConverter";
import { JSONToXML } from "./core/JsonToXmlConverter";
import { DOMAdapter } from "./core/DOMAdapter";
import { Configuration } from "./core/types/types";
import { DEFAULT_CONFIG } from "./core/config/config";
import { JSONUtil } from "./core/utils/JsonUtils";
import { XMLUtil } from "./core/utils/XmlUtils";

// Import transformers
import { ValueTransformer } from "./core/transforms/ValueTransformer";
import { BooleanTransformer } from "./core/transforms/BooleanTransformer";
import { NumberTransformer } from "./core/transforms/NumberTransformer";
import { StringReplaceTransformer } from "./core/transforms/StringReplaceTransformer";

import * as errors from "./core/types/Errors";

// Re-export all classes and types (minimal approach)
export {
  XJX,
  XMLToJSON,
  JSONToXML,
  DOMAdapter,
  Configuration,
  DEFAULT_CONFIG,
  JSONUtil,
  XMLUtil,
  errors,
  // Export only ValueTransformer and concrete transformers
  ValueTransformer,
  BooleanTransformer,
  NumberTransformer,
  StringReplaceTransformer
};

// Default export for easier importing
export default XJX;