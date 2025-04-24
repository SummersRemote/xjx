/**
 * XJX - Facade class for XML-JSON conversion operations
 */
import { XMLToJSON } from "./core/XMLToJSON";
import { JSONToXML } from "./core/JSONToXML";
import { Configuration } from "./core/types/types";
import { DEFAULT_CONFIG } from "./core/config/config";
import { DOMAdapter } from "./core/DOMAdapter";
import { XMLUtil } from "./core/utils/XMLUtil";
import { JSONUtil } from "./core/utils/JSONUtil";

export class XJX {
  private config: Configuration;
  private xmltojson: XMLToJSON;
  private jsontoxml: JSONToXML;
  private jsonUtil: JSONUtil;
  private xmlUtil: XMLUtil;

  /**
   * Constructor for XJX utility
   * @param config Configuration options
   */
  constructor(config: Partial<Configuration> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize all components with config
    this.jsonUtil = new JSONUtil(this.config);
    this.xmlUtil = new XMLUtil(this.config);
    this.xmltojson = new XMLToJSON(this.config);
    this.jsontoxml = new JSONToXML(this.config);
  }

  /**
   * Convert XML string to JSON
   * @param xmlString XML content as string
   * @returns JSON object representing the XML content
   */
  public xmlToJson(xmlString: string): Record<string, any> {
    return this.xmltojson.parse(xmlString);
  }

  /**
   * Convert JSON object back to XML string
   * @param jsonObj JSON object to convert
   * @returns XML string
   */
  public jsonToXml(jsonObj: Record<string, any>): string {
    return this.jsontoxml.serialize(jsonObj);
  }

  /**
   * Pretty print an XML string
   * @param xmlString XML string to format
   * @returns Formatted XML string
   */
  public prettyPrintXml(xmlString: string): string {
    return this.xmlUtil.prettyPrintXml(xmlString);
  }

  /**
   * Safely retrieves a value from a JSON object using a dot-separated path.
   * @param obj The input JSON object
   * @param path The dot-separated path string (e.g., "root.item.description.$val")
   * @param fallback Value to return if the path does not resolve
   * @returns The value at the specified path or the fallback value
   */
  public getPath(
    obj: Record<string, any>,
    path: string,
    fallback: any = undefined
  ): any {
    return this.jsonUtil.getPath(obj, path, fallback);
  }

  /**
   * Validate XML string
   * @param xmlString XML string to validate
   * @returns Validation result
   */
  public validateXML(xmlString: string): { isValid: boolean; message?: string } {
    return this.xmlUtil.validateXML(xmlString);
  }

  /**
   * Clean up any resources
   */
  public cleanup(): void {
    DOMAdapter.cleanup();
  }
}