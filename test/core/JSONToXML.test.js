/**
 * Tests for JSONToXML class
 */
import { JSONToXML } from '../../src/core/JSONToXML';
import { XMLToJSON } from '../../src/core/XMLToJSON';
import { createTestConfig, cloneConfig } from '../utils/testConfig';
import { DOMAdapter } from '../../src/core/DOMAdapter';

describe('JSONToXML', () => {
  let jsonToXML;
  let xmlToJSON;
  const testConfig = createTestConfig();
  
  beforeEach(() => {
    // Create fresh instances before each test with a clone of our test config
    jsonToXML = new JSONToXML(cloneConfig(testConfig));
    xmlToJSON = new XMLToJSON(cloneConfig(testConfig));
  });
  
  afterEach(() => {
    // Clean up DOM resources
    DOMAdapter.cleanup();
  });

  describe('serialize', () => {
    it('should convert a simple JSON object to XML', () => {
      const json = {
        root: {
          [testConfig.propNames.children]: [
            {
              item: {
                [testConfig.propNames.value]: 'Test'
              }
            }
          ]
        }
      };
      
      const result = jsonToXML.serialize(json);
      
      expect(result).toContain('<root>');
      expect(result).toContain('<item>Test</item>');
      expect(result).toContain('</root>');
    });
    
    it('should include XML declaration when enabled', () => {
      const json = { root: { [testConfig.propNames.value]: 'Test' } };
      const result = jsonToXML.serialize(json);
      
      expect(result).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    });
    
    it('should handle attributes', () => {
      const json = {
        root: {
          [testConfig.propNames.children]: [
            {
              item: {
                [testConfig.propNames.attributes]: [
                  { id: { [testConfig.propNames.value]: '123' } }
                ],
                [testConfig.propNames.value]: 'Test'
              }
            }
          ]
        }
      };
      
      const result = jsonToXML.serialize(json);
      expect(result).toContain('<item id="123">Test</item>');
    });
    
    it('should handle namespaces when enabled', () => {
      const json = {
        root: {
          [testConfig.propNames.namespace]: 'http://example.org',
          [testConfig.propNames.children]: [
            {
              item: {
                [testConfig.propNames.namespace]: 'http://example.org',
                [testConfig.propNames.prefix]: 'ns',
                [testConfig.propNames.value]: 'Test'
              }
            }
          ]
        }
      };
      
      const result = jsonToXML.serialize(json);
      
      expect(result).toContain('xmlns="http://example.org"');
      expect(result).toContain('<ns:item');
    });
    
    it('should handle CDATA sections', () => {
      const json = {
        root: {
          [testConfig.propNames.children]: [
            {
              item: {
                [testConfig.propNames.children]: [
                  { [testConfig.propNames.cdata]: '<b>bold text</b>' }
                ]
              }
            }
          ]
        }
      };
      
      const result = jsonToXML.serialize(json);
      
      expect(result).toContain('<![CDATA[<b>bold text</b>]]>');
    });
    
    it('should handle comments when enabled', () => {
      const json = {
        root: {
          [testConfig.propNames.children]: [
            { [testConfig.propNames.comments]: ' This is a comment ' },
            {
              item: {
                [testConfig.propNames.value]: 'Test'
              }
            }
          ]
        }
      };
      
      const result = jsonToXML.serialize(json);
      
      expect(result).toContain('<!-- This is a comment -->');
    });
    
    it('should handle processing instructions when enabled', () => {
      const json = {
        root: {
          [testConfig.propNames.children]: [
            {
              [testConfig.propNames.instruction]: {
                [testConfig.propNames.target]: 'xml-stylesheet',
                [testConfig.propNames.value]: 'type="text/css" href="style.css"'
              }
            },
            {
              item: {
                [testConfig.propNames.value]: 'Test'
              }
            }
          ]
        }
      };
      
      const result = jsonToXML.serialize(json);
      
      expect(result).toContain('<?xml-stylesheet type="text/css" href="style.css"?>');
    });
    
    it('should handle nested elements', () => {
      const json = {
        root: {
          [testConfig.propNames.children]: [
            {
              parent: {
                [testConfig.propNames.children]: [
                  {
                    child: {
                      [testConfig.propNames.value]: 'Child Text'
                    }
                  }
                ]
              }
            }
          ]
        }
      };
      
      const result = jsonToXML.serialize(json);
      
      expect(result).toContain('<parent>');
      expect(result).toContain('<child>Child Text</child>');
      expect(result).toContain('</parent>');
    });
    
    it('should work with the XMLToJSON parser in a round-trip', () => {
      const originalXml = `
        <library>
          <book id="123" available="true">
            <title>The Great Gatsby</title>
            <author>F. Scott Fitzgerald</author>
            <year>1925</year>
            <!-- Classic American literature -->
            <![CDATA[Contains <markup> that should be preserved]]>
          </book>
        </library>
      `;
      
      // XML -> JSON -> XML round trip
      const json = xmlToJSON.parse(originalXml);
      const resultXml = jsonToXML.serialize(json);
      
      // The resulting XML should have the same structure and content
      expect(resultXml).toContain('<library>');
      expect(resultXml).toContain('<book id="123" available="true">');
      expect(resultXml).toContain('<title>The Great Gatsby</title>');
      expect(resultXml).toContain('<author>F. Scott Fitzgerald</author>');
      expect(resultXml).toContain('<year>1925</year>');
      expect(resultXml).toContain('<!-- Classic American literature -->');
      expect(resultXml).toContain('<![CDATA[Contains <markup> that should be preserved]]>');
    });
  });
  
  describe('configuration tests', () => {
    it('should not include XML declaration when disabled', () => {
      const customConfig = cloneConfig(testConfig);
      customConfig.outputOptions.xml.declaration = false;
      const customJsonToXML = new JSONToXML(customConfig);
      
      const json = { root: { [testConfig.propNames.value]: 'Test' } };
      const result = customJsonToXML.serialize(json);
      
      expect(result).not.toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    });
    
    it('should not format XML (pretty print) when disabled', () => {
      const customConfig = cloneConfig(testConfig);
      customConfig.outputOptions.prettyPrint = false;
      const customJsonToXML = new JSONToXML(customConfig);
      
      const json = {
        root: {
          [testConfig.propNames.children]: [
            {
              item: {
                [testConfig.propNames.children]: [
                  {
                    nested: {
                      [testConfig.propNames.value]: 'Test'
                    }
                  }
                ]
              }
            }
          ]
        }
      };
      
      const result = customJsonToXML.serialize(json);
      
      // The XML shouldn't contain formatting newlines and indentation
      expect(result.split('\n').length).toBe(1); // Only the XML declaration might be on its own line
      expect(result).not.toContain('  '); // No indentation
    });
    
    it('should not include namespaces when disabled', () => {
      const customConfig = cloneConfig(testConfig);
      customConfig.preserveNamespaces = false;
      const customJsonToXML = new JSONToXML(customConfig);
      
      const json = {
        root: {
          [testConfig.propNames.namespace]: 'http://example.org',
          [testConfig.propNames.children]: [
            {
              item: {
                [testConfig.propNames.namespace]: 'http://example.org',
                [testConfig.propNames.prefix]: 'ns',
                [testConfig.propNames.value]: 'Test'
              }
            }
          ]
        }
      };
      
      const result = customJsonToXML.serialize(json);
      
      // Namespaces should be ignored
      expect(result).not.toContain('xmlns="http://example.org"');
      expect(result).not.toContain('<ns:item');
    });
    
    it('should use custom property names when configured', () => {
      // Define custom property names
      const customConfig = cloneConfig(testConfig);
      customConfig.propNames = {
        namespace: "_ns",
        prefix: "_pre",
        attributes: "_attrs",
        value: "_val",
        cdata: "_cdata",
        comments: "_comment",
        instruction: "_pi",
        target: "_target",
        children: "_children"
      };
      
      const customJsonToXML = new JSONToXML(customConfig);
      
      const json = {
        root: {
          "_children": [
            {
              item: {
                "_attrs": [
                  { id: { "_val": "123" } }
                ],
                "_val": "Test"
              }
            }
          ]
        }
      };
      
      const result = customJsonToXML.serialize(json);
      
      expect(result).toContain('<item id="123">Test</item>');
    });
  });
});