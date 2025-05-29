// stores/configStore.js - Simplified configuration store
import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', {
  state: () => ({
    config: {
      // Preservation settings
      preserveNamespaces: true,
      preserveComments: true,
      preserveProcessingInstr: true,
      preserveCDATA: true,
      preserveTextNodes: true,
      preserveWhitespace: false,
      preserveAttributes: true,
      preservePrefixedNames: false,

      // High-level strategies
      strategies: {
        highFidelity: false,
        attributeStrategy: "merge",
        textStrategy: "direct",
        namespaceStrategy: "prefix",
        arrayStrategy: "multiple",
        emptyElementStrategy: "object",
        mixedContentStrategy: "preserve",
      },

      // Property names
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
    },
    
    logLevel: 'ERROR' // Default log level
  }),
  
  actions: {
    /**
     * Update configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
    },
    
    /**
     * Reset configuration to default
     */
    resetToDefault() {
      this.config = {
        // Preservation settings
        preserveNamespaces: true,
        preserveComments: true,
        preserveProcessingInstr: true,
        preserveCDATA: true,
        preserveTextNodes: true,
        preserveWhitespace: false,
        preserveAttributes: true,
        preservePrefixedNames: false,

        // High-level strategies
        strategies: {
          highFidelity: false,
          attributeStrategy: "merge",
          textStrategy: "direct",
          namespaceStrategy: "prefix",
          arrayStrategy: "multiple",
          emptyElementStrategy: "object",
          mixedContentStrategy: "preserve",
        },

        // Property names
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
    },

    /**
     * Update log level
     * @param {string} level - New log level ('debug', 'info', 'warn', 'error', 'none')
     */
    updateLogLevel(level) {
      this.logLevel = level;
      console.log(`XJX log level set to: ${level}`);
    },
    
    /**
     * Load a configuration preset
     * @param {Object} presetConfig - Preset configuration to load
     */
    loadPreset(presetConfig) {
      this.config = JSON.parse(JSON.stringify(presetConfig));
    }
  }
});