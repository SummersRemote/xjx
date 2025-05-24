import { createXmlToXNodeConverter } from '../converters/xml-to-xnode-converter';
import { XNode } from '../core/xnode';
import { NodeType } from '../core/dom';
import { createConfig, getDefaultConfig, Configuration } from '../core/config';

describe('XmlToXNodeConverter', () => {
  let defaultConfig: Configuration;
  
  beforeEach(() => {
    defaultConfig = getDefaultConfig();
  });

  it('should convert a simple XML string to an XNode', () => {
    const converter = createXmlToXNodeConverter(defaultConfig);
    const xml = '<root/>';
    const xnode = converter.convert(xml);

    expect(xnode).toBeDefined();
    expect(xnode.name).toBe('root');
    expect(xnode.type).toBe(NodeType.ELEMENT_NODE);
  });

  it('should convert attributes correctly', () => {
    const converter = createXmlToXNodeConverter(defaultConfig);
    const xml = '<root attr1="value1" attr2="value2"/>';
    const xnode = converter.convert(xml);

    expect(xnode.attributes).toBeDefined();
    expect(xnode.attributes!['attr1']).toBe('value1');
    expect(xnode.attributes!['attr2']).toBe('value2');
  });

  it('should handle text nodes correctly', () => {
    const converter = createXmlToXNodeConverter(defaultConfig);
    const xml = '<root>Hello World</root>';
    const xnode = converter.convert(xml);

    // Depending on the converter's implementation and config,
    // text might be a direct value or a child text node.
    // Based on `xml-to-xnode-converter.ts`'s `convertElementToXNode` and `processTextNode`,
    // for a single text node, it should be set as `xnode.value` if `preserveTextNodes` is true (default).
    expect(xnode.value).toBe('Hello World');
  });

  it('should handle text nodes as children if preserveTextNodes is true and there are other children', () => {
    const converter = createXmlToXNodeConverter(defaultConfig);
    const xml = '<root>text1<child/>text2</root>';
    const xnode = converter.convert(xml);

    expect(xnode.children).toBeDefined();
    expect(xnode.children!.length).toBe(3);
    expect(xnode.children![0].type).toBe(NodeType.TEXT_NODE);
    expect(xnode.children![0].value).toBe('text1');
    expect(xnode.children![1].name).toBe('child');
    expect(xnode.children![1].type).toBe(NodeType.ELEMENT_NODE);
    expect(xnode.children![2].type).toBe(NodeType.TEXT_NODE);
    expect(xnode.children![2].value).toBe('text2');
  });

  it('should handle nested elements', () => {
    const converter = createXmlToXNodeConverter(defaultConfig);
    const xml = '<root><parent><child>text</child></parent></root>';
    const xnode = converter.convert(xml);

    expect(xnode.name).toBe('root');
    expect(xnode.children).toBeDefined();
    expect(xnode.children!.length).toBe(1);

    const parent = xnode.children![0];
    expect(parent.name).toBe('parent');
    expect(parent.children).toBeDefined();
    expect(parent.children!.length).toBe(1);

    const child = parent.children![0];
    expect(child.name).toBe('child');
    expect(child.value).toBe('text');
  });

  describe('Comments', () => {
    it('should preserve comments if preserveComments is true (default)', () => {
      const converter = createXmlToXNodeConverter(defaultConfig); // defaultConfig.preserveComments is true
      const xml = '<root><!--This is a comment--><child/></root>';
      const xnode = converter.convert(xml);

      expect(xnode.children).toBeDefined();
      expect(xnode.children!.length).toBe(2);
      const commentNode = xnode.children![0];
      expect(commentNode.type).toBe(NodeType.COMMENT_NODE);
      expect(commentNode.value).toBe('This is a comment');
      const childNode = xnode.children![1];
      expect(childNode.name).toBe('child');
      expect(childNode.type).toBe(NodeType.ELEMENT_NODE);
    });

    it('should discard comments if preserveComments is false', () => {
      const config = createConfig({ preserveComments: false });
      const converter = createXmlToXNodeConverter(config);
      const xml = '<root><!--This is a comment--><child/></root>';
      const xnode = converter.convert(xml);

      expect(xnode.children).toBeDefined();
      expect(xnode.children!.length).toBe(1); // Only child element, comment discarded
      expect(xnode.children![0].name).toBe('child');
      expect(xnode.children![0].type).toBe(NodeType.ELEMENT_NODE);
    });
  });

  describe('Processing Instructions', () => {
    it('should preserve PIs if preserveProcessingInstr is true (default)', () => {
      const converter = createXmlToXNodeConverter(defaultConfig); // defaultConfig.preserveProcessingInstr is true
      const xml = '<root><?target data?><child/></root>';
      const xnode = converter.convert(xml);

      expect(xnode.children).toBeDefined();
      expect(xnode.children!.length).toBe(2);
      const piNode = xnode.children![0];
      expect(piNode.type).toBe(NodeType.PROCESSING_INSTRUCTION_NODE);
      expect(piNode.name).toBe('#pi'); // As per createProcessingInstructionNode
      expect(piNode.attributes).toBeDefined();
      expect(piNode.attributes!.target).toBe('target');
      expect(piNode.value).toBe('data');
      const childNode = xnode.children![1];
      expect(childNode.name).toBe('child');
      expect(childNode.type).toBe(NodeType.ELEMENT_NODE);
    });

    it('should discard PIs if preserveProcessingInstr is false', () => {
      const config = createConfig({ preserveProcessingInstr: false });
      const converter = createXmlToXNodeConverter(config);
      const xml = '<root><?target data?><child/></root>';
      const xnode = converter.convert(xml);

      expect(xnode.children).toBeDefined();
      expect(xnode.children!.length).toBe(1); // Only child element, PI discarded
      expect(xnode.children![0].name).toBe('child');
      expect(xnode.children![0].type).toBe(NodeType.ELEMENT_NODE);
    });
  });

  describe('Namespaces', () => {
    it('should handle default namespace if preserveNamespaces is true (default)', () => {
      const converter = createXmlToXNodeConverter(defaultConfig); // defaultConfig.preserveNamespaces is true
      const xml = '<root xmlns="http://example.com/ns"><child/></root>';
      const xnode = converter.convert(xml);

      expect(xnode.name).toBe('root');
      expect(xnode.namespace).toBe('http://example.com/ns');
      expect(xnode.namespaceDeclarations).toEqual({ '': 'http://example.com/ns' });
      expect(xnode.isDefaultNamespace).toBe(true);
      expect(xnode.children).toBeDefined();
      expect(xnode.children!.length).toBe(1);
      const child = xnode.children![0];
      expect(child.name).toBe('child');
      expect(child.namespace).toBe('http://example.com/ns'); // Inherits default namespace
    });

    it('should handle prefixed namespaces if preserveNamespaces is true (default)', () => {
      const converter = createXmlToXNodeConverter(defaultConfig);
      const xml = '<p:root xmlns:p="http://example.com/p"><p:child attr="val"/></p:root>';
      const xnode = converter.convert(xml);

      expect(xnode.name).toBe('root');
      expect(xnode.prefix).toBe('p');
      expect(xnode.namespace).toBe('http://example.com/p');
      expect(xnode.namespaceDeclarations).toEqual({ 'p': 'http://example.com/p' });
      expect(xnode.children).toBeDefined();
      expect(xnode.children!.length).toBe(1);
      const child = xnode.children![0];
      expect(child.name).toBe('child');
      expect(child.prefix).toBe('p');
      expect(child.namespace).toBe('http://example.com/p');
      expect(child.attributes).toEqual({ attr: 'val' }); // Attributes without prefix by default
    });

    it('should handle namespace declarations on child elements if preserveNamespaces is true', () => {
      const converter = createXmlToXNodeConverter(defaultConfig);
      const xml = '<root><child xmlns:c="http://example.com/c"><c:grandchild/></child></root>';
      const xnode = converter.convert(xml);

      expect(xnode.name).toBe('root');
      expect(xnode.children).toBeDefined();
      const child = xnode.children![0];
      expect(child.name).toBe('child');
      expect(child.namespaceDeclarations).toEqual({ 'c': 'http://example.com/c' });
      expect(child.children).toBeDefined();
      const grandchild = child.children![0];
      expect(grandchild.name).toBe('grandchild');
      expect(grandchild.prefix).toBe('c');
      expect(grandchild.namespace).toBe('http://example.com/c');
    });
    
    it('should handle attributes with prefixes correctly if preserveNamespaces and preservePrefixedNames are true', () => {
      const config = createConfig({ preserveNamespaces: true, preservePrefixedNames: true });
      const converter = createXmlToXNodeConverter(config);
      const xml = '<p:root xmlns:p="http://example.com/p" xmlns:a="http://example.com/a" a:attr="val" p:attr2="val2"/>';
      const xnode = converter.convert(xml);

      expect(xnode.name).toBe('p:root'); // preservePrefixedNames affects element names too
      expect(xnode.prefix).toBeUndefined(); // With preservePrefixedNames, prefix is part of the name
      expect(xnode.namespace).toBe('http://example.com/p');
      expect(xnode.attributes).toBeDefined();
      expect(xnode.attributes!['a:attr']).toBe('val');
      expect(xnode.attributes!['p:attr2']).toBe('val2');
    });


    it('should not include namespace info if preserveNamespaces is false', () => {
      const config = createConfig({ preserveNamespaces: false });
      const converter = createXmlToXNodeConverter(config);
      const xml = '<p:root xmlns:p="http://example.com/p" attr="val"><child/></p:root>';
      const xnode = converter.convert(xml);

      expect(xnode.name).toBe('root'); // Prefix is stripped
      expect(xnode.prefix).toBeUndefined();
      expect(xnode.namespace).toBeUndefined();
      expect(xnode.namespaceDeclarations).toBeUndefined();
      expect(xnode.attributes).toEqual({ attr: 'val' }); // xmlns attributes are skipped
      expect(xnode.children).toBeDefined();
      const child = xnode.children![0];
      expect(child.name).toBe('child');
      expect(child.prefix).toBeUndefined();
      expect(child.namespace).toBeUndefined();
    });
  });
});
