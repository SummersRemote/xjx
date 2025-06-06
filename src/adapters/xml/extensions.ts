/**
 * XML adapter extensions registration
 */
import { XJX } from "../../XJX";
import { fromXml } from "./source";
import { toXml, toXmlString } from "./output";
import { DEFAULT_XML_SOURCE_CONFIG, DEFAULT_XML_OUTPUT_CONFIG } from "./config";

// Register XML source extensions with source configuration
XJX.registerNonTerminalExtension("fromXml", fromXml, {
  xml: {
    source: DEFAULT_XML_SOURCE_CONFIG
  }
});

// Register XML output extensions with output configuration
XJX.registerTerminalExtension("toXml", toXml, {
  xml: {
    output: DEFAULT_XML_OUTPUT_CONFIG
  }
});

XJX.registerTerminalExtension("toXmlString", toXmlString, {
  xml: {
    output: DEFAULT_XML_OUTPUT_CONFIG
  }
});