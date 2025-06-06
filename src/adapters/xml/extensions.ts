/**
 * XML adapter extensions registration
 */
import { XJX } from "../../XJX";
import { fromXml } from "./source";
import { toXml, toXmlString } from "./output";
import { DEFAULT_XML_CONFIG } from "./config";

// Register XML source extensions
XJX.registerNonTerminalExtension("fromXml", fromXml, {
  xml: DEFAULT_XML_CONFIG
});

// Register XML output extensions
XJX.registerTerminalExtension("toXml", toXml);
XJX.registerTerminalExtension("toXmlString", toXmlString);