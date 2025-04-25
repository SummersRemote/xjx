/**
 * Standard test configuration for XJX library tests
 */
import { Configuration } from '../../src/core/types/types';

/**
 * Creates a standard test configuration to use across all tests
 * This ensures tests are not affected by changes to the default configuration
 */
export const createTestConfig = (): Configuration => {
  return {
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
};

/**
 * Deep clone an object - useful for ensuring test isolation
 */
export const cloneConfig = (config: Configuration): Configuration => {
  return JSON.parse(JSON.stringify(config));
};