/**
 * Tests for XMLUtil class
 */
import { XMLUtil } from '../../../../src/core/utils/XMLUtil';
import { DOMAdapter } from '../../../../src/core/DOMAdapter';
import { Configuration } from '../../../../src/core/types/types';
import { createTestConfig, cloneConfig } from '../../../utils/testConfig';

describe('XMLUtil', () => {
  let xmlUtil: XMLUtil;
  const testConfig: Configuration = createTestConfig();
  
  beforeEach(() => {
    // Create a fresh XMLUtil instance with a clone of our test config
    xmlUtil = new XMLUtil(cloneConfig(testConfig));
  });

  afterEach(() => {
    // Clean up DOM resources
    DOMAdapter.cleanup();
  });

  describe('prettyPrintXml', () => {
    it('should format XML with proper indentation', () => {
      const xml = '<root><item><name>Test</name><value>123</value></item></root>';
      const result = xmlUtil.prettyPrintXml(xml);
      
      expect(result).toContain('\n');
      expect(result).toContain('  <item>');
      expect(result).toContain('    <name>');
    });
    
    it('should handle XML with attributes', () => {
      const xml = '<root><item id="123" active="true"><name>Test</name></item></root>';
      const result = xmlUtil.prettyPrintXml(xml);
      
      expect(result).toContain('<item id="123" active="true">');
    });
    
    it('should handle empty elements correctly', () => {
      const xml = '<root><item/><empty></empty></root>';
      const result = xmlUtil.prettyPrintXml(xml);
      
      expect(result).toContain('<item />');
      expect(result).toContain('<empty />');
    });
    
    it('should respect custom indentation', () => {
      // Create a new XMLUtil instance with custom indentation
      const customConfig = cloneConfig(testConfig);
      customConfig.outputOptions.indent = 4;
      const customXmlUtil = new XMLUtil(customConfig);
      
      const xml = '<root><item><name>Test</name></item></root>';
      const result = customXmlUtil.prettyPrintXml(xml);
      
      expect(result).toContain('\n');
      expect(result).toContain('    <item>');
      expect(result).toContain('        <name>');
    });
  });
  
  describe('validateXML', () => {
    it('should return true for valid XML', () => {
      const xml = '<root><item>Test</item></root>';
      const result = xmlUtil.validateXML(xml);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
    
    it('should return false for XML with unclosed tags', () => {
      const xml = '<root><item>Test</root>';
      const result = xmlUtil.validateXML(xml);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });
    
    it('should return false for XML with malformed attributes', () => {
      const xml = '<root><item id=123>Test</item></root>';
      const result = xmlUtil.validateXML(xml);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });
    
    it('should return false for non-XML content', () => {
      const xml = 'This is not XML';
      const result = xmlUtil.validateXML(xml);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });
  });
  
  describe('ensureXMLDeclaration', () => {
    it('should add XML declaration if missing', () => {
      const xml = '<root><item>Test</item></root>';
      const result = xmlUtil.ensureXMLDeclaration(xml);
      
      expect(result).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(result).toContain('<root>');
    });
    
    it('should not add XML declaration if already present', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><root><item>Test</item></root>';
      const result = xmlUtil.ensureXMLDeclaration(xml);
      
      expect(result).toBe(xml);
    });
    
    it('should handle XML declaration with different attributes', () => {
      const xml = '<?xml version="1.1" standalone="yes"?><root><item>Test</item></root>';
      const result = xmlUtil.ensureXMLDeclaration(xml);
      
      expect(result).toBe(xml);
    });
  });
  
  describe('escapeXML & unescapeXML', () => {
    it('should escape special XML characters', () => {
      const input = '<tag attr="value">Text & More</tag>';
      const result = xmlUtil.escapeXML(input);
      
      expect(result).toBe('&lt;tag attr=&quot;value&quot;&gt;Text &amp; More&lt;/tag&gt;');
    });
    
    it('should unescape XML entities', () => {
      const input = '&lt;tag attr=&quot;value&quot;&gt;Text &amp; More&lt;/tag&gt;';
      const result = xmlUtil.unescapeXML(input);
      
      expect(result).toBe('<tag attr="value">Text & More</tag>');
    });
    
    it('should handle round-trip escape/unescape correctly', () => {
      const input = '<user>John & Jane</user>';
      const escaped = xmlUtil.escapeXML(input);
      const unescaped = xmlUtil.unescapeXML(escaped);
      
      expect(unescaped).toBe(input);
    });
  });
  
  describe('extractPrefix & extractLocalName', () => {
    it('should extract namespace prefix from qualified name', () => {
      expect(xmlUtil.extractPrefix('ns:element')).toBe('ns');
      expect(xmlUtil.extractPrefix('prefix:tag')).toBe('prefix');
    });
    
    it('should return null for names without prefix', () => {
      expect(xmlUtil.extractPrefix('element')).toBeNull();
      expect(xmlUtil.extractPrefix('tag')).toBeNull();
    });
    
    it('should extract local name from qualified name', () => {
      expect(xmlUtil.extractLocalName('ns:element')).toBe('element');
      expect(xmlUtil.extractLocalName('prefix:tag')).toBe('tag');
    });
    
    it('should return the name itself for names without prefix', () => {
      expect(xmlUtil.extractLocalName('element')).toBe('element');
      expect(xmlUtil.extractLocalName('tag')).toBe('tag');
    });
  });
  
  describe('createQualifiedName', () => {
    it('should create qualified name with prefix', () => {
      expect(xmlUtil.createQualifiedName('ns', 'element')).toBe('ns:element');
      expect(xmlUtil.createQualifiedName('prefix', 'tag')).toBe('prefix:tag');
    });
    
    it('should return only local name when prefix is null', () => {
      expect(xmlUtil.createQualifiedName(null, 'element')).toBe('element');
      expect(xmlUtil.createQualifiedName(null, 'tag')).toBe('tag');
    });
  });
});