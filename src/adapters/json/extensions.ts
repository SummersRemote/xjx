/**
 * JSON adapter extensions registration
 */
import { XJX } from "../../XJX";
import { fromJson } from "./source";
import { toJson, toJsonString, toJsonHiFi } from "./output";
import { DEFAULT_JSON_SOURCE_CONFIG, DEFAULT_JSON_OUTPUT_CONFIG } from "./config";

// Register JSON source extensions with source configuration
XJX.registerNonTerminalExtension("fromJson", fromJson, {
  json: {
    source: DEFAULT_JSON_SOURCE_CONFIG
  }
});

// Register JSON output extensions with output configuration
XJX.registerTerminalExtension("toJson", toJson, {
  json: {
    output: DEFAULT_JSON_OUTPUT_CONFIG
  }
});

XJX.registerTerminalExtension("toJsonString", toJsonString, {
  json: {
    output: DEFAULT_JSON_OUTPUT_CONFIG
  }
});

XJX.registerTerminalExtension("toJsonHiFi", toJsonHiFi, {
  json: {
    output: DEFAULT_JSON_OUTPUT_CONFIG
  }
});