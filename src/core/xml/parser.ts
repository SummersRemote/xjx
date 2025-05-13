/**
 * XML parsing utilities
 */
import { Configuration } from '../config';
import { DOM } from '../dom';
import { ErrorHandler } from '../error';
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
    return ErrorHandler.try(
      () => {
        // Pre-process XML string to handle entity issues
        const preprocessedXml = XmlEntity.preprocess(xmlString);
        
        // Parse using DOM
        const doc = DOM.parseFromString(preprocessedXml, contentType);
        
        // Check for parsing errors
        const errors = doc.getElementsByTagName("parsererror");
        if (errors.length > 0) {
          throw new Error(`XML parsing error: ${errors[0].textContent}`);
        }
        
        return doc;
      },
      'Failed to parse XML',
      'xml-to-json'
    );
  }

  /**
   * Validate XML string and return detailed result
   * @param xmlString XML string to validate
   * @returns Validation result with isValid flag and optional error message
   */
  static validate(xmlString: string): ValidationResult {
    try {
      // Use the parse method which handles preprocessing
      XmlParser.parse(xmlString);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if a string is valid XML
   * @param xmlString String to check
   * @returns True if the string is valid XML
   */
  static isValid(xmlString: string): boolean {
    return XmlParser.validate(xmlString).isValid;
  }

  /**
   * Create a DOM document from an XML string
   * @param xmlString XML string
   * @returns New DOM document
   */
  static createDocumentFromXml(xmlString: string): Document {
    return XmlParser.parse(xmlString);
  }

  /**
   * Extract XML fragments from a string
   * @param text Text containing XML fragments
   * @returns Array of XML fragments
   */
  static extractXmlFragments(text: string): string[] {
    const fragments: string[] = [];
    const regex = /<[^>]+>[\s\S]*?<\/[^>]+>/g;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      fragments.push(match[0]);
    }
    
    return fragments;
  }

  /**
   * Get XML element tag name
   * @param element DOM element
   * @returns Tag name
   */
  static getTagName(element: Element): string {
    return element.tagName;
  }

  /**
   * Get XML element attributes as an object
   * @param element DOM element
   * @returns Object with attribute name-value pairs
   */
  static getAttributes(element: Element): Record<string, string> {
    return DOM.getNodeAttributes(element);
  }
}