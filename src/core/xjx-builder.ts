/**
 * XJX Builder implementation - Fluent API for XML/JSON transformations
 */
import {
  Configuration,
  Transform,
  TransformDirection,
  TransformTarget,
  XNode
} from './types/transform-interfaces';
import { DEFAULT_CONFIG } from './config/config';
import { XmlToJsonProcessor } from './converters/xml-to-json-processor';
import { JsonToXmlProcessor } from './converters/json-to-xml-processor';
import { ConfigProvider } from './config/config-provider';
import { XJXError } from './types/error-types';

/**
 * Builder for XJX transformations
 */
export class XjxBuilder {
  private source: any;
  private sourceType: 'xml' | 'json' | null = null;
  public config: Configuration;
  private transforms: Transform[] = [];
  
  /**
   * Create a new builder instance
   */
  constructor() {
    // Initialize with default configuration
    const configProvider = ConfigProvider.getInstance();
    this.config = configProvider.getConfig();
  }
  
  /**
   * Set XML source for transformation
   * @param source XML string
   */
  fromXml(source: string): XjxBuilder {
    if (!source || typeof source !== 'string') {
      throw new XJXError('Invalid XML source: must be a non-empty string');
    }
    
    this.source = source;
    this.sourceType = 'xml';
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
    
    this.source = source;
    this.sourceType = 'json';
    return this;
  }
  
  /**
   * Set configuration options
   * @param config Partial configuration to merge with defaults
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
    
    if (this.sourceType === 'xml') {
      // XML to XML (identity with transformations)
      const processor = new XmlToJsonProcessor(this.config);
      const json = processor.process(this.source, this.getTransformsForDirection(TransformDirection.XML_TO_JSON));
      
      const jsonToXmlProcessor = new JsonToXmlProcessor(this.config);
      return jsonToXmlProcessor.process(json, this.getTransformsForDirection(TransformDirection.JSON_TO_XML));
    } else {
      // JSON to XML
      const processor = new JsonToXmlProcessor(this.config);
      return processor.process(this.source, this.getTransformsForDirection(TransformDirection.JSON_TO_XML));
    }
  }
  
  /**
   * Execute the transformation pipeline and return JSON
   */
  toJson(): Record<string, any> {
    this.validateSource();
    
    if (this.sourceType === 'json') {
      // JSON to JSON (identity with transformations)
      const processor = new JsonToXmlProcessor(this.config);
      const xml = processor.process(this.source, this.getTransformsForDirection(TransformDirection.JSON_TO_XML));
      
      const xmlToJsonProcessor = new XmlToJsonProcessor(this.config);
      return xmlToJsonProcessor.process(xml, this.getTransformsForDirection(TransformDirection.XML_TO_JSON));
    } else {
      // XML to JSON
      const processor = new XmlToJsonProcessor(this.config);
      return processor.process(this.source, this.getTransformsForDirection(TransformDirection.XML_TO_JSON));
    }
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
    if (!this.source || !this.sourceType) {
      throw new XJXError('No source set: call fromXml() or fromJson() before transformation');
    }
  }
  
  /**
   * Filter transforms based on direction
   * @private
   */
  private getTransformsForDirection(direction: TransformDirection): Transform[] {
    // In this implementation, we apply all transforms regardless of direction
    // A more sophisticated implementation could filter based on transform configuration
    return this.transforms;
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