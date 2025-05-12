/**
 * XJX Builder implementation - Fluent API for XML/JSON transformations
 * 
 * This builder provides a fluent interface for transforming between XML and JSON,
 * utilizing the new static utility classes.
 */
import {
  Configuration,
  Transform,
  TransformDirection,
  FormatId,
  FORMATS
} from './core/types/transform-interfaces';
import { XNode } from './core/models/xnode';
import { ConfigService } from './core/services/config-service';
import { ErrorUtils } from './core/utils/error-utils';
import { CommonUtils } from './core/utils/common-utils';
import { DefaultXmlToXNodeConverter } from './converters/xml-to-xnode-converter'; 
import { DefaultJsonToXNodeConverter } from './converters/json-to-xnode-converter';
import { DefaultXNodeToXmlConverter } from './converters/xnode-to-xml-converter';
import { DefaultXNodeToJsonConverter } from './converters/xnode-to-json-converter';
import { DefaultXNodeTransformer } from './converters/xnode-transformer';

/**
 * Builder for XJX transformations
 */
export class XjxBuilder {
  // Public properties that extensions can access
  public xnode: XNode | null = null;
  public transforms: Transform[] = [];
  public config: Configuration;
  public direction: TransformDirection | null = null;
  public configProvider: ConfigService;
  
  /**
   * Create a new builder instance
   */
  constructor() {
    // Get the singleton config provider
    this.configProvider = ConfigService.getInstance();
    
    // Initialize with a deep clone of the global configuration
    this.config = CommonUtils.deepClone(this.configProvider.getMutableConfig());
  }
  
  /**
   * Set XML source for transformation
   * @param source XML string
   * @returns This builder for chaining
   */
  public fromXml(source: string): XjxBuilder {
    ErrorUtils.validate(
      !!source && typeof source === 'string',
      'Invalid XML source: must be a non-empty string',
      'xml-to-json'
    );
    
    // Convert XML to XNode using the appropriate converter
    const converter = new DefaultXmlToXNodeConverter(this.config);
    this.xnode = converter.convert(source);
    this.direction = TransformDirection.XML_TO_JSON;
    
    return this;
  }
  
  /**
   * Set JSON source for transformation
   * @param source JSON object
   * @returns This builder for chaining
   */
  public fromJson(source: Record<string, any>): XjxBuilder {
    ErrorUtils.validate(
      !!source && typeof source === 'object' && !Array.isArray(source),
      'Invalid JSON source: must be a non-empty object',
      'json-to-xml'
    );
    
    // Convert JSON to XNode using the appropriate converter
    const converter = new DefaultJsonToXNodeConverter(this.config);
    this.xnode = converter.convert(source);
    this.direction = TransformDirection.JSON_TO_XML;
    
    return this;
  }
  
  /**
   * Set configuration options
   * @param config Partial configuration to merge with defaults
   * @returns This builder for chaining
   */
  public withConfig(config: Partial<Configuration>): XjxBuilder {
    if (!config || Object.keys(config).length === 0) {
      return this;
    }
    
    // Merge with current config
    this.config = CommonUtils.deepMerge(this.config, config);
    return this;
  }
  
  /**
   * Add transformers to the pipeline
   * @param transforms One or more transformers
   * @returns This builder for chaining
   */
  public withTransforms(...transforms: Transform[]): XjxBuilder {
    if (!transforms || transforms.length === 0) {
      return this;
    }
    
    // Validate transforms
    for (const transform of transforms) {
      ErrorUtils.validate(
        !!transform && !!transform.targets && !!transform.transform,
        'Invalid transform: must implement the Transform interface',
        'general'
      );
    }
    
    // Add transforms to the pipeline
    this.transforms.push(...transforms);
    return this;
  }
  
  /**
   * Reset this builder's configuration to match global configuration
   * @returns This builder for chaining
   */
  public resetToGlobalConfig(): XjxBuilder {
    this.config = CommonUtils.deepClone(this.configProvider.getMutableConfig());
    return this;
  }
  
  /**
   * Make this builder's configuration the global default
   * @returns This builder for chaining
   */
  public makeConfigGlobal(): XjxBuilder {
    this.configProvider.setConfig(CommonUtils.deepClone(this.config));
    return this;
  }
  
  /**
   * Convert current XNode to JSON object
   * @returns JSON object representation
   */
  public toJson(): Record<string, any> {
    // Validate source is set
    this.validateSource();
    
    // Apply transformations if any are registered
    if (this.transforms && this.transforms.length > 0) {
      const transformer = new DefaultXNodeTransformer(this.config);
      this.xnode = transformer.transform(
        this.xnode!, 
        this.transforms, 
        FORMATS.JSON // Use format identifier instead of direction
      );
    }
    
    // Convert XNode to JSON
    const converter = new DefaultXNodeToJsonConverter(this.config);
    return converter.convert(this.xnode!);
  }
  
  /**
   * Convert current XNode to JSON string with formatting
   * @param indent Number of spaces for indentation (default: 2)
   * @returns Formatted JSON string
   */
  public toJsonString(indent: number = 2): string {
    // Get JSON object
    const jsonObject = this.toJson();
    
    // Return as formatted string
    return JSON.stringify(jsonObject, null, indent);
  }
  
  /**
   * Convert current XNode to XML string
   * @returns XML string representation
   */
  public toXml(): string {
    // Validate source is set
    this.validateSource();
    
    // Apply transformations if any are registered
    if (this.transforms && this.transforms.length > 0) {
      const transformer = new DefaultXNodeTransformer(this.config);
      this.xnode = transformer.transform(
        this.xnode!, 
        this.transforms, 
        FORMATS.XML // Use format identifier instead of direction
      );
    }
    
    // Convert XNode to XML
    const converter = new DefaultXNodeToXmlConverter(this.config);
    return converter.convert(this.xnode!);
  }
  
  /**
   * Validate that a source has been set before transformation
   * @throws XJXError if no source has been set
   */
  public validateSource(): void {
    ErrorUtils.validate(
      !!this.xnode && !!this.direction,
      'No source set: call fromXml() or fromJson() before transformation',
      'general'
    );
  }
}