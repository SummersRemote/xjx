/**
 * Type definitions for XMLToJSON
 */

/**
 * Configuration interface for XMLToJSON
 */
export interface XMLToJSONConfig {
    // Features to preserve during transformation
    preserveNamespaces: boolean;
    preserveComments: boolean;
    preserveProcessingInstr: boolean;
    preserveCDATA: boolean;
    preserveTextNodes: boolean;
    preserveWhitespace: boolean;
  
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
      processing: string;
      children: string;
    };
  }
  
  export default XMLToJSONConfig;