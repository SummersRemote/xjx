import { createXNodeToXmlStringConverter } from '../converters/xnode-to-xml-converter';
import { XNode, createElement, createTextNode, createCommentNode, createProcessingInstructionNode } from '../core/xnode';
import { NodeType } from '../core/dom';
import { createConfig, getDefaultConfig, Configuration } from '../core/config';
import { XmlSerializationOptions } from '../converters/xnode-to-xml-converter';

const normalizeXml = (xmlString: string): string => {
  return xmlString
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('');
};

const normalizeXmlForPrettyPrint = (xmlString: string): string => {
  return xmlString
    .split('\n')
    .map(line => line.replace(/^\s+/gm, m => ' '.repeat(m.length))) 
    .join('\n')
    .trim();
};


describe('XNodeToXmlConverter (string output)', () => {
  let defaultConfig: Configuration;
  
  beforeEach(() => {
    defaultConfig = getDefaultConfig();
  });

  it('should convert a simple XNode to an XML string', () => {
    const converter = createXNodeToXmlStringConverter(defaultConfig);
    const node: XNode = { name: 'root', type: NodeType.ELEMENT_NODE };
    const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root/>';
    const result = converter.convert(node);
    expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
  });

  it('should convert XNode with attributes to XML string', () => {
    const converter = createXNodeToXmlStringConverter(defaultConfig);
    const node: XNode = {
      name: 'root',
      type: NodeType.ELEMENT_NODE,
      attributes: { attr1: 'value1', attr2: 'value2' },
    };
    const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root attr1="value1" attr2="value2"/>';
    const result = converter.convert(node);
    expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
  });

  it('should handle text node content (as value)', () => {
    const converter = createXNodeToXmlStringConverter(defaultConfig);
    const node: XNode = {
      name: 'root',
      type: NodeType.ELEMENT_NODE,
      value: 'Hello World',
    };
    const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  Hello World\n</root>';
    const result = converter.convert(node);
    expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
  });

  it('should handle text node content (as child XNode)', () => {
    const converter = createXNodeToXmlStringConverter(defaultConfig);
    const node: XNode = {
      name: 'root',
      type: NodeType.ELEMENT_NODE,
      children: [
        { name: '#text', type: NodeType.TEXT_NODE, value: 'Hello World' }
      ],
    };
    const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  Hello World\n</root>';
    const result = converter.convert(node);
    expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
  });

  it('should handle nested elements', () => {
    const converter = createXNodeToXmlStringConverter(defaultConfig);
    const node: XNode = {
      name: 'root',
      type: NodeType.ELEMENT_NODE,
      children: [
        {
          name: 'parent',
          type: NodeType.ELEMENT_NODE,
          children: [
            { name: 'child', type: NodeType.ELEMENT_NODE, value: 'text' }
          ],
        },
      ],
    };
    const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <parent>\n    <child>\n      text\n    </child>\n  </parent>\n</root>';
    const result = converter.convert(node);
    expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
  });

  it('should handle comments', () => {
    const converter = createXNodeToXmlStringConverter(defaultConfig);
    const node: XNode = {
      name: 'root',
      type: NodeType.ELEMENT_NODE,
      children: [
        createCommentNode('This is a comment'),
        { name: 'child', type: NodeType.ELEMENT_NODE }
      ],
    };
    const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <!--This is a comment-->\n  <child/>\n</root>';
    const result = converter.convert(node);
    expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
  });

  it('should handle processing instructions', () => {
    const converter = createXNodeToXmlStringConverter(defaultConfig);
    const node: XNode = {
      name: 'root',
      type: NodeType.ELEMENT_NODE,
      children: [
        createProcessingInstructionNode('target', 'data'),
        { name: 'child', type: NodeType.ELEMENT_NODE }
      ],
    };
    const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <?target data?>\n  <child/>\n</root>';
    const result = converter.convert(node);
    expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
  });

  describe('Namespaces', () => {
    it('should handle default namespace', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = {
        name: 'root',
        type: NodeType.ELEMENT_NODE,
        namespace: 'http://example.com/ns',
        namespaceDeclarations: { '': 'http://example.com/ns' },
        children: [{ name: 'child', type: NodeType.ELEMENT_NODE, namespace: 'http://example.com/ns' }],
      };
      const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root xmlns="http://example.com/ns">\n  <child/>\n</root>';
      const result = converter.convert(node);
      expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
    });

    it('should handle prefixed namespace', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = {
        name: 'root',
        prefix: 'p',
        type: NodeType.ELEMENT_NODE,
        namespace: 'http://example.com/p',
        namespaceDeclarations: { 'p': 'http://example.com/p' },
        children: [
          { name: 'child', prefix: 'p', type: NodeType.ELEMENT_NODE, namespace: 'http://example.com/p' }
        ],
      };
      const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<p:root xmlns:p="http://example.com/p">\n  <p:child/>\n</p:root>';
      const result = converter.convert(node);
      expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
    });

    it('should handle attributes with namespaces', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = {
        name: 'root',
        type: NodeType.ELEMENT_NODE,
        namespaceDeclarations: { 'a': 'http://example.com/a' },
        attributes: { 'a:attr': 'value' },
      };
      const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root xmlns:a="http://example.com/a" a:attr="value"/>';
      const result = converter.convert(node);
      expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
    });
  });

  describe('XML Declaration', () => {
    it('should include XML declaration by default', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = { name: 'root', type: NodeType.ELEMENT_NODE };
      const result = converter.convert(node);
      expect(result.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    });

    it('should include XML declaration when options.declaration is true', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = { name: 'root', type: NodeType.ELEMENT_NODE };
      const result = converter.convert(node, { declaration: true });
      expect(result.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    });

    it('should omit XML declaration when options.declaration is false', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = { name: 'root', type: NodeType.ELEMENT_NODE };
      const result = converter.convert(node, { declaration: false });
      expect(result.startsWith('<?xml')).toBe(false);
      expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint('<root/>'));
    });
  });

  describe('Pretty Printing', () => {
    it('should output pretty-printed XML by default (pretty: true, indent: 2)', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = {
        name: 'root', type: NodeType.ELEMENT_NODE, children: [
          { name: 'child', type: NodeType.ELEMENT_NODE, value: 'text' }
        ]
      };
      const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <child>\n    text\n  </child>\n</root>';
      const result = converter.convert(node);
      expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
    });

    it('should output compact XML when options.prettyPrint is false', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = {
        name: 'root', type: NodeType.ELEMENT_NODE, children: [
          { name: 'child', type: NodeType.ELEMENT_NODE, value: 'text' }
        ]
      };
      const expectedXml = '<?xml version="1.0" encoding="UTF-8"?><root><child>text</child></root>';
      const result = converter.convert(node, { prettyPrint: false });
      expect(normalizeXml(result)).toBe(normalizeXml(expectedXml));
    });

    it('should use specified indent when options.prettyPrint is true and options.indent is set', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = {
        name: 'root', type: NodeType.ELEMENT_NODE, children: [
          { name: 'child', type: NodeType.ELEMENT_NODE, value: 'text' }
        ]
      };
      // const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n    <child>\n        text\n    </child>\n</root>';
      const result = converter.convert(node, { prettyPrint: true, indent: 4 });
      const lines = result.split('\n');
      expect(lines[1].startsWith('    <child>')).toBe(true); // Adjusted index due to declaration being on its own line
      expect(lines[2].startsWith('        text')).toBe(true); // Adjusted index
    });
  });

  describe('Self-closing and Empty Tags', () => {
    it('should serialize empty elements with no children or value as self-closing tags (pretty print)', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = { name: 'empty', type: NodeType.ELEMENT_NODE };
      const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<empty/>';
      const result = converter.convert(node);
      expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
    });

    it('should serialize empty elements with no children or value as self-closing tags (compact)', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = { name: 'empty', type: NodeType.ELEMENT_NODE };
      const expectedXml = '<?xml version="1.0" encoding="UTF-8"?><empty/>';
      const result = converter.convert(node, { prettyPrint: false });
      expect(normalizeXml(result)).toBe(normalizeXml(expectedXml));
    });

    it('should not self-close elements with children', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = { 
        name: 'parent', 
        type: NodeType.ELEMENT_NODE, 
        children: [ { name: 'child', type: NodeType.ELEMENT_NODE } ] 
      };
      const result = converter.convert(node, { prettyPrint: true });
      expect(result).not.toContain("<parent/>");
      expect(result).toContain("<parent>\n  <child/>\n</parent>");
    });
    
    it('should not self-close elements with a text value, even if whitespace', () => {
      const converter = createXNodeToXmlStringConverter(defaultConfig);
      const node: XNode = { name: 'tag', type: NodeType.ELEMENT_NODE, value: " " };
      const expectedXml = '<?xml version="1.0" encoding="UTF-8"?>\n<tag>\n   \n</tag>';
      const result = converter.convert(node, { prettyPrint: true });
      expect(normalizeXmlForPrettyPrint(result)).toBe(normalizeXmlForPrettyPrint(expectedXml));
      expect(result).not.toContain("<tag/>");
    });
  });
});
