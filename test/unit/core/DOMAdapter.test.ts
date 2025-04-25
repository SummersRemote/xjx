/**
 * Tests for DOMAdapter
 */
import { DOMAdapter } from '../../../src/core/DOMAdapter';
import { XMLToJSONError } from '../../../src/core/types/errors';
import { createTestConfig } from '../../utils/testUtils';

describe('DOMAdapter', () => {
  // We don't directly pass the config to DOMAdapter,
  // but creating it ensures consistent test environment
  const testConfig = createTestConfig();

  afterEach(() => {
    // Clean up after each test to prevent memory leaks
    DOMAdapter.cleanup();
  });

  describe('DOM methods', () => {
    it('should create a DOM parser', () => {
      const parser = DOMAdapter.createParser();
      expect(parser).toBeDefined();
      expect(typeof parser.parseFromString).toBe('function');
    });

    it('should create an XML serializer', () => {
      const serializer = DOMAdapter.createSerializer();
      expect(serializer).toBeDefined();
      expect(typeof serializer.serializeToString).toBe('function');
    });

    it('should parse XML strings', () => {
      const xml = '<root><item>Test</item></root>';
      const doc = DOMAdapter.parseFromString(xml);
      
      expect(doc.documentElement.nodeName).toBe('root');
      expect(doc.documentElement.childNodes.length).toBeGreaterThan(0);
    });

    it('should serialize DOM nodes to XML strings', () => {
      const xml = '<root><item>Test</item></root>';
      const doc = DOMAdapter.parseFromString(xml);
      const serialized = DOMAdapter.serializeToString(doc);
      
      // JSDOM serialization may add XML declaration and namespace
      expect(serialized).toContain('<root>');
      expect(serialized).toContain('<item>');
      expect(serialized).toContain('Test');
    });

    it('should create new documents', () => {
      const doc = DOMAdapter.createDocument();
      expect(doc.nodeType).toBe(DOMAdapter.nodeTypes.DOCUMENT_NODE);
    });

    it('should create elements', () => {
      const element = DOMAdapter.createElement('test');
      expect(element.nodeName).toBe('TEST');
      expect(element.nodeType).toBe(DOMAdapter.nodeTypes.ELEMENT_NODE);
    });

    it('should create elements with namespaces', () => {
      const nsURI = 'http://example.org';
      const element = DOMAdapter.createElementNS(nsURI, 'ns:test');
      
      expect(element.nodeName).toBe('ns:test');
      expect(element.namespaceURI).toBe(nsURI);
    });

    it('should create text nodes', () => {
      const text = DOMAdapter.createTextNode('Test content');
      
      expect(text.nodeType).toBe(DOMAdapter.nodeTypes.TEXT_NODE);
      expect(text.nodeValue).toBe('Test content');
    });

    it('should create CDATA sections', () => {
      const cdata = DOMAdapter.createCDATASection('<b>bold</b>');
      
      expect(cdata.nodeType).toBe(DOMAdapter.nodeTypes.CDATA_SECTION_NODE);
      expect(cdata.nodeValue).toBe('<b>bold</b>');
    });

    it('should create comments', () => {
      const comment = DOMAdapter.createComment('Test comment');
      
      expect(comment.nodeType).toBe(DOMAdapter.nodeTypes.COMMENT_NODE);
      expect(comment.nodeValue).toBe('Test comment');
    });

    it('should create processing instructions', () => {
      const pi = DOMAdapter.createProcessingInstruction('xml-stylesheet', 'href="style.css"');
      
      expect(pi.nodeType).toBe(DOMAdapter.nodeTypes.PROCESSING_INSTRUCTION_NODE);
      expect(pi.target).toBe('xml-stylesheet');
      expect(pi.data).toBe('href="style.css"');
    });
  });

  describe('Helper methods', () => {
    it('should set namespaced attributes', () => {
      const element = DOMAdapter.createElement('test');
      DOMAdapter.setNamespacedAttribute(
        element,
        'http://example.org',
        'ns:attr',
        'value'
      );
      
      expect(element.getAttributeNS('http://example.org', 'attr')).toBe('value');
    });

    it('should set regular attributes when namespace is null', () => {
      const element = DOMAdapter.createElement('test');
      DOMAdapter.setNamespacedAttribute(
        element,
        null,
        'attr',
        'value'
      );
      
      expect(element.getAttribute('attr')).toBe('value');
    });

    it('should detect DOM nodes', () => {
      const element = DOMAdapter.createElement('test');
      const text = DOMAdapter.createTextNode('Test');
      
      expect(DOMAdapter.isNode(element)).toBe(true);
      expect(DOMAdapter.isNode(text)).toBe(true);
      expect(DOMAdapter.isNode({})).toBe(false);
      expect(DOMAdapter.isNode('not a node')).toBe(false);
    });

    it('should get node type names', () => {
      expect(DOMAdapter.getNodeTypeName(DOMAdapter.nodeTypes.ELEMENT_NODE))
        .toBe('ELEMENT_NODE');
      expect(DOMAdapter.getNodeTypeName(DOMAdapter.nodeTypes.TEXT_NODE))
        .toBe('TEXT_NODE');
      expect(DOMAdapter.getNodeTypeName(DOMAdapter.nodeTypes.COMMENT_NODE))
        .toBe('COMMENT_NODE');
      expect(DOMAdapter.getNodeTypeName(999))
        .toBe('UNKNOWN_NODE_TYPE(999)');
    });

    it('should get all node attributes as an object', () => {
      const element = DOMAdapter.createElement('test');
      element.setAttribute('id', '123');
      element.setAttribute('class', 'test-class');
      
      const attrs = DOMAdapter.getNodeAttributes(element);
      
      expect(attrs).toEqual({
        id: '123',
        class: 'test-class'
      });
    });
  });
});