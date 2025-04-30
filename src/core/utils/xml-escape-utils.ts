/**
 * Enhanced XML character escaping utilities
 */

/**
 * Escapes special characters in text for safe XML usage.
 * @param text Text to escape.
 * @returns Escaped XML string.
 */
export function escapeXML(text: string): string {
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
   * Unescapes XML entities back to their character equivalents.
   * @param text Text with XML entities.
   * @returns Unescaped text.
   */
  export function unescapeXML(text: string): string {
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
   * Safely handles text content for XML parsing.
   * Detects if the text appears to contain entity references and skips escaping if it does.
   * @param text Text to process.
   * @returns Properly escaped text.
   */
  export function safeXmlText(text: string): string {
    if (typeof text !== "string" || text.length === 0) {
      return "";
    }
  
    // Skip escaping if text already contains entities (to avoid double-escaping)
    if (/&(amp|lt|gt|quot|apos);/.test(text)) {
      return text;
    }
  
    return escapeXML(text);
  }
  
  /**
   * Determines if a string contains XML special characters that need escaping.
   * @param text Text to check.
   * @returns True if the text contains special characters.
   */
  export function containsSpecialChars(text: string): boolean {
    if (typeof text !== "string" || text.length === 0) {
      return false;
    }
  
    return /[&<>"']/.test(text);
  }