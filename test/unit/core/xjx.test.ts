import { XJX } from '../../../src/core/XJX';
import { BooleanTransformer, NumberTransformer } from '../../../src/core/transformers';
import { normalizeXML } from '../../utils/testUtils';
import { XMLJSONNode } from '../../../src/core/types/json-types';

describe('XJX Core', () => {
  let xjx: XJX;

  beforeEach(() => {
    // Create a fresh XJX instance for each test
    xjx = new XJX();
  });

  afterEach(() => {
    // Clean up after each test
    xjx.cleanup();
  });

  describe('XML to JSON conversion', () => {
    it('should convert simple XML to JSON', () => {
      const xml = '<root><item>value</item></root>';
      const result = xjx.xmlToJson(xml);

      expect(result).toHaveProperty('root');
      expect(result.root).toHaveProperty('$children');
      expect(result.root.$children[0]).toHaveProperty('item');
      expect(result.root.$children[0].item).toHaveProperty('$val', 'value');
    });

    it('should handle XML attributes', () => {
      const xml = '<root><item id="123">value</item></root>';
      const result = xjx.xmlToJson(xml);

      expect(result.root.$children[0].item).toHaveProperty('$attr');
      expect(result.root.$children[0].item.$attr[0]).toHaveProperty('id');
      expect(result.root.$children[0].item.$attr[0].id).toHaveProperty('$val', '123');
    });

    it('should preserve CDATA sections', () => {
      const xml = '<root><item><![CDATA[<special>]]></item></root>';
      const result = xjx.xmlToJson(xml);

      expect(result.root.$children[0].item).toHaveProperty('$children');
      expect(result.root.$children[0].item.$children[0]).toHaveProperty('$cdata', '<special>');
    });

    it('should preserve comments', () => {
      const xml = '<root><!-- comment --><item>value</item></root>';
      const result = xjx.xmlToJson(xml);

      expect(result.root).toHaveProperty('$children');
      expect(result.root.$children[0]).toHaveProperty('$cmnt', ' comment ');
    });

    it('should handle namespaces correctly', () => {
      const xml = '<root xmlns:ns="http://example.com"><ns:item>value</ns:item></root>';
      const result = xjx.xmlToJson(xml);

      expect(result.root.$children[0]).toHaveProperty('item');
      expect(result.root.$children[0].item).toHaveProperty('$ns', 'http://example.com');
      expect(result.root.$children[0].item).toHaveProperty('$pre', 'ns');
    });
  });

  describe('JSON to XML conversion', () => {
    it('should convert simple JSON to XML', () => {
      const json = {
        root: {
          $children: [
            {
              item: {
                $val: 'value'
              }
            }
          ]
        }
      };

      const result = xjx.jsonToXml(json);
      const expected = '<root><item>value</item></root>';

      expect(normalizeXML(result)).toBe(normalizeXML(expected));
    });

    it('should handle attributes', () => {
      const json = {
        root: {
          $children: [
            {
              item: {
                $val: 'value',
                $attr: [
                  {
                    id: {
                      $val: '123'
                    }
                  }
                ]
              }
            }
          ]
        }
      };

      const result = xjx.jsonToXml(json);
      const expected = '<root><item id="123">value</item></root>';

      expect(normalizeXML(result)).toBe(normalizeXML(expected));
    });

    it('should generate CDATA sections', () => {
      const json = {
        root: {
          $children: [
            {
              item: {
                $children: [
                  {
                    $cdata: '<special>'
                  }
                ]
              }
            }
          ]
        }
      };

      const result = xjx.jsonToXml(json);
      const expected = '<root><item><![CDATA[<special>]]></item></root>';

      expect(normalizeXML(result)).toBe(normalizeXML(expected));
    });

    it('should generate comments', () => {
      const json = {
        root: {
          $children: [
            {
              $cmnt: ' comment '
            },
            {
              item: {
                $val: 'value'
              }
            }
          ]
        }
      };

      const result = xjx.jsonToXml(json);
      const expected = '<root><!-- comment --><item>value</item></root>';

      expect(normalizeXML(result)).toBe(normalizeXML(expected));
    });

    it('should handle namespaces correctly', () => {
      const json = {
        root: {
          $children: [
            {
              item: {
                $val: 'value',
                $ns: 'http://example.com',
                $pre: 'ns'
              }
            }
          ]
        }
      };

      const result = xjx.jsonToXml(json);
      
      // Should contain namespace prefix in tag name
      expect(result).toContain('<ns:item');
      expect(result).toContain('</ns:item>');
    });
  });


  describe('objectToXJX', () => {
    it('should convert plain objects to XJX format', () => {
      const obj = {
        name: 'John',
        age: 30,
        isActive: true
      };

      const result = xjx.objectToXJX(obj, 'person');

      // Check structure matches expected XJX format
      expect(result).toHaveProperty('person');
      expect(result.person).toHaveProperty('$children');
      expect(result.person.$children).toHaveLength(3);
      
      // Verify properties were converted correctly
      const children = result.person.$children;
      const nameObj = children.find((c: Record<string, any>) => Object.keys(c)[0] === 'name');
      const ageObj = children.find((c: Record<string, any>) => Object.keys(c)[0] === 'age');
      const isActiveObj = children.find((c: Record<string, any>) => Object.keys(c)[0] === 'isActive');
      
      expect(nameObj.name.$val).toBe('John');
      expect(ageObj.age.$val).toBe(30);
      expect(isActiveObj.isActive.$val).toBe(true);
    });
  });

  describe('Validation and formatting', () => {
    it('should validate XML correctly', () => {
      const validXml = '<root><item>value</item></root>';
      const invalidXml = '<root><item>value</missing-tag></root>';
      
      expect(xjx.validateXML(validXml).isValid).toBe(true);
      expect(xjx.validateXML(invalidXml).isValid).toBe(false);
    });

    it('should pretty print XML', () => {
      const xml = '<root><item>value</item></root>';
      const prettyXml = xjx.prettyPrintXml(xml);
      
      expect(prettyXml).toContain('\n');
      expect(prettyXml).toContain('  <item>');
    });
  });
});