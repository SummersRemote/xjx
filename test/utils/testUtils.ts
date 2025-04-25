import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Configuration } from '../src/core/types/types';

// Get directory information for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * Load test fixture file
 * @param type - Type of fixture (xml|json)
 * @param name - Name of the fixture file without extension
 * @returns File contents as string (XML) or parsed object (JSON)
 */
export function loadFixture(type: 'xml' | 'json', name: string): string | Record<string, any> {
  const fixturePath = path.resolve(__dirname, '..', 'fixtures', type, `${name}.${type}`);

  try {
    const content = fs.readFileSync(fixturePath, 'utf8');
    
    // Parse JSON fixtures, return XML as string
    if (type === 'json') {
      return JSON.parse(content);
    }
    
    return content;
  } catch (error) {
    throw new Error(`Error loading fixture ${fixturePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Normalize XML string by removing whitespace between tags
 * @param xml - XML string
 * @returns Normalized XML string
 */
export function normalizeXML(xml: string): string {
  return xml
    .replace(/>\s+</g, '><')   // Remove whitespace between tags
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();                   // Trim leading/trailing whitespace
}