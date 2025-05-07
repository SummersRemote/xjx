/**
 * XJX Builder implementation - Fluent API for XML/JSON transformations
 */
import {
  Configuration,
  Transform,
  TransformDirection,
  XNode
} from './types/transform-interfaces';
import { ConfigProvider } from './config/config-provider';
import { XJXError } from './types/error-types';
import { DefaultXmlToXNodeConverter } from './converters/xml-to-xnode-converter';
import { DefaultJsonToXNodeConverter } from './converters/json-to-xnode-converter';
import { DefaultXNodeToXmlConverter } from './converters/xnode-to-xml-converter';
import { DefaultXNodeToJsonConverter } from './converters/xnode-to-json-converter';
import { DefaultXNodeTransformer } from './converters/xnode-transformer';

/**
 * Builder for XJX transformations
 */
export class XjxBuilder {
  private xnode: XNode | null = null;
  private transforms: Transform[] = [];
  public config: Configuration;
  private configProvider: ConfigProvider;
  private direction: TransformDirection | null = null;
  
  /**
   * Create a new builder instance
   */
  constructor() {
    // Get the singleton config provider
    this.configProvider = ConfigProvider.getInstance();
    
    // Initialize with a deep clone of the global configuration
    this.config = this.deepClone(this.configProvider.getMutableConfig());
  }
  
  /**
   * Set XML source for transformation
   * @param source XML string
   */
  fromXml(source: string): XjxBuilder {
    if (!source || typeof source !== 'string') {
      throw new XJXError('Invalid XML source: must be a non-empty string');
    }
    
    // Convert XML to XNode
    const converter = new DefaultXmlToXNodeConverter(this.config);
    this.xnode = converter.convert(source);
    this.direction = TransformDirection.XML_TO_JSON;
    
    return this;
  }
  
  /**
   * Set JSON source for transformation
   * @param source JSON object
   */
  fromJson(source: Record<string, any>): XjxBuilder {
    if (!source || typeof source !== 'object') {
      throw new XJXError('Invalid JSON source: must be a non-empty object');
    }
    
    // Convert JSON to XNode
    const converter = new DefaultJsonToXNodeConverter(this.config);
    this.xnode = converter.convert(source);
    this.direction = TransformDirection.JSON_TO_XML;
    
    return this;
  }
  
  /**
   * Set configuration options
   * @param config Partial configuration to merge with current config
   */
  withConfig(config: Partial<Configuration>): XjxBuilder {
    if (!config || Object.keys(config).length === 0) {
      return this;
    }
    
    // Merge with current config
    this.config = this.deepMerge(this.config, config);
    return this;
  }
  
  /**
   * Reset this builder's configuration to match global configuration
   */
  resetToGlobalConfig(): XjxBuilder {
    this.config = this.deepClone(this.configProvider.getMutableConfig());
    return this;
  }
  
  /**
   * Make this builder's configuration the global default
   */
  makeConfigGlobal(): XjxBuilder {
    this.configProvider.setConfig(this.deepClone(this.config));
    return this;
  }
  
  /**
   * Add transformers to the pipeline
   * @param transforms One or more transformers
   */
  withTransforms(...transforms: Transform[]): XjxBuilder {
    if (!transforms || transforms.length === 0) {
      return this;
    }
    
    // Validate transforms
    for (const transform of transforms) {
      if (!transform || !transform.targets || !transform.transform) {
        throw new XJXError('Invalid transform: must implement the Transform interface');
      }
    }
    
    // Add transforms to the pipeline
    this.transforms.push(...transforms);
    return this;
  }
  
  /**
   * Execute the transformation pipeline and return XML
   */
  toXml(): string {
    this.validateSource();
    
    // Apply transformations if any are registered
    if (this.transforms.length > 0) {
      const transformer = new DefaultXNodeTransformer(this.config);
      this.xnode = transformer.transform(
        this.xnode!, 
        this.transforms, 
        this.direction === TransformDirection.XML_TO_JSON 
          ? TransformDirection.JSON_TO_XML 
          : TransformDirection.JSON_TO_XML
      );
    }
    
    // Convert XNode to XML
    const converter = new DefaultXNodeToXmlConverter(this.config);
    return converter.convert(this.xnode!);
  }
  
  /**
   * Execute the transformation pipeline and return JSON
   */
  toJson(): Record<string, any> {
    this.validateSource();
    
    // Apply transformations if any are registered
    if (this.transforms.length > 0) {
      const transformer = new DefaultXNodeTransformer(this.config);
      this.xnode = transformer.transform(
        this.xnode!, 
        this.transforms, 
        this.direction === TransformDirection.XML_TO_JSON 
          ? TransformDirection.XML_TO_JSON 
          : TransformDirection.XML_TO_JSON
      );
    }
    
    // Convert XNode to JSON
    const converter = new DefaultXNodeToJsonConverter(this.config);
    return converter.convert(this.xnode!);
  }
  
  /**
   * Execute the transformation pipeline and return JSON as a string
   */
  toJsonString(indent: number = 2): string {
    const result = this.toJson();
    return JSON.stringify(result, null, indent);
  }
  
  /**
   * Validate source before transformation
   * @private
   */
  private validateSource(): void {
    if (!this.xnode || !this.direction) {
      throw new XJXError('No source set: call fromXml() or fromJson() before transformation');
    }
  }
  
  /**
   * Deep merge two objects
   * @private
   */
  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    if (!source || typeof source !== 'object' || source === null) {
      return target;
    }

    if (!target || typeof target !== 'object' || target === null) {
      return source as T;
    }

    const result = this.deepClone(target);

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key as keyof Partial<T>];
      const targetValue = result[key as keyof T];

      // If both values are objects, recursively merge them
      if (
        sourceValue !== null &&
        targetValue !== null &&
        typeof sourceValue === 'object' &&
        typeof targetValue === 'object' &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue)
      ) {
        (result[key as keyof T] as any) = this.deepMerge(
          targetValue as Record<string, any>,
          sourceValue as Record<string, any>
        );
      } else {
        // Otherwise just replace the value
        (result[key as keyof T] as any) = sourceValue;
      }
    });

    return result;
  }
  
  /**
   * Deep clone an object
   * @private
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}