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
import { 
  logger, 
  validate, 
  ValidationError, 
  ParseError, 
  SerializeError, 
  ConfigurationError, 
  TransformError,
  handleError,
  ErrorType
} from './core/error';
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
    try {
      // Initialize using the new createOrUpdate method (creates default config)
      this.config = Config.createOrUpdate();
      logger.debug('Created new XjxBuilder instance');
    } catch (err) {
      throw handleError(err, "create builder instance", {
        errorType: ErrorType.CONFIGURATION
      });
    }
  }
  
  /**
   * Set XML source for transformation
   * @param source XML string
   * @returns This builder for chaining
   */
  public fromXml(source: string): XjxBuilder {
    try {
      // API boundary validation
      validate(typeof source === "string", "XML source must be a string");
      validate(source.trim().length > 0, "XML source cannot be empty");
      
      logger.debug('Setting XML source for transformation', {
        sourceLength: source.length
      });
      
      // Convert XML to XNode using the appropriate converter
      const converter = new DefaultXmlToXNodeConverter(this.config);
      
      try {
        this.xnode = converter.convert(source);
      } catch (conversionError) {
        // Specific error handling for XML conversion failures
        throw new ParseError("Failed to parse XML source", source);
      }
      
      this.sourceFormat = FORMATS.XML;
      
      logger.debug('Successfully set XML source', {
        rootNodeName: this.xnode?.name,
        rootNodeType: this.xnode?.type
      });
      
      return this;
    } catch (err) {
      return handleError(err, "set XML source", {
        data: { 
          sourceLength: source?.length 
        },
        errorType: ErrorType.PARSE,
        fallback: this // Return this for chaining
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
      // API boundary validation
      validate(source !== null && typeof source === 'object', "JSON source must be an object");
      validate(!Array.isArray(source), "JSON source cannot be an array");
      validate(Object.keys(source).length > 0, "JSON source cannot be empty");
      
      logger.debug('Setting JSON source for transformation', {
        rootKeys: Object.keys(source)
      });
      
      // Convert JSON to XNode using the appropriate converter
      const converter = new DefaultJsonToXNodeConverter(this.config);
      
      try {
        this.xnode = converter.convert(source);
      } catch (conversionError) {
        // Specific error handling for JSON conversion failures
        throw new ParseError("Failed to parse JSON source", source);
      }
      
      this.sourceFormat = FORMATS.JSON;
      
      logger.debug('Successfully set JSON source', {
        rootNodeName: this.xnode?.name,
        rootNodeType: this.xnode?.type
      });
      
      return this;
    } catch (err) {
      return handleError(err, "set JSON source", {
        data: { 
          sourceType: typeof source,
          isArray: Array.isArray(source),
          keys: Object.keys(source || {})
        },
        errorType: ErrorType.PARSE,
        fallback: this // Return this for chaining
      });
    }
  }
  
  /**
   * Set configuration options
   * @param config Partial configuration to merge with defaults
   * @returns This builder for chaining
   */
  public withConfig(config: Partial<Configuration>): XjxBuilder {
    try {
      // API boundary validation
      validate(config !== null && typeof config === 'object', "Configuration must be an object");
      
      // Skip if empty config object
      if (Object.keys(config).length === 0) {
        logger.debug('Empty configuration provided, skipping merge');
        return this;
      }
      
      // Validate configuration structure
      try {
        // Ensure config has required sections or can be merged properly
        if (config.propNames) {
          validate(typeof config.propNames === 'object', "propNames must be an object");
        }
        
        if (config.outputOptions) {
          validate(typeof config.outputOptions === 'object', "outputOptions must be an object");
        }
      } catch (validationErr) {
        throw new ConfigurationError("Invalid configuration structure", config);
      }
      
      logger.debug('Merging configuration', {
        configKeys: Object.keys(config)
      });
      
      // Merge with current config
      try {
        this.config = Config.merge(this.config, config);
      } catch (mergeError) {
        throw new ConfigurationError("Failed to merge configuration", config);
      }
      
      logger.debug('Successfully applied configuration', {
        preserveNamespaces: this.config.preserveNamespaces,
        prettyPrint: this.config.outputOptions?.prettyPrint
      });
      
      return this;
    } catch (err) {
      return handleError(err, "apply configuration", {
        data: { 
          configKeys: Object.keys(config || {})
        },
        errorType: ErrorType.CONFIGURATION,
        fallback: this // Return this for chaining
      });
    }
  }
  
  /**
   * Add transformers to the pipeline
   * @param transforms One or more transformers
   * @returns This builder for chaining
   */
  public withTransforms(...transforms: Transform[]): XjxBuilder {
    try {
      // API boundary validation
      validate(Array.isArray(transforms), "Transforms must be an array");
      
      // Skip if no transforms provided
      if (transforms.length === 0) {
        logger.debug('No transforms provided, skipping');
        return this;
      }
      
      logger.debug('Adding transforms to pipeline', {
        transformCount: transforms.length
      });
      
      // Validate each transform
      for (let i = 0; i < transforms.length; i++) {
        const transform = transforms[i];
        
        // Validate transform interface requirements
        validate(
          transform !== null && typeof transform === 'object',
          `Transform at index ${i} must be an object`
        );
        
        validate(
          Array.isArray(transform.targets) && transform.targets.length > 0,
          `Transform at index ${i} must have a targets array`
        );
        
        validate(
          typeof transform.transform === 'function',
          `Transform at index ${i} must have a transform method`
        );
        
        logger.debug('Validated transform', {
          index: i,
          targets: transform.targets
        });
      }
      
      // Add transforms to the pipeline
      this.transforms.push(...transforms);
      
      logger.debug('Successfully added transforms', {
        totalTransforms: this.transforms.length
      });
      
      return this;
    } catch (err) {
      return handleError(err, "add transforms", {
        data: { 
          transformCount: transforms?.length
        },
        errorType: ErrorType.TRANSFORM,
        fallback: this // Return this for chaining
      });
    }
  }
  
  /**
   * Convert current XNode to JSON object
   * @returns JSON object representation
   */
  public toJson(): Record<string, any> {
    try {
      // API boundary validation
      validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
      validate(this.sourceFormat !== null, "Source format must be set before conversion");
      
      logger.debug('Starting toJson conversion', {
        sourceFormat: this.sourceFormat,
        hasTransforms: this.transforms.length > 0
      });
      
      // First, validate source is set
      this.validateSource();
      
      // Apply transformations if any are registered
      let nodeToConvert = this.xnode!;
      
      if (this.transforms && this.transforms.length > 0) {
        const transformer = new DefaultXNodeTransformer(this.config);
        nodeToConvert = transformer.transform(
          nodeToConvert, 
          this.transforms, 
          FORMATS.JSON
        );
        
        logger.debug('Applied transforms to XNode', {
          transformCount: this.transforms.length,
          targetFormat: FORMATS.JSON
        });
      }
      
      // Convert XNode to JSON
      const converter = new DefaultXNodeToJsonConverter(this.config);
      const result = converter.convert(nodeToConvert);
      
      logger.debug('Successfully converted XNode to JSON', {
        resultKeys: Object.keys(result).length
      });
      
      return result;
    } catch (err) {
      return handleError(err, "convert to JSON", {
        data: { 
          sourceFormat: this.sourceFormat,
          transformCount: this.transforms?.length || 0,
          hasNode: this.xnode !== null
        },
        errorType: ErrorType.SERIALIZE,
        fallback: {} // Return empty object as fallback
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
      // API boundary validation
      validate(Number.isInteger(indent) && indent >= 0, "Indent must be a non-negative integer");
      validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
      validate(this.sourceFormat !== null, "Source format must be set before conversion");
      
      logger.debug('Starting toJsonString conversion', {
        sourceFormat: this.sourceFormat,
        hasTransforms: this.transforms.length > 0,
        indent
      });
      
      // Get JSON object
      const jsonObject = this.toJson();
      
      // Return as formatted string
      const result = JSON.stringify(jsonObject, null, indent);
      
      logger.debug('Successfully converted to JSON string', {
        resultLength: result.length
      });
      
      return result;
    } catch (err) {
      return handleError(err, "convert to JSON string", {
        data: { 
          sourceFormat: this.sourceFormat,
          transformCount: this.transforms?.length || 0,
          indent,
          hasNode: this.xnode !== null
        },
        errorType: ErrorType.SERIALIZE,
        fallback: "{}" // Return empty object JSON string as fallback
      });
    }
  }
  
  /**
   * Convert current XNode to XML string
   * @returns XML string representation
   */
  public toXml(): string {
    try {
      // API boundary validation
      validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
      validate(this.sourceFormat !== null, "Source format must be set before conversion");
      
      logger.debug('Starting toXml conversion', {
        sourceFormat: this.sourceFormat,
        hasTransforms: this.transforms.length > 0
      });
      
      // First, validate source is set
      this.validateSource();
      
      // Apply transformations if any are registered
      let nodeToConvert = this.xnode!;
      
      if (this.transforms && this.transforms.length > 0) {
        const transformer = new DefaultXNodeTransformer(this.config);
        nodeToConvert = transformer.transform(
          nodeToConvert, 
          this.transforms, 
          FORMATS.XML
        );
        
        logger.debug('Applied transforms to XNode', {
          transformCount: this.transforms.length,
          targetFormat: FORMATS.XML
        });
      }
      
      // Convert XNode to XML
      const converter = new DefaultXNodeToXmlConverter(this.config);
      const result = converter.convert(nodeToConvert);
      
      logger.debug('Successfully converted XNode to XML', {
        resultLength: result.length
      });
      
      return result;
    } catch (err) {
      return handleError(err, "convert to XML", {
        data: { 
          sourceFormat: this.sourceFormat,
          transformCount: this.transforms?.length || 0,
          hasNode: this.xnode !== null
        },
        errorType: ErrorType.SERIALIZE,
        fallback: "<root/>" // Return minimal XML as fallback
      });
    }
  }
  
  /**
   * Validate that a source has been set before transformation
   * @throws Error if no source has been set
   */
  public validateSource(): void {
    try {
      if (!this.xnode || !this.sourceFormat) {
        throw new ValidationError('No source set: call fromXml() or fromJson() before transformation');
      }
      logger.debug('Source validation passed', {
        sourceFormat: this.sourceFormat,
        rootNodeName: this.xnode.name
      });
    } catch (err) {
      handleError(err, "validate source", {
        data: { 
          hasNode: this.xnode !== null,
          sourceFormat: this.sourceFormat
        },
        errorType: ErrorType.VALIDATION
      });
    }
  }
  
  /**
   * Deep clone an object (utility method exposed for extension context)
   * @param obj Object to clone
   * @returns Deep clone of the object
   */
  public deepClone<T>(obj: T): T {
    try {
      return Common.deepClone(obj);
    } catch (err) {
      return handleError(err, "deep clone object", {
        data: { objectType: typeof obj },
        fallback: obj // Return original object as fallback
      });
    }
  }
  
  /**
   * Deep merge two objects (utility method exposed for extension context)
   * @param target Target object
   * @param source Source object to merge into target
   * @returns New object with merged properties
   */
  public deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    try {
      return Common.deepMerge(target, source);
    } catch (err) {
      return handleError(err, "deep merge objects", {
        data: { 
          targetType: typeof target,
          sourceType: typeof source
        },
        fallback: target // Return target object as fallback
      });
    }
  }
}