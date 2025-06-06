/**
 * XML adapter - Complete XML support for XJX
 */

// IMPORTANT: Register extensions by importing the extensions file
import "./extensions";

// Export configuration
export {
  XmlConfiguration,
  DEFAULT_XML_CONFIG
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