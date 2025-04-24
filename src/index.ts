/**
 * XJX Library - Main entry point
 */
import { XJX } from "./XJX";
import { XMLToJSON } from "./core/XMLToJSON";
import { JSONToXML } from "./core/JSONToXML";
import { DOMAdapter } from "./core/DOMAdapter";
import { XMLToJSONConfig } from "./core/types/types";
import { DEFAULT_CONFIG } from "./core/config/config";
import { JSONUtil } from "./core/utils/JSONUtil";
import { XMLUtil } from "./core/utils/XMLUtil";

import * as errors from "./core/types/errors";

// Re-export all classes and types
export {
  XJX,
  XMLToJSON,
  JSONToXML,
  DOMAdapter,
  XMLToJSONConfig,
  DEFAULT_CONFIG,
  JSONUtil,
  XMLUtil,
  errors,
};

// Default export for easier importing
export default XJX;