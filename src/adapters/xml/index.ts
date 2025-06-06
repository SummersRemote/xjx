/**
 * XML adapter - Complete XML support for XJX
 */

// IMPORTANT: Register extensions by importing the extensions file
import "./extensions";

// Export separated configurations
export {
  XmlSourceConfiguration,
  XmlOutputConfiguration,
  DEFAULT_XML_SOURCE_CONFIG,
  DEFAULT_XML_OUTPUT_CONFIG,
  validateXmlSourceConfig,
  validateXmlOutputConfig
} from "./config";

// Export utilities
export {
  parseXml,
  preprocessXml,
  postProcessXml,
  serializeXml,
  formatXml,
  ensureXmlDeclaration,
  escapeXml,
  safeXmlText,
  normalizeWhitespace,
  createQualifiedName,
  addNamespaceDeclarations
} from "./utils";

// Export converters
export {
  xmlToXNodeConverter
} from "./source";

export {
  xnodeToXmlConverter,
  xnodeToXmlStringConverter
} from "./output";

// Export extension functions (for direct use if needed)
export { fromXml } from "./source";
export { toXml, toXmlString } from "./output";