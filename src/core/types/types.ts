/**
 * Type definitions for the XJX library
 */

/**
 * Configuration interface for the library
 */
export interface XMLToJSONConfig {
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
    json: Record<string, any>;
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
}

export default XMLToJSONConfig;