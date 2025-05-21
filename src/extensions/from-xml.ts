/**
 * Extension implementation for fromXml method
 */
import { XJX } from "../XJX";
import { createXmlToXNodeConverter } from "../converters/xml-to-xnode-converter";
import { FORMAT } from "../core/transform";
import { logger, ProcessingError, validate } from "../core/error";
import { NonTerminalExtensionContext } from "../core/extension";

/**
 * Implementation for setting XML source
 */
export function fromXml(this: NonTerminalExtensionContext, xml: string): void {
  try {
    // API boundary validation
    validate(typeof xml === "string", "XML source must be a string");
    validate(xml.trim().length > 0, "XML source cannot be empty");
    
    logger.debug('Setting XML source for transformation', {
      sourceLength: xml.length
    });
    
    // Create converter with the current configuration
    const converter = createXmlToXNodeConverter(this.config);
    
    try {
      // Convert XML to XNode
      this.xnode = converter.convert(xml);
    } catch (err) {
      // Specific error handling for XML conversion failures
      throw new ProcessingError("Failed to parse XML source", xml);
    }
    
    // Set the source format
    this.sourceFormat = FORMAT.XML;
    
    logger.debug('Successfully set XML source', {
      rootNodeName: this.xnode?.name,
      rootNodeType: this.xnode?.type
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to parse XML source: ${String(err)}`);
  }
}

// Register the extension with XJX
XJX.registerNonTerminalExtension("fromXml", fromXml);