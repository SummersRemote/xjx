/**
 * Consolidated XML Entity Handler
 *
 * Centralizes all XML entity handling logic in one place to ensure
 * consistent treatment of XML entities throughout the library.
 */
import { XJXError } from "../types/error-types";

export class XmlEntityHandler {
  // Singleton instance created immediately
  private static readonly instance = new XmlEntityHandler();

  /**
   * Get the singleton instance
   */
  public static getInstance(): XmlEntityHandler {
    return XmlEntityHandler.instance;
  }

  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  /**
   * Escapes special characters in text for safe XML usage
   * @param text Text to escape
   * @returns Escaped XML string
   */
  public escapeXML(text: string): string {
    if (typeof text !== "string" || text.length === 0) {
      return "";
    }

    return text.replace(/[&<>"']/g, (char) => {
      switch (char) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&apos;";
        default:
          return char;
      }
    });
  }

  /**
   * Unescapes XML entities back to their character equivalents
   * @param text Text with XML entities
   * @returns Unescaped text
   */
  public unescapeXML(text: string): string {
    if (typeof text !== "string" || text.length === 0) {
      return "";
    }

    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  /**
   * Safely handles text content for XML parsing
   * Detects if the text appears to contain entity references and skips escaping if it does
   * @param text Text to process
   * @returns Properly escaped text
   */
  public safeXmlText(text: string): string {
    if (typeof text !== "string" || text.length === 0) {
      return "";
    }

    // Skip escaping if text already contains entities (to avoid double-escaping)
    if (/&(amp|lt|gt|quot|apos);/.test(text)) {
      return text;
    }

    return this.escapeXML(text);
  }

  /**
   * Determines if a string contains XML special characters that need escaping
   * @param text Text to check
   * @returns True if the text contains special characters
   */
  public containsSpecialChars(text: string): boolean {
    if (typeof text !== "string" || text.length === 0) {
      return false;
    }

    return /[&<>"']/.test(text);
  }

  /**
   * Pre-processes XML string before parsing to handle common issues
   * Centralizes preprocessing logic from multiple converters
   * @param xmlString Original XML string
   * @returns Preprocessed XML string ready for parsing
   */
  public preprocessXml(xmlString: string): string {
    // Much simpler approach that only handles the essential escaping
    return xmlString
      .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;")
  }

  /**
   * Post-processes XML string after serialization
   * @param xmlString Raw serialized XML
   * @returns Cleaned XML string
   */
  public postProcessXml(xmlString: string): string {
    // Remove xhtml namespace declaration that might be inserted by some DOM implementations
    let processed = xmlString.replace(
      ' xmlns="http://www.w3.org/1999/xhtml"',
      ""
    );

    // Clean up XML declaration if needed
    if (processed.startsWith("<?xml")) {
      const xmlDeclEnd = processed.indexOf("?>");
      if (xmlDeclEnd > 0) {
        processed = processed.substring(xmlDeclEnd + 2).trim();
      }
    }

    return processed;
  }

  /**
   * Helper method to check if a substring starts with a valid XML structure
   * @private
   */
  private isValidXmlStart(substring: string): boolean {
    // Check for element tags, comments, processing instructions, CDATA, etc.
    return /^<([!?]|[a-zA-Z_:]|\/[a-zA-Z_:])/.test(substring);
  }

  /**
   * Helper method to check if a substring ends with a valid XML structure
   * @private
   */
  private isValidXmlEnd(substring: string): boolean {
    // Simplified check - could be enhanced for more complex cases
    return /[a-zA-Z0-9_:"'\s/]>$/.test(substring);
  }
}
