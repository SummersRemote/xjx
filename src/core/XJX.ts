/**
 * XJX - Simplified XML-JSON transformation library
 * 
 * This version provides a clean, direct API for XML-JSON conversion
 * with transformer support.
 */
import { Configuration } from "./types/config-types";
import { ConfigProvider } from "./config/config-provider";
import { TransformDirection } from "./types/transform-types";
import { ValueTransformer, AttributeTransformer, ChildrenTransformer, NodeTransformer } from "./types/transform-types";
import { TransformerManager } from "./services/transformer-manager";
import { TransformationService } from "./services/transformation-service";
import { XmlToJsonConverter } from "./converters/xml-to-json-converter";
import { JsonToXmlConverter } from "./converters/json-to-xml-converter";
import { XmlUtil } from "./utils/xml-utils";
import { JsonUtil } from "./utils/json-utils";
import { DOMAdapter } from "./adapters/dom-adapter";
import { TransformationRegistry } from "./transformation-registry";

/**
 * XJX - XML-JSON transformation library
 * 
 * @example
 * Basic usage:
 * ```typescript
 * import { XJX, TransformDirection, BooleanTransformer } from 'xjx';
 * 
 * // Create a new instance with optional configuration
 * const xjx = new XJX({
 *   preserveWhitespace: false,
 *   outputOptions: {
 *     prettyPrint: true,
 *     indent: 2
 *   }
 * });
 * 
 * // Add a transformer (optional)
 * xjx.addValueTransformer(TransformDirection.XML_TO_JSON, new BooleanTransformer());
 * 
 * // Convert XML to JSON
 * const json = xjx.xmlToJson('<root><active>true</active></root>');
 * 
 * // Convert JSON back to XML
 * const xml = xjx.jsonToXml(json);
 * ```
 */
export class XJX {
  // Configuration
  private config: Configuration;
  
  // Core components
  private transformerManager: TransformerManager;
  private transformationService: TransformationService;
  private xmlToJsonConverter: XmlToJsonConverter;
  private jsonToXmlConverter: JsonToXmlConverter;
  private xmlUtil: XmlUtil;
  private jsonUtil: JsonUtil;
  
  /**
   * Constructor for XJX
   * @param config Optional partial configuration to override defaults
   */
  constructor(config: Partial<Configuration> = {}) {
    // Initialize configuration
    const configProvider = ConfigProvider.getInstance(config);
    this.config = configProvider.getConfig();
    
    // Initialize components
    this.transformerManager = new TransformerManager();
    this.transformationService = new TransformationService(this.config, this.transformerManager);
    this.xmlUtil = new XmlUtil(this.config);
    this.jsonUtil = new JsonUtil(this.config);
    
    // Register the transformation service
    this.registerTransformationService();
    
    // Initialize converters
    this.xmlToJsonConverter = new XmlToJsonConverter(this.config);
    this.jsonToXmlConverter = new JsonToXmlConverter(this.config);
  }
  
  /**
   * Register the transformation service with the registry
   */
  private registerTransformationService(): void {
    TransformationRegistry.registerOperation(
      'applyTransformations',
      this.transformationService.applyTransformations.bind(this.transformationService)
    );
  }
  
  /**
   * Add a transformer for primitive values
   * @param direction Direction of transformation to apply the transformer to
   * @param transformer Value transformer
   * @returns This XJX instance for chaining
   */
  public addValueTransformer(
    direction: TransformDirection,
    transformer: ValueTransformer
  ): this {
    this.transformerManager.addValueTransformer(direction, transformer);
    return this;
  }
  
  /**
   * Add a transformer for attributes
   * @param direction Direction of transformation to apply the transformer to
   * @param transformer Attribute transformer
   * @returns This XJX instance for chaining
   */
  public addAttributeTransformer(
    direction: TransformDirection,
    transformer: AttributeTransformer
  ): this {
    this.transformerManager.addAttributeTransformer(direction, transformer);
    return this;
  }
  
  /**
   * Add a transformer for children nodes
   * @param direction Direction of transformation to apply the transformer to
   * @param transformer Children transformer
   * @returns This XJX instance for chaining
   */
  public addChildrenTransformer(
    direction: TransformDirection,
    transformer: ChildrenTransformer
  ): this {
    this.transformerManager.addChildrenTransformer(direction, transformer);
    return this;
  }
  
  /**
   * Add a generic transformer for nodes
   * @param direction Direction of transformation to apply the transformer to
   * @param transformer Node transformer
   * @returns This XJX instance for chaining
   */
  public addNodeTransformer(
    direction: TransformDirection,
    transformer: NodeTransformer
  ): this {
    this.transformerManager.addNodeTransformer(direction, transformer);
    return this;
  }
  
  /**
   * Clear all transformers
   * @param direction Optional specific direction to clear, or all if not specified
   * @returns This XJX instance for chaining
   */
  public clearTransformers(direction?: TransformDirection): this {
    this.transformerManager.clearTransformers(direction);
    return this;
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
   * Convert JSON object to XML string
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
   * Convert a standard JSON object to the XML-like JSON structure
   * @param obj Standard JSON object
   * @param root Optional root element configuration (string or object with properties)
   * @returns XML-like JSON object ready for conversion to XML
   */
  public objectToXJX(
    obj: any,
    root?: string | Record<string, any>
  ): Record<string, any> {
    return this.jsonUtil.objectToXJX(obj, root);
  }
  
  /**
   * Clean up any resources
   */
  public cleanup(): void {
    DOMAdapter.cleanup();
  }
}