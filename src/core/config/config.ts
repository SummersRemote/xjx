/**
 * Default configuration for the XJX library
 */
import { Configuration } from "../types/config-types";

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Configuration = {
  // Features to preserve during transformation
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  preserveAttributes: true,

  // JSON output formatting options
  propNames: {
    attributesKey: "$", // Key for attributes container
    textKey: "_", // Key for text content when element has both attributes and text
    contentKey: "content", // Key for mixed content arrays
    cdataKey: "cdata", // Key for CDATA sections
    commentKey: "#comment", // Key for comments
    processingInstrKey: "?", // Prefix for processing instructions
  },

  // JSON structure options
  alwaysUseArrays: false, // Don't always use arrays by default, convert only when needed
  emptyElementValue: "", // Represent empty elements as empty strings
  whitespaceMode: "normalize", // Normalize whitespace by default
  
  // Context-sensitive format specific options
  commentMode: "preserve", // Preserve comments
  cdataAsText: false, // Keep CDATA as separate structure

  // Output options
  outputOptions: {
    prettyPrint: true,
    indent: 2,
    compact: true,
    json: {},
    xml: {
      declaration: true,
    },
  },
};