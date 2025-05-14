/**
 * XML parsing utilities
 */
import { Configuration } from '../config';
import { DOM } from '../dom';
import { logger, validate, ParseError, ValidationError } from '../error';
import { ValidationResult } from '../transform';
import { XmlEntity } from './entity';

/**
 * XML parsing utilities
 */
export class XmlParser {
  /**
   * Parse XML string to DOM document
   * @param xmlString XML string to parse
   * @param config Optional configuration
   * @param contentType Content type (default: text/xml)
   * @returns Parsed DOM document
   */
  static parse(
    xmlString: string, 
    config?: Configuration, 
    contentType: string = 'text/xml'
  ): Document {
    try {
      // VALIDATION: Check for valid input
      validate(typeof xmlString === "string", "XML string must be a string");
      
      // Pre-process XML string to handle entity issues
      const preprocessedXml = XmlEntity.preprocess(xmlString);
      
      // Parse using DOM
      const doc = DOM.parseFromString(preprocessedXml, contentType);
      
      // Check for parsing errors
      const errors = doc.getElementsByTagName("parsererror");
      if (errors.length > 0) {
        throw new ParseError(`XML parsing error: ${errors[0].textContent}`, xmlString);
      }
      
      logger.debug('Successfully parsed XML document', {
        docElement: doc.documentElement?.nodeName,
        childCount: doc.childNodes.length
      });
      
      return doc;
    } catch (err) {
      if (err instanceof ParseError) {
        logger.error('Failed to parse XML', err);
        throw err;
      } else {
        const error = new ParseError('Failed to parse XML', xmlString);
        logger.error('Failed to parse XML', error);
        throw error;
      }
    }
  }

  /**
   * Validate XML string and return detailed result
   * @param xmlString XML string to validate
   * @returns Validation result with isValid flag and optional error message
   */
  static validate(xmlString: string): ValidationResult {
    try {
      // VALIDATION: Check for valid input
      validate(typeof xmlString === "string", "XML string must be a string");
      
      // Use the parse method which handles preprocessing
      XmlParser.parse(xmlString);
      return { isValid: true };
    } catch (err) {
      logger.debug('XML validation failed', err);
      return {
        isValid: false,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Check if a string is valid XML
   * @param xmlString String to check
   * @returns True if the string is valid XML
   */
  static isValid(xmlString: string): boolean {
    try {
      return XmlParser.validate(xmlString).isValid;
    } catch (err) {
      logger.error('Failed while checking XML validity', err);
      return false;
    }
  }

  /**
   * Create a DOM document from an XML string
   * @param xmlString XML string
   * @returns New DOM document
   */
  static createDocumentFromXml(xmlString: string): Document {
    try {
      // VALIDATION: Check for valid input
      validate(typeof xmlString === "string", "XML string must be a string");
      
      return XmlParser.parse(xmlString);
    } catch (err) {
      const error = new ParseError('Failed to create document from XML', xmlString);
      logger.error('Failed to create document from XML', error);
      throw error;
    }
  }

  /**
   * Extract XML fragments from a string
   * @param text Text containing XML fragments
   * @returns Array of XML fragments
   */
  static extractXmlFragments(text: string): string[] {
    try {
      // VALIDATION: Check for valid input
      validate(typeof text === "string", "Text must be a string");
      
      const fragments: string[] = [];
      const regex = /<[^>]+>[\s\S]*?<\/[^>]+>/g;
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        fragments.push(match[0]);
      }
      
      logger.debug('Extracted XML fragments', { count: fragments.length });
      return fragments;
    } catch (err) {
      logger.error('Failed to extract XML fragments', err);
      throw err;
    }
  }

  /**
   * Get XML element tag name
   * @param element DOM element
   * @returns Tag name
   */
  static getTagName(element: Element): string {
    try {
      // VALIDATION: Check for valid input
      validate(element !== null && element !== undefined, "Element must be provided");
      
      return element.tagName;
    } catch (err) {
      logger.error('Failed to get tag name', err);
      throw err;
    }
  }

  /**
   * Get XML element attributes as an object
   * @param element DOM element
   * @returns Object with attribute name-value pairs
   */
  static getAttributes(element: Element): Record<string, string> {
    try {
      // VALIDATION: Check for valid input
      validate(element !== null && element !== undefined, "Element must be provided");
      
      return DOM.getNodeAttributes(element);
    } catch (err) {
      logger.error('Failed to get element attributes', err);
      throw err;
    }
  }
}