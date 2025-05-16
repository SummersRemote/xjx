/**
 * Configuration system for the XJX library
 */
import { Common } from "./common";
import {
  logger,
  validate,
  ConfigurationError,
  handleError,
  ErrorType,
} from "./error";

/**
 * Configuration interface for the library
 */
export interface Configuration {
  // Features to preserve during transformation
  preserveNamespaces: boolean;
  preserveComments: boolean;
  preserveProcessingInstr: boolean;
  preserveCDATA: boolean;
  preserveTextNodes: boolean;
  preserveWhitespace: boolean;
  preserveAttributes: boolean;

  // Converters section with format-specific settings
  converters: {
    // Standard JSON converter settings
    stdJson: {
      options: {
        /**
         * How to handle XML attributes in the standard JSON output
         * - 'ignore': Discard all attributes (default)
         * - 'merge': Merge attributes with element content
         * - 'prefix': Add attributes with a prefix (e.g., '@name')
         * - 'property': Add attributes under a property (e.g., '_attrs')
         */
        attributeHandling: 'ignore' | 'merge' | 'prefix' | 'property';

        /**
         * Prefix to use for attributes if attributeHandling is 'prefix'
         * Default: '@'
         */
        attributePrefix: string;

        /**
         * Property name to use for attributes if attributeHandling is 'property'
         * Default: '_attrs'
         */
        attributePropertyName: string;

        /**
         * Property to use for element text content when there are also attributes or children
         * Default: '_text'
         */
        textPropertyName: string;

        /**
         * When true, elements with the same name are always grouped into arrays
         * When false, only create arrays when there are multiple elements with the same name
         * Default: false
         */
        alwaysCreateArrays: boolean;

        /**
         * When true, mixed content (elements with both text and child elements) 
         * preserves text nodes with a special property name
         * Default: true
         */
        preserveMixedContent: boolean;
        
        /**
         * When true, empty elements are converted to null
         * When false, empty elements become empty objects {}
         * Default: false
         */
        emptyElementsAsNull: boolean;
      };
      naming: {
        /**
         * Name to use for array items when converting from standard JSON to XML
         * Default: "item"
         */
        arrayItem: string;
      };
    };
    
    // XJX JSON converter settings
    xjxJson: {
      options: {
        /**
         * Compact mode: removes empty nodes and properties
         * Default: true
         */
        compact: boolean;
      };
      naming: {
        /**
         * Property name for namespace URI
         * Default: "$ns"
         */
        namespace: string;
        
        /**
         * Property name for namespace prefix
         * Default: "$pre"
         */
        prefix: string;
        
        /**
         * Property name for attributes collection
         * Default: "$attr"
         */
        attribute: string;
        
        /**
         * Property name for node value
         * Default: "$val"
         */
        value: string;
        
        /**
         * Property name for CDATA section content
         * Default: "$cdata"
         */
        cdata: string;
        
        /**
         * Property name for comment content
         * Default: "$cmnt"
         */
        comment: string;
        
        /**
         * Property name for processing instruction
         * Default: "$pi"
         */
        processingInstr: string;
        
        /**
         * Property name for processing instruction target
         * Default: "$trgt"
         */
        target: string;
        
        /**
         * Property name for child nodes collection
         * Default: "$children"
         */
        children: string;
      };
    };
    
    // XML converter settings
    xml: {
      options: {
        /**
         * Include XML declaration
         * Default: true
         */
        declaration: boolean;
        
        /**
         * Format output with indentation
         * Default: true
         */
        prettyPrint: boolean;
        
        /**
         * Number of spaces for indentation
         * Default: 2
         */
        indent: number;
      };
    };
  };
}

/**
 * Default configuration for the XJX library
 */
export const DEFAULT_CONFIG: Configuration = {
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  preserveAttributes: true,

  converters: {
    stdJson: {
      options: {
        attributeHandling: 'ignore',
        attributePrefix: '@',
        attributePropertyName: '_attrs',
        textPropertyName: '_text',
        alwaysCreateArrays: false,
        preserveMixedContent: true,
        emptyElementsAsNull: false
      },
      naming: {
        arrayItem: "item"
      }
    },
    xjxJson: {
      options: {
        compact: true
      },
      naming: {
        namespace: "$ns",
        prefix: "$pre",
        attribute: "$attr",
        value: "$val",
        cdata: "$cdata",
        comment: "$cmnt",
        processingInstr: "$pi",
        target: "$trgt",
        children: "$children"
      }
    },
    xml: {
      options: {
        declaration: true,
        prettyPrint: true,
        indent: 2
      }
    }
  }
};

/**
 * Configuration utilities for the XJX library
 */
export class Config {
  /**
   * Get a fresh copy of the default configuration
   * @returns A fresh copy of the default configuration
   */
  static getDefault(): Configuration {
    return Common.deepClone(DEFAULT_CONFIG);
  }

  /**
   * Merge configurations to create a new configuration
   * @param baseConfig Base configuration
   * @param overrideConfig Configuration to merge on top of base
   * @returns New merged configuration
   */
  static merge(
    baseConfig: Configuration,
    overrideConfig: Partial<Configuration> = {}
  ): Configuration {
    return Common.deepMerge(baseConfig, overrideConfig);
  }

