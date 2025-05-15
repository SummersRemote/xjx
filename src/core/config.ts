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

  // Output options
  outputOptions: {
    prettyPrint: boolean;
    indent: number;
    compact: boolean;
    json: {};
    xml: {
      declaration: boolean;
    };
  };

  // Property names in the JSON representation
  propNames: {
    namespace: string;
    prefix: string;
    attributes: string;
    value: string;
    cdata: string;
    comments: string;
    instruction: string;
    target: string;
    children: string;
  };

// --- JSON Conversion Options ---
  
  /**
   * Name to use for array items when converting from standard JSON to XML
   * Default: "item"
   */
  arrayItemName?: string;
  
  /**
   * Default options for standard JSON conversion
   * These can be overridden when calling toStandardJson()
   */
  standardJsonDefaults?: {
    /**
     * How to handle XML attributes in the standard JSON output
     * - 'ignore': Discard all attributes (default)
     * - 'merge': Merge attributes with element content
     * - 'prefix': Add attributes with a prefix (e.g., '@name')
     * - 'property': Add attributes under a property (e.g., '_attrs')
     */
    attributeHandling?: 'ignore' | 'merge' | 'prefix' | 'property';

    /**
     * Prefix to use for attributes if attributeHandling is 'prefix'
     * Default: '@'
     */
    attributePrefix?: string;

    /**
     * Property name to use for attributes if attributeHandling is 'property'
     * Default: '_attrs'
     */
    attributePropertyName?: string;

    /**
     * Property to use for element text content when there are also attributes or children
     * Default: '_text'
     */
    textPropertyName?: string;

    /**
     * When true, elements with the same name are always grouped into arrays
     * When false, only create arrays when there are multiple elements with the same name
     * Default: false
     */
    alwaysCreateArrays?: boolean;

    /**
     * When true, mixed content (elements with both text and child elements) 
     * preserves text nodes with a special property name
     * Default: true
     */
    preserveMixedContent?: boolean;
    
    /**
     * When true, empty elements are converted to null
     * When false, empty elements become empty objects {}
     * Default: false
     */
    emptyElementsAsNull?: boolean;
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

  outputOptions: {
    prettyPrint: true,
    indent: 2,
    compact: true,
    json: {},
    xml: {
      declaration: true,
    },
  },

  propNames: {
    namespace: "$ns",
    prefix: "$pre",
    attributes: "$attr",
    value: "$val",
    cdata: "$cdata",
    comments: "$cmnt",
    instruction: "$pi",
    target: "$trgt",
    children: "$children",
  },

    // --- JSON Conversion Options ---
    arrayItemName: "item",
  
    standardJsonDefaults: {
      attributeHandling: 'ignore',
      attributePrefix: '@',
      attributePropertyName: '_attrs',
      textPropertyName: '_text',
      alwaysCreateArrays: false,
      preserveMixedContent: true,
      emptyElementsAsNull: false
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
   * Simple validation that ensures core properties exist
   * @param config Configuration to validate
   * @returns True if configuration is valid
   */
  static isValid(config: any): boolean {
    // Simple existence check for required properties
    if (!config || typeof config !== "object") return false;

    const requiredProps = [
      "preserveNamespaces",
      "preserveComments",
      "preserveProcessingInstr",
      "preserveCDATA",
      "preserveTextNodes",
      "preserveWhitespace",
      "preserveAttributes",
      "outputOptions",
      "propNames",
    ];

    for (const prop of requiredProps) {
      if (config[prop] === undefined) return false;
    }

    // Check for output options
    if (!config.outputOptions || typeof config.outputOptions !== "object")
      return false;
    if (
      !config.outputOptions.xml ||
      typeof config.outputOptions.xml !== "object"
    )
      return false;

    // Check for prop names
    if (!config.propNames || typeof config.propNames !== "object") return false;

    const requiredPropNames = [
      "namespace",
      "prefix",
      "attributes",
      "value",
      "cdata",
      "comments",
      "instruction",
      "target",
      "children",
    ];

    for (const prop of requiredPropNames) {
      if (!config.propNames[prop]) return false;
    }

    return true;
  }

  /**
   * Get a value from configuration using dot notation path
   * @param config Configuration object
   * @param path Path to value (e.g., "outputOptions.indent")
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
        // Ensure config has required sections or can be merged properly
        if (config.propNames) {
          validate(
            typeof config.propNames === "object",
            "propNames must be an object"
          );
        }

        if (config.outputOptions) {
          validate(
            typeof config.outputOptions === "object",
            "outputOptions must be an object"
          );
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
          prettyPrint: result.outputOptions?.prettyPrint,
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
