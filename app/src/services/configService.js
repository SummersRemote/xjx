// services/ConfigService.js
import { LogLevel } from "../../../dist/esm/index.js";

/**
 * Service for managing XJX library configuration
 */
class ConfigService {
  /**
   * Get default configuration
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    // Create a default configuration that matches the updated structure
    return {
      // Preservation settings
      preserveNamespaces: true,
      preserveComments: true,
      preserveProcessingInstr: true,
      preserveCDATA: true,
      preserveTextNodes: true,
      preserveWhitespace: false,
      preserveAttributes: true,
      preservePrefixedNames: false,

      // High-level strategies - now grouped under strategies property
      strategies: {
        highFidelity: false,
        attributeStrategy: "merge",
        textStrategy: "direct",
        namespaceStrategy: "prefix",
        arrayStrategy: "multiple",
        emptyElementStrategy: "object",
        mixedContentStrategy: "preserve",
      },

      // Property names - using single 'value' property
      properties: {
        attribute: "$attr",
        value: "$val",
        namespace: "$ns",
        prefix: "$pre",
        cdata: "$cdata",
        comment: "$cmnt",
        processingInstr: "$pi",
        target: "$trgt",
        children: "$children",
      },

      // Prefix configurations
      prefixes: {
        attribute: "@",
        namespace: "xmlns:",
        comment: "#",
        cdata: "!",
        pi: "?",
      },

      // Array configurations
      arrays: {
        forceArrays: [],
        defaultItemName: "item",
        itemNames: {},
      },

      // Output formatting
      formatting: {
        indent: 2,
        declaration: true,
        pretty: true,
      },

      // Fragment root name for functional operations
      fragmentRoot: "results",
    };
  }

  /**
   * Get available transformers from the XJX library
   * @returns {Object} Available transformers
   */
  getAvailableTransformers() {
    return {
      BooleanTransform: "BooleanTransform",
      NumberTransform: "NumberTransform",
      RegexTransform: "RegexTransform",
    };
  }

  /**
   * Get default options for a transform type
   * @param {string} type - Transform type
   * @returns {Object} Default options
   */
  getDefaultOptions(type) {
    // Common transform options shared by all transform types
    const commonOptions = {
      values: true,
      attributes: true,
      intent: 'parse'
    };
    
    switch (type) {
      case 'BooleanTransform':
        return {
          ...commonOptions,
          // Parse mode options
          trueValues: ['true', 'yes', '1', 'on'],
          falseValues: ['false', 'no', '0', 'off'],
          ignoreCase: true,
          // Serialize mode options
          trueString: 'true',
          falseString: 'false'
        };
        
      case 'NumberTransform':
        return {
          ...commonOptions,
          // Parse mode options
          integers: true,
          decimals: true,
          scientific: true,
          decimalSeparator: '.',
          thousandsSeparator: ',',
          // Common options for both modes
          precision: undefined,
          // Serialize mode options
          format: undefined
        };
        
      case 'RegexTransform':
        return {
          ...commonOptions,
          pattern: '',
          replacement: '',
          attributeFilter: undefined
        };
        
      default:
        return commonOptions;
    }
  }
}

// Export as a singleton instance
export default new ConfigService();