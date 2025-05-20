import { XmlSerializationOptions } from "./converters/xnode-to-xml-converter";/**
 * XJX - Main class with fluent API
 */
import { Configuration, createConfig, getDefaultConfig } from "./core/config";
import { FORMAT, Transform } from "./core/transform";
import { XNode, cloneNode } from "./core/xnode";
import { validate, ValidationError, logger, LogLevel } from "./core/error";
import { JsonOptions, JsonValue } from "./core/converter";

/**
 * Main XJX class - provides the fluent API for XML/JSON transformation
 */
export class XJX {
  // Instance properties
  public xnode: XNode | null = null;
  public transforms: Transform[] = [];
  public config: Configuration;
  public sourceFormat: FORMAT | null = null;
  
  /**
   * Create a new XJX instance
   * @param config Optional configuration
   */
  constructor(config?: Partial<Configuration>) {
    this.config = createConfig(config);
    logger.debug('Created new XJX instance with configuration', {
      preserveNamespaces: this.config.preserveNamespaces,
      preserveComments: this.config.preserveComments,
      preserveTextNodes: this.config.preserveTextNodes,
      highFidelity: this.config.highFidelity
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
   * Set JSON source for transformation
   * @param source JSON object or array
   * @param options JSON options
   * @returns This instance for chaining
   */
  public fromJson(source: JsonValue, options?: JsonOptions): XJX {
    // API boundary validation
    validate(source !== null && typeof source === 'object', "JSON source must be an object or array");
    
    // Implementation will be done in the extensions
    return this;
  }
  
  /**
   * Set JSON string source for transformation
   * @param source JSON string
   * @param options JSON options
   * @returns This instance for chaining
   */
  public fromJsonString(source: string, options?: JsonOptions): XJX {
    // API boundary validation
    validate(typeof source === "string", "JSON string source must be a string");
    validate(source.trim().length > 0, "JSON string source cannot be empty");
    
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
  public toXmlString(options?: XmlSerializationOptions): string {
    // API boundary validation
    this.validateSource();
    
    // Implementation will be done in the extensions
    throw new Error("Method not implemented");
  }
  
  /**
   * Convert to JSON
   * @param options Optional JSON options
   * @returns JSON representation
   */
  public toJson(options?: JsonOptions): JsonValue {
    // API boundary validation
    this.validateSource();
    
    // Implementation will be done in the extensions
    throw new Error("Method not implemented");
  }
  
  /**
   * Convert to JSON string
   * @param options Optional JSON options with indent
   * @returns JSON string representation
   */
  public toJsonString(options?: JsonOptions & { indent?: number }): string {
    // API boundary validation
    this.validateSource();
    
    // Implementation will be done in the extensions
    throw new Error("Method not implemented");
  }
  
  // --- Legacy Output Methods (Deprecated) ---
  
  /**
   * @deprecated Use toJson({ highFidelity: true }) instead
   * Convert to XJX formatted JSON
   */
  public toXjxJson(): Record<string, any> {
    logger.warn('toXjxJson() is deprecated, use toJson({ highFidelity: true }) instead');
    return this.toJson({ highFidelity: true }) as Record<string, any>;
  }
  
  /**
   * @deprecated Use toJsonString({ highFidelity: true }) instead
   * Convert to XJX JSON string
   */
  public toXjxJsonString(): string {
    logger.warn('toXjxJsonString() is deprecated, use toJsonString({ highFidelity: true }) instead');
    return this.toJsonString({ highFidelity: true });
  }
  
  /**
   * @deprecated Use toJson() instead
   * Convert to standard JavaScript object
   */
  public toStandardJson(): any {
    logger.warn('toStandardJson() is deprecated, use toJson() instead');
    return this.toJson();
  }
  
  /**
   * @deprecated Use toJsonString() instead
   * Convert to standard JSON string
   */
  public toStandardJsonString(): string {
    logger.warn('toStandardJsonString() is deprecated, use toJsonString() instead');
    return this.toJsonString();
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