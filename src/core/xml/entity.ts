/**
 * XML entity handling utilities
 */
import { logger, validate, ValidationError } from '../error';

export class XmlEntity {
    /**
     * Escapes special characters in text for safe XML usage
     * @param text Text to escape
     * @returns Escaped XML string
     */
    static escape(text: string): string {
      try {
        // VALIDATION: Check for valid input
        validate(typeof text === "string", "Text to escape must be a string");
  
        if (text.length === 0) {
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
      } catch (err) {
        logger.error('Failed to escape XML text', err);
        throw err;
      }
    }
  
    /**
     * Unescapes XML entities back to their character equivalents
     * @param text Text with XML entities
     * @returns Unescaped text
     */
    static unescape(text: string): string {
      try {
        // VALIDATION: Check for valid input
        validate(typeof text === "string", "Text to unescape must be a string");
  
        if (text.length === 0) {
          return "";
        }
  
        return text
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
      } catch (err) {
        logger.error('Failed to unescape XML text', err);
        throw err;
      }
    }
  
    /**
     * Safely handles text content for XML parsing
     * Detects if the text appears to contain entity references and skips escaping if it does
     * @param text Text to process
     * @returns Properly escaped text
     */
    static safeText(text: string): string {
      try {
        // VALIDATION: Check for valid input
        validate(typeof text === "string", "Text to process must be a string");
  
        if (text.length === 0) {
          return "";
        }
  
        // Skip escaping if text already contains entities (to avoid double-escaping)
        if (/&(amp|lt|gt|quot|apos);/.test(text)) {
          return text;
        }
  
        return XmlEntity.escape(text);
      } catch (err) {
        logger.error('Failed to safely process XML text', err);
        throw err;
      }
    }
  
    /**
     * Determines if a string contains XML special characters that need escaping
     * @param text Text to check
     * @returns True if the text contains special characters
     */
    static containsSpecialChars(text: string): boolean {
      try {
        if (typeof text !== "string" || text.length === 0) {
          return false;
        }
  
        return /[&<>"']/.test(text);
      } catch (err) {
        logger.error('Failed to check for special characters', err);
        throw err;
      }
    }
  
    /**
     * Pre-processes XML string before parsing to handle common issues
     * @param xmlString Original XML string
     * @returns Preprocessed XML string ready for parsing
     */
    static preprocess(xmlString: string): string {
      try {
        // VALIDATION: Check for valid input
        validate(typeof xmlString === "string", "XML string must be a string");
        
        // Handle unescaped ampersands that aren't part of entities
        const processed = xmlString.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;");
        logger.debug('Preprocessed XML string', { 
          originalLength: xmlString.length, 
          processedLength: processed.length 
        });
        return processed;
      } catch (err) {
        logger.error('Failed to preprocess XML string', err);
        throw err;
      }
    }
  
    /**
     * Post-processes XML string after serialization
     * @param xmlString Raw serialized XML
     * @returns Cleaned XML string
     */
    static postProcess(xmlString: string): string {
      try {
        // VALIDATION: Check for valid input
        validate(typeof xmlString === "string", "XML string must be a string");
        
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
  
        logger.debug('Post-processed XML string', { 
          originalLength: xmlString.length, 
          processedLength: processed.length 
        });
        return processed;
      } catch (err) {
        logger.error('Failed to post-process XML string', err);
        throw err;
      }
    }
  
    /**
     * Normalize whitespace in text content
     * @param text Text to normalize
     * @param preserveWhitespace Whether to preserve whitespace
     * @returns Normalized text
     */
    static normalizeWhitespace(text: string, preserveWhitespace: boolean = false): string {
      try {
        if (!text || typeof text !== 'string') {
          return '';
        }
  
        if (!preserveWhitespace) {
          // Trim and collapse multiple whitespace characters to a single space
          return text.trim().replace(/\s+/g, ' ');
        }
  
        return text;
      } catch (err) {
        logger.error('Failed to normalize whitespace', err);
        throw err;
      }
    }
  
    /**
     * Normalize newlines to consistent format
     * @param text Text to normalize
     * @returns Text with consistent newlines
     */
    static normalizeNewlines(text: string): string {
      try {
        if (!text || typeof text !== 'string') {
          return '';
        }
  
        // Convert all newline formats (\r\n, \r) to \n
        return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      } catch (err) {
        logger.error('Failed to normalize newlines', err);
        throw err;
      }
    }
  
    /**
     * Check if a string appears to be an XML fragment
     * @param text Text to check
     * @returns True if the text appears to be an XML fragment
     */
    static isXmlFragment(text: string): boolean {
      try {
        if (!text || typeof text !== 'string') {
          return false;
        }
  
        // Check if the string starts with an XML tag
        return /^\s*<[^>]+>/.test(text);
      } catch (err) {
        logger.error('Failed to check if text is XML fragment', err);
        throw err;
      }
    }
  
    /**
     * Check if text has non-whitespace content
     * @param text Text to check
     * @returns True if text has non-whitespace content
     */
    static hasContent(text: string): boolean {
      try {
        return typeof text === "string" && text.trim().length > 0;
      } catch (err) {
        logger.error('Failed to check if text has content', err);
        throw err;
      }
    }
}