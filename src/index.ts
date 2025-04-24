/**
 * XMLToJSON Library - Main entry point
 */
import { XMLToJSON } from "./XMLToJSON";
import { XMLParser } from "./XMLParser";
import { XMLSerializerUtil } from "./XMLSerializer";
import { DOMEnvironment } from "./DOMAdapter";
import { XMLToJSONConfig } from "./types";
import { DEFAULT_CONFIG } from "./config";
import { JSONUtil } from "./JSONUtil";

import * as helpers from "./helpers";
import * as errors from "./errors";

// Re-export all classes and types
export {
  XMLToJSON,
  XMLParser,
  XMLSerializerUtil,
  DOMEnvironment,
  XMLToJSONConfig,
  DEFAULT_CONFIG,
  JSONUtil,
  helpers,
  errors,
};

export default XMLToJSON;
