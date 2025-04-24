/**
 * XJX library tests
 */
import { XJX } from '../src/XJX';

describe('XJX', () => {
  let xjx: XJX;
  
  beforeEach(() => {
    // Create a fresh XJX instance before each test
    xjx = new XJX();
  });
  
  afterEach(() => {
    // Clean up after each test
    xjx.cleanup();
  });

  describe('xmlToJson', () => {
    it('should convert a simple XML string to JSON', () => {
      const xml = '<root><item>Test</item></root>';
      const result = xjx.xmlToJson(xml);
      
      expect(result).toHaveProperty('root');
      expect(result.root).toHaveProperty('$children');
      expect(result.root.$children[0]).toHaveProperty('item');
      expect(result.root.$children[0].item).toHaveProperty('$val', 'Test');
    });
    
    it('should handle XML attributes correctly', () => {
      const xml = '<root><item id="123">Test</item></root>';
      const result = xjx.xmlToJson(xml);
      
      expect(result.root.$children[0].item).toHaveProperty('$attr');
      expect(result.root.$children[0].item.$attr[0].id).toHaveProperty('$val', '123');
    });
    
    it('should handle namespaces correctly when enabled', () => {
      const xml = '<root xmlns:ns="http://example.org"><ns:item>Test</ns:item></root>';
      const result = xjx.xmlToJson(xml);
      
      expect(result.root).toHaveProperty('$ns');
      expect(result.root.$children[0]).toHaveProperty('item');
      expect(result.root.$children[0].item).toHaveProperty('$ns', 'http://example.org');
      expect(result.root.$children[0].item).toHaveProperty('$pre', 'ns');
    });
    
    it('should handle CDATA sections correctly', () => {
      const xml = '<root><item><![CDATA[<b>bold text</b>]]></item></root>';
      const result = xjx.xmlToJson(xml);
      
      expect(result.root.$children[0].item.$children[0]).toHaveProperty('$cdata', '<b>bold text</b>');
    });
    
    it('should handle comments correctly when enabled', () => {
      const xml = '<root><!-- This is a comment --><item>Test</item></root>';
      const result = xjx.xmlToJson(xml);
      
      expect(result.root.$children[0]).toHaveProperty('$cmnt', ' This is a comment ');
    });
  });
  
  describe('jsonToXml', () => {
    it('should convert a JSON object back to XML', () => {
      const json = {
        root: {
          $children: [
            {
              item: {
                $val: 'Test'
              }
            }
          ]
        }
      };
      
      const result = xjx.jsonToXml(json);
      expect(result).toContain('<root>');
      expect(result).toContain('<item>Test</item>');
      expect(result).toContain('</root>');
    });
    
    it('should include XML declaration when enabled', () => {
      const json = { root: { $val: 'Test' } };
      const result = xjx.jsonToXml(json);
      
      expect(result).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    });
    
    it('should handle attributes correctly', () => {
      const json = {
        root: {
          $children: [
            {
              item: {
                $attr: [
                  { id: { $val: '123' } }
                ],
                $val: 'Test'
              }
            }
          ]
        }
      };
      
      const result = xjx.jsonToXml(json);
      expect(result).toContain('<item id="123">Test</item>');
    });
  });
  
  describe('getPath', () => {
    it('should retrieve values using dot notation', () => {
      const json = {
        root: {
          $children: [
            {
              item: {
                $attr: [
                  { id: { $val: '123' } }
                ],
                $children: [
                  { name: { $val: 'Test Item' } }
                ]
              }
            }
          ]
        }
      };
      
      expect(xjx.getPath(json, 'root.$children.0.item.$children.0.name.$val')).toBe('Test Item');
      expect(xjx.getPath(json, 'root.$children.0.item.$attr.0.id.$val')).toBe('123');
    });
    
    it('should return fallback value when path does not exist', () => {
      const json = { root: { $val: 'Test' } };
      
      expect(xjx.getPath(json, 'root.item', 'Not Found')).toBe('Not Found');
    });
  });
  
  describe('prettyPrintXml', () => {
    it('should format XML with proper indentation', () => {
      const xml = '<root><item><name>Test</name><value>123</value></item></root>';
      const result = xjx.prettyPrintXml(xml);
      
      // Check for line breaks and indentation
      expect(result).toContain('\n');
      expect(result).toContain('  <item>');
      expect(result).toContain('    <name>');
    });
  });
  
  describe('validateXML', () => {
    it('should return true for valid XML', () => {
      const xml = '<root><item>Test</item></root>';
      const result = xjx.validateXML(xml);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
    
    it('should return false with error message for invalid XML', () => {
      const xml = '<root><item>Test</item';
      const result = xjx.validateXML(xml);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });
  });
});