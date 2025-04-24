/**
 * Default configuration for XMLToJSON
 */
import { XMLToJSONConfig } from './types';

/**
 * Default configuration for XMLToJSON
 */
export const DEFAULT_CONFIG: XMLToJSONConfig = {
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  preserveAttributes: true,  // Added new option with default true

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
    namespace: "@ns",
    prefix: "@prefix",
    attributes: "@attrs",
    value: "@val",
    cdata: "@cdata",
    comments: "@comments",
    processing: "@processing",
    children: "@children",
  },
};