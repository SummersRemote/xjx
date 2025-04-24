/**
 * Tests for XMLUtil class
 */
import { XMLUtil } from '../../../src/core/XMLUtil';
import { DOMAdapter } from '../../../src/core/DOMAdapter';

describe('XMLUtil', () => {
  describe('prettyPrintXml', () => {
    it('should format XML with proper indentation', () => {
      const xml = '<root><item><name>Test</name><value>123</value></item></root>';
      const result = XMLUtil.prettyPrintXml(xml);
      
      expect(result).toContain('\n');
      expect(result).toContain('  <item>');
      expect(result).toContain('    <name>');
    });
    
    it('should handle XML with attributes', () => {
      const xml = '<root><item id="123" active="true"><name>Test</name></item></root>';
      const result = XMLUtil.prettyPrintXml(xml);
      
      expect(result).toContain('<item id="123" active="true">');
    });
    
    it('should handle empty elements correctly', () => {
      const xml = '<root><item/><empty></empty></root>';
      const result = XMLUtil.prettyPrintXml(xml);
      
      expect(result).toContain('<item />');
      expect(result).toContain('<empty>');
      expect(result).toContain('</empty>');
    });
    
    it('should respect custom indentation', () => {
      const xml = '<root><item><name>Test</name></item></root>';
      const result = XMLUtil.prettyPrintXml(xml, 4);
      
      expect(result).toContain('\n');
      expect(result).toContain('    <item>');
      expect(result).toContain('        <name>');
    });
  });
  
  describe('validateXML', () => {
    it('should return true for valid XML', () => {
      const xml = '<root><item>Test</item></root>';
      const result = XMLUtil.validateXML(xml);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
    
    it('should return false for XML with unclosed tags', () => {
      const xml = '<root><item>Test</root>';
      const result = XMLUtil.validateXML(xml);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });
    
    it('should return false for XML with malformed attributes', () => {
      const xml = '<root><item id=123>Test</item></root>';
      const result = XMLUtil.validateXML(xml);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });
    
    it('should return false for non-XML content', () => {
      const xml = 'This is not XML';
      const result = XMLUtil.validateXML(xml);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });
  });
  
  describe('ensureXMLDeclaration', () => {
    it('should add XML declaration if missing', () => {
      const xml = '<root><item>Test</item></root>';
      const result = XMLUtil.ensureXMLDeclaration(xml);
      
      expect(result).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(result).toContain('<root>');
    });
    
    it('should not add XML declaration if already present', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><root><item>Test</item></root>';
      const result = XMLUtil.ensureXMLDeclaration(xml);
      
      expect(result).toBe(xml);
    });
    
    it('should handle XML declaration with different attributes', () => {
      const xml = '<?xml version="1.1" standalone="yes"?><root><item>Test</item></root>';
      const result = XMLUtil.ensureXMLDeclaration(xml);
      
      expect(result).toBe(xml);
    });
  });
  
  describe('escapeXML & unescapeXML', () => {
    it('should escape special XML characters', () => {
      const input = '<tag attr="value">Text & More</tag>';
      const result = XMLUtil.escapeXML(input);
      
      expect(result).toBe('&lt;tag attr=&quot;value&quot;&gt;Text &amp; More&lt;/tag&gt;');
    });
    
    it('should unescape XML entities', () => {
      const input = '&lt;tag attr=&quot;value&quot;&gt;Text &amp; More&lt;/tag&gt;';
      const result = XMLUtil.unescapeXML(input);
      
      expect(result).toBe('<tag attr="value">Text & More</tag>');
    });
    
    it('should handle round-trip escape/unescape correctly', () => {
      const input = '<user>John & Jane</user>';
      const escaped = XMLUtil.escapeXML(input);
      const unescaped = XMLUtil.unescapeXML(escaped);
      
      expect(unescaped).toBe(input);
    });
  });
  
  describe('extractPrefix & extractLocalName', () => {
    it('should extract namespace prefix from qualified name', () => {
      expect(XMLUtil.extractPrefix('ns:element')).toBe('ns');
      expect(XMLUtil.extractPrefix('prefix:tag')).toBe('prefix');
    });
    
    it('should return null for names without prefix', () => {
      expect(XMLUtil.extractPrefix('element')).toBeNull();
      expect(XMLUtil.extractPrefix('tag')).toBeNull();
    });
    
    it('should extract local name from qualified name', () => {
      expect(XMLUtil.extractLocalName('ns:element')).toBe('element');
      expect(XMLUtil.extractLocalName('prefix:tag')).toBe('tag');
    });
    
    it('should return the name itself for names without prefix', () => {
      expect(XMLUtil.extractLocalName('element')).toBe('element');
      expect(XMLUtil.extractLocalName('tag')).toBe('tag');
    });
  });
  
  describe('createQualifiedName', () => {
    it('should create qualified name with prefix', () => {
      expect(XMLUtil.createQualifiedName('ns', 'element')).toBe('ns:element');
      expect(XMLUtil.createQualifiedName('prefix', 'tag')).toBe('prefix:tag');
    });
    
    it('should return only local name when prefix is null', () => {
      expect(XMLUtil.createQualifiedName(null, 'element')).toBe('element');
      expect(XMLUtil.createQualifiedName(null, 'tag')).toBe('tag');
    });
  });
});