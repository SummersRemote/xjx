/**
 * Configuration system for the XJX library
 */
import { deepClone, deepMerge } from "./common";
import { logger } from "./error";

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
        attributeHandling: 'ignore' | 'merge' | 'prefix' | 'property';
        attributePrefix: string;
        attributePropertyName: string;
        textPropertyName: string;
        alwaysCreateArrays: boolean;
        preserveMixedContent: boolean;
        emptyElementsAsNull: boolean;
      };
      naming: {
        arrayItem: string;
      };
    };
    
    // XJX JSON converter settings
    xjxJson: {
      options: {
        compact: boolean;
      };
      naming: {
        namespace: string;
        prefix: string;
        attribute: string;
        value: string;
        cdata: string;
        comment: string;
        processingInstr: string;
        target: string;
        children: string;
      };
    };
    
    // XML converter settings
    xml: {
      options: {
        declaration: boolean;
        prettyPrint: boolean;
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
 * Get a fresh copy of the default configuration
 * @returns A fresh copy of the default configuration
 */
export function getDefaultConfig(): Configuration {
  return deepClone(DEFAULT_CONFIG);
}

/**
 * Merge configurations to create a new configuration
 * @param baseConfig Base configuration
 * @param overrideConfig Configuration to merge on top of base
 * @returns New merged configuration
 */
export function mergeConfig(
  baseConfig: Configuration,
  overrideConfig: Partial<Configuration> = {}
): Configuration {
  return deepMerge(baseConfig, overrideConfig);
}

/**
 * Create or update configuration with smart defaults
 * @param config Partial configuration to apply
 * @param baseConfig Optional base configuration (uses default if not provided)
 * @returns Complete valid configuration
 */
export function createConfig(
  config: Partial<Configuration> = {},
  baseConfig?: Configuration
): Configuration {
  // Use provided base or get default
  const base = baseConfig || getDefaultConfig();

  // Skip merge if empty config (optimization)
  if (!config || Object.keys(config).length === 0) {
    logger.debug("Empty configuration provided, skipping merge");
    return base;
  }

  // Merge and return
  const result = mergeConfig(base, config);

  logger.debug("Successfully created/updated configuration", {
    preserveNamespaces: result.preserveNamespaces,
    prettyPrint: result.converters.xml.options.prettyPrint,
  });

  return result;
}