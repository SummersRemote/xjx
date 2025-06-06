/**
 * JSON adapter extensions registration
 */
import { XJX } from "../../XJX";
import { fromJson } from "./source";
import { toJson, toJsonString, toJsonHiFi } from "./output";
import { DEFAULT_JSON_CONFIG } from "./config";

// Register JSON source extensions
XJX.registerNonTerminalExtension("fromJson", fromJson, {
  json: DEFAULT_JSON_CONFIG
});

// Register JSON output extensions
XJX.registerTerminalExtension("toJson", toJson);
XJX.registerTerminalExtension("toJsonString", toJsonString);
XJX.registerTerminalExtension("toJsonHiFi", toJsonHiFi);