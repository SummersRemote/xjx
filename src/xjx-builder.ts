/**
 * XJX Builder implementation - Fluent API for XML/JSON transformations
 */
import {
  Configuration,
  Config
} from './core/config';
import {
  Transform,
  FormatId,
  FORMATS
} from './core/transform';
import { XNode } from './core/xnode';
import { catchAndRelease, ErrorType } from './core/error';
import { Common } from './core/common';
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
  public sourceFormat: FormatId | null = null;
  
  /**
   * Create a new builder instance
   */
  constructor() {
    // Initialize with a fresh copy of the default configuration
    this.config = Config.getDefault();
  }
  
  /**
   * Set XML source for transformation
   * @param source XML string
   * @returns This builder for chaining
   */
  public fromXml(source: string): XjxBuilder {
    try {
      if (!source || typeof source !== 'string') {
        throw new Error('Invalid XML source: must be a non-empty string');
      }
      
      // Convert XML to XNode using the appropriate converter
      const converter = new DefaultXmlToXNodeConverter(this.config);
      this.xnode = converter.convert(source);
      this.sourceFormat = FORMATS.XML;
      
      return this;
    } catch (error) {
      return catchAndRelease(error, 'Failed to set XML source', {
        errorType: ErrorType.PARSE
      });
    }
  }
  
  /**
   * Set JSON source for transformation
   * @param source JSON object
   * @returns This builder for chaining
   */
  public fromJson(source: Record<string, any>): XjxBuilder {
    try {
      if (!source || typeof source !== 'object' || Array.isArray(source)) {
        throw new Error('Invalid JSON source: must be a non-empty object');
      }
      
      // Convert JSON to XNode using the appropriate converter
      const converter = new DefaultJsonToXNodeConverter(this.config);
      this.xnode = converter.convert(source);
      this.sourceFormat = FORMATS.JSON;
      
      return this;
    } catch (error) {
      return catchAndRelease(error, 'Failed to set JSON source', {
        errorType: ErrorType.PARSE
      });
    }
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
    
    try {
      // Merge with current config
      this.config = Config.merge(this.config, config);
      return this;
    } catch (error) {
      return catchAndRelease(error, 'Failed to apply configuration', {
        errorType: ErrorType.CONFIG,
        defaultValue: this
      });
    }
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
    
    try {
      // Validate transforms
      for (const transform of transforms) {
        if (!transform || !transform.targets || !transform.transform) {
          throw new Error('Invalid transform: must implement the Transform interface');
        }
      }
      
      // Add transforms to the pipeline
      this.transforms.push(...transforms);
      return this;
    } catch (error) {
      return catchAndRelease(error, 'Failed to add transforms', {
        errorType: ErrorType.TRANSFORM,
        defaultValue: this
      });
    }
  }
  
  /**
   * Convert current XNode to JSON object
   * @returns JSON object representation
   */
  public toJson(): Record<string, any> {
    try {
      // Validate source is set
      this.validateSource();
      
      // Apply transformations if any are registered
      if (this.transforms && this.transforms.length > 0) {
        const transformer = new DefaultXNodeTransformer(this.config);
        this.xnode = transformer.transform(
          this.xnode!, 
          this.transforms, 
          FORMATS.JSON
        );
      }
      
      // Convert XNode to JSON
      const converter = new DefaultXNodeToJsonConverter(this.config);
      return converter.convert(this.xnode!);
    } catch (error) {
      return catchAndRelease(error, 'Failed to convert to JSON', {
        errorType: ErrorType.SERIALIZE,
        defaultValue: {}
      });
    }
  }
  
  /**
   * Convert current XNode to JSON string with formatting
   * @param indent Number of spaces for indentation (default: 2)
   * @returns Formatted JSON string
   */
  public toJsonString(indent: number = 2): string {
    try {
      // Get JSON object
      const jsonObject = this.toJson();
      
      // Return as formatted string
      return JSON.stringify(jsonObject, null, indent);
    } catch (error) {
      return catchAndRelease(error, 'Failed to convert to JSON string', {
        errorType: ErrorType.SERIALIZE,
        defaultValue: '{}'
      });
    }
  }
  
  /**
   * Convert current XNode to XML string
   * @returns XML string representation
   */
  public toXml(): string {
    try {
      // Validate source is set
      this.validateSource();
      
      // Apply transformations if any are registered
      if (this.transforms && this.transforms.length > 0) {
        const transformer = new DefaultXNodeTransformer(this.config);
        this.xnode = transformer.transform(
          this.xnode!, 
          this.transforms, 
          FORMATS.XML
        );
      }
      
      // Convert XNode to XML
      const converter = new DefaultXNodeToXmlConverter(this.config);
      return converter.convert(this.xnode!);
    } catch (error) {
      return catchAndRelease(error, 'Failed to convert to XML', {
        errorType: ErrorType.SERIALIZE,
        defaultValue: '<root/>'
      });
    }
  }
  
  /**
   * Validate that a source has been set before transformation
   * @throws Error if no source has been set
   */
  public validateSource(): void {
    if (!this.xnode || !this.sourceFormat) {
      throw new Error('No source set: call fromXml() or fromJson() before transformation');
    }
  }
  
  /**
   * Deep clone an object (utility method exposed for extension context)
   * @param obj Object to clone
   * @returns Deep clone of the object
   */
  public deepClone<T>(obj: T): T {
    return Common.deepClone(obj);
  }
  
  /**
   * Deep merge two objects (utility method exposed for extension context)
   * @param target Target object
   * @param source Source object to merge into target
   * @returns New object with merged properties
   */
  public deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    return Common.deepMerge(target, source);
  }
}