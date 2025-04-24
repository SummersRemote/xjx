/**
 * Default configuration for the XJX library
 */
import { XMLToJSONConfig } from '../types/types';

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: XMLToJSONConfig = {
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
};