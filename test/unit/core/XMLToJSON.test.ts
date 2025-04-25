/**
 * Tests for XMLToJSON class
 */
import { XMLToJSON } from '../../../src/core/XMLToJSON';
import { Configuration } from '../../../src/core/types/types';
import { createTestConfig, cloneConfig } from '../../utils/testConfig';

describe('XMLToJSON', () => {
  let xmlToJSON: XMLToJSON;
  const testConfig: Configuration = createTestConfig();
  
  beforeEach(() => {
    // Create a fresh XMLToJSON instance before each test with a clone of our test config
    xmlToJSON = new XMLToJSON(cloneConfig(testConfig));
  });

  describe('parse', () => {
    it('should convert a simple XML string to JSON', () => {
      const xml = '<root><item>Test</item></root>';
      const result = xmlToJSON.parse(xml);
      
      expect(result).toHaveProperty('root');
      expect(result.root).toHaveProperty(testConfig.propNames.children);
      expect(result.root[testConfig.propNames.children][0]).toHaveProperty('item');
      expect(result.root[testConfig.propNames.children][0].item).toHaveProperty(testConfig.propNames.value, 'Test');
    });
    
    it('should handle XML attributes', () => {
      const xml = '<root><item id="123" active="true">Test</item></root>';
      const result = xmlToJSON.parse(xml);
      
      expect(result.root[testConfig.propNames.children][0].item).toHaveProperty(testConfig.propNames.attributes);
      
      const attrs = result.root[testConfig.propNames.children][0].item[testConfig.propNames.attributes];
      const idAttr = attrs.find((attr: Record<string, any>) => attr.id);
      const activeAttr = attrs.find((attr: Record<string, any>) => attr.active);
      
      expect(idAttr.id[testConfig.propNames.value]).toBe('123');
      expect(activeAttr.active[testConfig.propNames.value]).toBe('true');
    });
    
    it('should handle namespaces when enabled', () => {
      const xml = '<root xmlns:ns="http://example.org"><ns:item>Test</ns:item></root>';
      const result = xmlToJSON.parse(xml);
      
      expect(result.root).toHaveProperty(testConfig.propNames.namespace);
      expect(result.root[testConfig.propNames.children][0].item).toHaveProperty(testConfig.propNames.namespace, 'http://example.org');
      expect(result.root[testConfig.propNames.children][0].item).toHaveProperty(testConfig.propNames.prefix, 'ns');
    });
    
    it('should handle CDATA sections', () => {
      const xml = '<root><item><![CDATA[<b>bold text</b>]]></item></root>';
      const result = xmlToJSON.parse(xml);
      
      expect(result.root[testConfig.propNames.children][0].item[testConfig.propNames.children][0]).toHaveProperty(
        testConfig.propNames.cdata, 
        '<b>bold text</b>'
      );
    });
    
    it('should handle comments when enabled', () => {
      const xml = '<root><!-- This is a comment --><item>Test</item></root>';
      const result = xmlToJSON.parse(xml);
      
      expect(result.root[testConfig.propNames.children][0]).toHaveProperty(
        testConfig.propNames.comments, 
        ' This is a comment '
      );
    });
    
    it('should handle processing instructions when enabled', () => {
      const xml = '<?xml version="1.0"?><root><?xml-stylesheet type="text/css" href="style.css"?><item>Test</item></root>';
      const result = xmlToJSON.parse(xml);
      
      const piElement = result.root[testConfig.propNames.children].find(
        (child: Record<string, any>) => child[testConfig.propNames.instruction]
      );
      
      expect(piElement).toBeDefined();
      expect(piElement[testConfig.propNames.instruction][testConfig.propNames.target]).toBe('xml-stylesheet');
      expect(piElement[testConfig.propNames.instruction][testConfig.propNames.value]).toBe('type="text/css" href="style.css"');
    });
    
    it('should handle nested elements', () => {
      const xml = '<root><parent><child>Child Text</child></parent></root>';
      const result = xmlToJSON.parse(xml);
      
      expect(result.root[testConfig.propNames.children][0].parent[testConfig.propNames.children][0].child)
        .toHaveProperty(testConfig.propNames.value, 'Child Text');
    });
    
    it('should handle empty elements', () => {
      const xml = '<root><empty></empty><self-closing/></root>';
      const result = xmlToJSON.parse(xml);
      
      const children = result.root[testConfig.propNames.children];
      const emptyElement = children.find((child: Record<string, any>) => child.empty);
      const selfClosingElement = children.find((child: Record<string, any>) => child['self-closing']);
      
      expect(emptyElement).toBeDefined();
      expect(selfClosingElement).toBeDefined();
    });
  });
  
  describe('configuration tests', () => {
    it('should not preserve namespaces when disabled', () => {
      const customConfig = cloneConfig(testConfig);
      customConfig.preserveNamespaces = false;
      const customXmlToJSON = new XMLToJSON(customConfig);
      
      const xml = '<root xmlns:ns="http://example.org"><ns:item>Test</ns:item></root>';
      const result = customXmlToJSON.parse(xml);
      
      expect(result.root).not.toHaveProperty(testConfig.propNames.namespace);
      expect(result.root[testConfig.propNames.children][0].item).not.toHaveProperty(testConfig.propNames.namespace);
      expect(result.root[testConfig.propNames.children][0].item).not.toHaveProperty(testConfig.propNames.prefix);
    });
    
    it('should not preserve comments when disabled', () => {
      const customConfig = cloneConfig(testConfig);
      customConfig.preserveComments = false;
      const customXmlToJSON = new XMLToJSON(customConfig);
      
      const xml = '<root><!-- This is a comment --><item>Test</item></root>';
      const result = customXmlToJSON.parse(xml);
      
      const hasComment = result.root[testConfig.propNames.children].some(
        (child: Record<string, any>) => child[testConfig.propNames.comments]
      );
      
      expect(hasComment).toBe(false);
    });
    
    it('should not preserve CDATA sections when disabled', () => {
      const customConfig = cloneConfig(testConfig);
      customConfig.preserveCDATA = false;
      const customXmlToJSON = new XMLToJSON(customConfig);
      
      const xml = '<root><item><![CDATA[<b>bold text</b>]]></item></root>';
      const result = customXmlToJSON.parse(xml);
      
      const hasCDATA = result.root[testConfig.propNames.children][0].item[testConfig.propNames.children]?.some(
        (child: Record<string, any>) => child[testConfig.propNames.cdata]
      );
      
      expect(hasCDATA).toBeFalsy();
    });
    
    it('should use custom property names when configured', () => {
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
      
      const customXmlToJSON = new XMLToJSON(customConfig);
      
      const xml = '<root><item id="123">Test</item></root>';
      const result = customXmlToJSON.parse(xml);
      
      expect(result.root).toHaveProperty('_children');
      expect(result.root._children[0].item).toHaveProperty('_attrs');
      expect(result.root._children[0].item).toHaveProperty('_val', 'Test');
      expect(result.root._children[0].item._attrs[0].id).toHaveProperty('_val', '123');
    });
  });
});