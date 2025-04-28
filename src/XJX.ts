/**
 * XJX - Facade class for XML-JSON conversion operations
 */
import { XmlToJsonConverter } from "./core/converters/xml-to-json-converter";
import { JsonToXmlConverter } from "./core/converters/json-to-xml-converter";
import { Configuration } from "./core/types/config-types";
import { DEFAULT_CONFIG } from "./core/config/config";
import { DOMAdapter } from "./core/adapters/dom-adapter";
import { XmlUtil } from "./core/utils/xml-utils";
import { JsonUtil } from "./core/utils/json-utils";
import { ValueTransformer } from "./core/transformers";

export class XJX {
  private config: Configuration;
  private xmlToJsonConverter: XmlToJsonConverter;
  private jsonToXmlConverter: JsonToXmlConverter;
  private jsonUtil: JsonUtil;
  private xmlUtil: XmlUtil;

  /**
   * Constructor for XJX utility
   * @param config Configuration options
   */
  constructor(config: Partial<Configuration> = {}) {
    // First create a jsonUtil instance with default config to use its methods
    this.jsonUtil = new JsonUtil(DEFAULT_CONFIG);

    // Create a deep clone of the default config
    const defaultClone = this.jsonUtil.deepClone(DEFAULT_CONFIG);

    // Deep merge with the provided config
    this.config = this.jsonUtil.deepMerge<Configuration>(defaultClone, config);

    // Re-initialize jsonUtil with the merged config
    this.jsonUtil = new JsonUtil(this.config);

    // Initialize other components
    this.xmlUtil = new XmlUtil(this.config);
    this.xmlToJsonConverter = new XmlToJsonConverter(this.config);
    this.jsonToXmlConverter = new JsonToXmlConverter(this.config);
  }

  /**
   * Convert XML string to JSON
   * @param xmlString XML content as string
   * @returns JSON object representing the XML content
   */
  public xmlToJson(xmlString: string): Record<string, any> {
    return this.xmlToJsonConverter.convert(xmlString);
  }

  /**
   * Convert JSON object back to XML string
   * @param jsonObj JSON object to convert
   * @returns XML string
   */
  public jsonToXml(jsonObj: Record<string, any>): string {
    return this.jsonToXmlConverter.convert(jsonObj);
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
  public validateXML(xmlString: string): {
    isValid: boolean;
    message?: string;
  } {
    return this.xmlUtil.validateXML(xmlString);
  }

  /**
   * Generate a JSON schema based on the current configuration
   * @returns JSON schema object for validating XML-JSON documents
   */
  public generateJsonSchema(): Record<string, any> {
    return this.jsonUtil.generateJsonSchema();
  }

  /**
   * Convert a standard JSON object to the XML-like JSON structure
   * @param obj Standard JSON object
   * @param root Optional root element configuration (string or object with properties)
   * @returns XML-like JSON object ready for conversion to XML
   */
  public objectToXJX(obj: any, root?: string | Record<string, any>): Record<string, any> {
    return this.jsonUtil.objectToXJX(obj, root);
  }

  /**
   * Generate an example JSON object that matches the current configuration
   * @param rootName Name of the root element
   * @returns Example JSON object
   */
  public generateJsonExample(rootName: string = "root"): Record<string, any> {
    return this.jsonUtil.generateExample(rootName);
  }

  /**
   * Add a value transformer to the configuration
   * @param transformer Value transformer to add
   * @returns This XJX instance for chaining
   */
  public addTransformer(transformer: ValueTransformer): XJX {
    if (!this.config.valueTransforms) {
      this.config.valueTransforms = [];
    }
    this.config.valueTransforms.push(transformer);
    return this;
  }

  /**
   * Removes all value transformers from the configuration
   * @returns This XJX instance for chaining
   */
  public clearTransformers(): XJX {
    this.config.valueTransforms = [];
    return this;
  }

  /**
   * Clean up any resources
   */
  public cleanup(): void {
    DOMAdapter.cleanup();
  }
}