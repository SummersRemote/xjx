/**
 * Type definitions for the XJX library
 */

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

  // JSON output formatting options
  propNames: {
    attributesKey: string;    // Key for attributes (default: "$")
    textKey: string;          // Key for text content when element has both attributes and text (default: "_")
    contentKey: string;       // Key for mixed content arrays (default: "content")
    cdataKey: string;         // Key for CDATA sections (default: "cdata")
    commentKey: string;       // Key for comments (default: "#comment")
    processingInstrKey: string; // Key for processing instructions (default: "?")
  }
  
  // JSON structure options
  alwaysUseArrays: boolean;     // Whether to always use arrays for elements that could repeat
  emptyElementValue: string;    // Value for empty/self-closing elements
  whitespaceMode: "preserve" | "normalize" | "trim"; // How to handle whitespace
  
  // How to handle comments (specific to the context-sensitive format)
  commentMode: "preserve" | "omit";
  
  // Whether to convert CDATA sections to regular text
  cdataAsText: boolean;
  
  // Output options
  outputOptions: {
    prettyPrint: boolean;
    indent: number;
    compact: boolean;
    json: Record<string, any>;
    xml: {
      declaration: boolean;
    };
  };
}

export default Configuration;