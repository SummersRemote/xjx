import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * Load test fixture file
 * @param {string} type - Type of fixture (xml|json)
 * @param {string} name - Name of the fixture file without extension
 * @returns {string|Object} - File contents as string (XML) or parsed object (JSON)
 */
export function loadFixture(type, name) {
  const fixturePath = path.resolve(__dirname, '..', 'fixtures', type, `${name}.${type}`);

  try {
    const content = fs.readFileSync(fixturePath, 'utf8');
    
    // Parse JSON fixtures, return XML as string
    if (type === 'json') {
      return JSON.parse(content);
    }
    
    return content;
  } catch (error) {
    throw new Error(`Error loading fixture ${fixturePath}: ${error.message}`);
  }
}



/**
 * Normalize XML string by removing whitespace between tags
 * @param {string} xml - XML string
 * @returns {string} - Normalized XML string
 */
export function normalizeXML(xml) {
  return xml
    .replace(/>\s+</g, '><')   // Remove whitespace between tags
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();                   // Trim leading/trailing whitespace
}