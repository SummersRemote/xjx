/**
 * XJX - Main class with fluent API
 */
import { Configuration, createConfig, getDefaultConfig } from "./core/config";
import { Format, Transform } from "./core/transform";
import { XNode, cloneNode } from "./core/xnode";
import { validate, ValidationError, logger, LogLevel } from "./core/error";

/**
 * Main XJX class - provides the fluent API for XML/JSON transformation
 */
export class XJX {
  // Instance properties
  public xnode: XNode | null = null;
  public transforms: Transform[] = [];
  public config: Configuration;
  public sourceFormat: Format | null = null;
  
  /**
   * Create a new XJX instance
   * @param config Optional configuration
   */
  constructor(config?: Partial<Configuration>) {
    this.config = createConfig(config);
    logger.debug('Created new XJX instance with configuration', {
      preserveNamespaces: this.config.preserveNamespaces,
      preserveComments: this.config.preserveComments,
      preserveTextNodes: this.config.preserveTextNodes
    });
  }
  
  // --- Source Methods ---
  
  /**
   * Set XML source for transformation
   * @param xml XML string
   * @returns This instance for chaining
   */
  public fromXml(xml: string): XJX {
    // API boundary validation
    validate(typeof xml === "string", "XML source must be a string");
    validate(xml.trim().length > 0, "XML source cannot be empty");
    
    // Implementation will be done in the extensions
    return this;
  }
  
  /**
   * Set JSON source for transformation with automatic format detection
   * @param source JSON object (XJX-formatted or standard)
   * @returns This instance for chaining
   */
  public fromJson(source: Record<string, any>): XJX {
    // API boundary validation
    validate(source !== null && typeof source === 'object', "JSON source must be an object");
    
    // Implementation will be done in the extensions
    return this;
  }
  
  /**
   * Set XJX-formatted JSON source for transformation
   * @param source XJX-formatted JSON object
   * @returns This instance for chaining
   */
  public fromXjxJson(source: Record<string, any>): XJX {
    // API boundary validation
    validate(source !== null && typeof source === 'object', "XJX JSON source must be an object");
    validate(!Array.isArray(source), "XJX JSON source cannot be an array");
    validate(Object.keys(source).length > 0, "XJX JSON source cannot be empty");
    
    // Implementation will be done in the extensions
    return this;
  }
  
  /**
   * Set standard JSON object as source for transformation
   * @param source Standard JavaScript object or array
   * @returns This instance for chaining
   */
  public fromObjJson(source: Record<string, any> | any[]): XJX {
    // API boundary validation
    validate(source !== null && typeof source === 'object', "Object source must be an object or array");
    
    // Implementation will be done in the extensions
    return this;
  }
  
  // --- Configuration Methods ---
  
  /**
   * Set configuration options
   * @param config Partial configuration to merge with defaults
   * @returns This instance for chaining
   */
  public withConfig(config: Partial<Configuration>): XJX {
    // API boundary validation
    validate(config !== null && typeof config === 'object', "Configuration must be an object");
    
    // Skip if empty config object
    if (Object.keys(config).length === 0) {
      logger.debug('Empty configuration provided, skipping merge');
      return this;
    }
    
    // Implementation will be done in the extensions
    return this;
  }
  
  /**
   * Set the log level for the XJX library
   * @param level Log level (debug, info, warn, error, none)
   * @returns This instance for chaining
   */
  public setLogLevel(level: LogLevel | string): XJX {
    // API boundary validation
    validate(level !== undefined && level !== null, "Log level must be provided");
    
    // Implementation will be done in the extensions
    return this;
  }
  
  // --- Transform Methods ---
  
  /**
   * Add transformers to the pipeline
   * @param transforms One or more transformers
   * @returns This instance for chaining
   */
  public withTransforms(...transforms: Transform[]): XJX {
    // API boundary validation
    validate(Array.isArray(transforms), "Transforms must be an array");
    
    // Skip if no transforms provided
    if (transforms.length === 0) {
      logger.debug('No transforms provided, skipping');
      return this;
    }
    
    // Implementation will be done in the extensions
    return this;
  }
  
  // --- Output Methods ---
  
  /**
   * Convert to XML DOM
   * @returns DOM Document
   */
  public toXml(): Document {
    // API boundary validation
    this.validateSource();
    
    // Implementation will be done in the extensions
    throw new Error("Method not implemented");
  }
  
  /**
   * Convert to XML string
   * @param options Optional serialization options
   * @returns XML string representation
   */
  public toXmlString(options?: {
    prettyPrint?: boolean;
    indent?: number;
    declaration?: boolean;
  }): string {
    // API boundary validation
    this.validateSource();
    
    // Implementation will be done in the extensions
    throw new Error("Method not implemented");
  }
  
  /**
   * Convert to XJX formatted JSON
   * @returns XJX JSON object
   */
  public toXjxJson(): Record<string, any> {
    // API boundary validation
    this.validateSource();
    
    // Implementation will be done in the extensions
    throw new Error("Method not implemented");
  }
  
  /**
   * Convert to XJX JSON string
   * @returns Stringified XJX JSON
   */
  public toXjxJsonString(): string {
    // API boundary validation
    this.validateSource();
    
    // Implementation will be done in the extensions
    throw new Error("Method not implemented");
  }
  
  /**
   * Convert to standard JavaScript object
   * @returns Standard JSON object
   */
  public toStandardJson(): any {
    // API boundary validation
    this.validateSource();
    
    // Implementation will be done in the extensions
    throw new Error("Method not implemented");
  }
  
  /**
   * Convert to standard JSON string
   * @returns Stringified standard JSON
   */
  public toStandardJsonString(): string {
    // API boundary validation
    this.validateSource();
    
    // Implementation will be done in the extensions
    throw new Error("Method not implemented");
  }
  
  // --- Utility Methods ---
  
  /**
   * Validate that a source has been set before transformation
   * @throws Error if no source has been set
   */
  public validateSource(): void {
    if (!this.xnode || !this.sourceFormat) {
      throw new ValidationError('No source set: call fromXml() or fromJson() before transformation');
    }
  }
  
  /**
   * Clone an XNode
   * @param node Node to clone
   * @param deep Whether to clone deeply
   * @returns Cloned node
   */
  public cloneNode(node: XNode, deep: boolean = false): XNode {
    return cloneNode(node, deep);
  }
}

export default XJX;