  /**
   * Validate that a configuration has all required fields
   * @param config Configuration to validate
   * @returns True if configuration is valid
   */
  static isValid(config: any): boolean {
    // Simple existence check for required properties
    if (!config || typeof config !== "object") return false;

    // Check core properties
    const requiredProps = [
      "preserveNamespaces",
      "preserveComments",
      "preserveProcessingInstr",
      "preserveCDATA",
      "preserveTextNodes",
      "preserveWhitespace",
      "preserveAttributes",
      "converters"
    ];

    for (const prop of requiredProps) {
      if (config[prop] === undefined) return false;
    }

    // Check converters section
    if (!config.converters || typeof config.converters !== "object") return false;
    
    // Check required converters
    const requiredConverters = ["stdJson", "xjxJson", "xml"];
    for (const converter of requiredConverters) {
      if (!config.converters[converter]) return false;
    }

    // Check converter sections
    if (!this.validateStdJsonConfig(config.converters.stdJson)) return false;
    if (!this.validateXjxJsonConfig(config.converters.xjxJson)) return false;
    if (!this.validateXmlConfig(config.converters.xml)) return false;

    return true;
  }

  /**
   * Validate the stdJson converter configuration
   * @param config StdJson converter configuration
   * @returns True if configuration is valid
   * @private
   */
  private static validateStdJsonConfig(config: any): boolean {
    if (!config || typeof config !== "object") return false;
    if (!config.options || typeof config.options !== "object") return false;
    if (!config.naming || typeof config.naming !== "object") return false;
    
    // Check specific properties
    if (config.naming.arrayItem === undefined) return false;
    
    return true;
  }

  /**
   * Validate the xjxJson converter configuration
   * @param config XjxJson converter configuration
   * @returns True if configuration is valid
   * @private
   */
  private static validateXjxJsonConfig(config: any): boolean {
    if (!config || typeof config !== "object") return false;
    if (!config.options || typeof config.options !== "object") return false;
    if (!config.naming || typeof config.naming !== "object") return false;
    
    // Check naming properties
    const requiredNaming = [
      "namespace", "prefix", "attribute", "value",
      "cdata", "comment", "processingInstr", "target", "children"
    ];
    
    for (const prop of requiredNaming) {
      if (config.naming[prop] === undefined) return false;
    }
    
    return true;
  }

  /**
   * Validate the xml converter configuration
   * @param config Xml converter configuration
   * @returns True if configuration is valid
   * @private
   */
  private static validateXmlConfig(config: any): boolean {
    if (!config || typeof config !== "object") return false;
    if (!config.options || typeof config.options !== "object") return false;
    
    // Check options properties
    const requiredOptions = ["declaration", "prettyPrint", "indent"];
    for (const prop of requiredOptions) {
      if (config.options[prop] === undefined) return false;
    }
    
    return true;
  }

  /**
   * Get a value from configuration using dot notation path
   * @param config Configuration object
   * @param path Path to value (e.g., "converters.xml.options.indent")
   * @param defaultValue Default value if path doesn't exist
   * @returns Value at path or default value
   */
  static getValue<T>(
    config: Configuration,
    path: string,
    defaultValue?: T
  ): T | undefined {
    return Common.getPath(config, path, defaultValue);
  }

  /**
   * Create or update configuration with smart defaults
   * @param config Partial configuration to apply
   * @param baseConfig Optional base configuration (uses default if not provided)
   * @returns Complete valid configuration
   */
  static createOrUpdate(
    config: Partial<Configuration> = {},
    baseConfig?: Configuration
  ): Configuration {
    try {
      // VALIDATION: Check for valid input
      validate(
        config !== null && typeof config === "object",
        "Configuration must be an object"
      );

      // Use provided base or get default
      const base = baseConfig || Config.getDefault();

      // Skip merge if empty config (optimization)
      if (Object.keys(config).length === 0) {
        logger.debug("Empty configuration provided, skipping merge");
        return base;
      }

      // Validate configuration structure
      try {
        // Ensure converters section structure is valid if provided
        if (config.converters) {
          validate(
            typeof config.converters === "object",
            "converters must be an object"
          );
          
          if (config.converters.stdJson) {
            validate(
              typeof config.converters.stdJson === "object",
              "converters.stdJson must be an object"
            );
          }
          
          if (config.converters.xjxJson) {
            validate(
              typeof config.converters.xjxJson === "object",
              "converters.xjxJson must be an object"
            );
          }
          
          if (config.converters.xml) {
            validate(
              typeof config.converters.xml === "object",
              "converters.xml must be an object"
            );
          }
        }
      } catch (validationErr) {
        throw new ConfigurationError("Invalid configuration structure", config);
      }

      logger.debug("Merging configuration", {
        configKeys: Object.keys(config),
      });

      // Merge and return
      try {
        const result = Config.merge(base, config);

        logger.debug("Successfully created/updated configuration", {
          preserveNamespaces: result.preserveNamespaces,
          prettyPrint: result.converters.xml.options.prettyPrint,
        });

        return result;
      } catch (mergeError) {
        throw new ConfigurationError("Failed to merge configuration", config);
      }
    } catch (err) {
      return handleError(err, "create or update configuration", {
        data: {
          configKeys: Object.keys(config || {}),
        },
        errorType: ErrorType.CONFIGURATION,
        fallback: baseConfig || Config.getDefault(), // Return a valid config as fallback
      });
    }
  }
}