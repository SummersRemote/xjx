/**
 * EntityUtils - Static utility for XML entity handling
 * 
 * Centralizes all XML entity handling logic to ensure consistent treatment
 * of XML entities throughout the library.
 */
import { ErrorUtils } from './error-utils';

export class EntityUtils {
  /**
   * Escapes special characters in text for safe XML usage
   * @param text Text to escape
   * @returns Escaped XML string
   */
  public static escapeXml(text: string): string {
    if (typeof text !== "string" || text.length === 0) {
      return "";
    }

    return text.replace(/[&<>"']/g, (char) => {
      switch (char) {
        case "&": return "&amp;";
        case "<": return "&lt;";
        case ">": return "&gt;";
        case '"': return "&quot;";
        case "'": return "&apos;";
        default: return char;
      }
    });
  }

  /**
   * Unescapes XML entities back to their character equivalents
   * @param text Text with XML entities
   * @returns Unescaped text
   */
  public static unescapeXml(text: string): string {
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
  public static safeXmlText(text: string): string {
    if (typeof text !== "string" || text.length === 0) {
      return "";
    }

    // Skip escaping if text already contains entities (to avoid double-escaping)
    if (/&(amp|lt|gt|quot|apos);/.test(text)) {
      return text;
    }

    return EntityUtils.escapeXml(text);
  }

  /**
   * Determines if a string contains XML special characters that need escaping
   * @param text Text to check
   * @returns True if the text contains special characters
   */
  public static containsSpecialChars(text: string): boolean {
    if (typeof text !== "string" || text.length === 0) {
      return false;
    }

    return /[&<>"']/.test(text);
  }

  /**
   * Pre-processes XML string before parsing to handle common issues
   * @param xmlString Original XML string
   * @returns Preprocessed XML string ready for parsing
   */
  public static preprocessXml(xmlString: string): string {
    // Handle unescaped ampersands that aren't part of entities
    return xmlString.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;");
  }

  /**
   * Post-processes XML string after serialization
   * @param xmlString Raw serialized XML
   * @returns Cleaned XML string
   */
  public static postProcessXml(xmlString: string): string {
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
   * Normalize whitespace in text content
   * @param text Text to normalize
   * @param preserveWhitespace Whether to preserve whitespace
   * @returns Normalized text
   */
  public static normalizeWhitespace(text: string, preserveWhitespace: boolean = false): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    if (!preserveWhitespace) {
      // Trim and collapse multiple whitespace characters to a single space
      return text.trim().replace(/\s+/g, ' ');
    }

    return text;
  }

  /**
   * Normalize newlines to consistent format
   * @param text Text to normalize
   * @returns Text with consistent newlines
   */
  public static normalizeNewlines(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Convert all newline formats (\r\n, \r) to \n
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * Check if a string appears to be an XML fragment
   * @param text Text to check
   * @returns True if the text appears to be an XML fragment
   */
  public static isXmlFragment(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    // Check if the string starts with an XML tag
    return /^\s*<[^>]+>/.test(text);
  }
}