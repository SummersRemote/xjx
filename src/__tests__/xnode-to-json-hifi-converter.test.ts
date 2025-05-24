import { createXNodeToJsonHiFiConverter } from '../converters/xnode-to-json-hifi-converter';
import { XNode, createElement, createTextNode, createCommentNode, createProcessingInstructionNode, createCDATANode, addChild, setAttribute } from '../core/xnode';
import { NodeType } from '../core/dom';
import { Configuration, getDefaultConfig, createConfig } from '../core/config';
import { JsonObject, JsonValue, JsonArray } from '../core/converter'; // For typing test inputs

// Helper to create XNodes easily for tests
const makeElement = (name: string, options?: {
  value?: any;
  attributes?: Record<string, any>;
  children?: XNode[];
  prefix?: string;
  namespace?: string;
  namespaceDeclarations?: Record<string, string>;
  isDefaultNamespace?: boolean;
  metadata?: Record<string, any>;
}): XNode => {
  const node = createElement(name);
  if (options?.value !== undefined) node.value = options.value;
  if (options?.attributes) node.attributes = options.attributes;
  if (options?.children) node.children = options.children;
  if (options?.prefix) node.prefix = options.prefix;
  if (options?.namespace) node.namespace = options.namespace;
  if (options?.namespaceDeclarations) node.namespaceDeclarations = options.namespaceDeclarations;
  if (options?.isDefaultNamespace) node.isDefaultNamespace = options.isDefaultNamespace;
  if (options?.metadata) node.metadata = options.metadata;
  return node;
};

describe('XNodeToJsonHiFiConverter', () => {
  let defaultConfig: Configuration;
  let naming: Configuration['properties'];
  
  beforeEach(() => {
    defaultConfig = getDefaultConfig();
    naming = defaultConfig.properties;
  });

  it('should convert a basic element with a text value', () => {
    const converter = createXNodeToJsonHiFiConverter(defaultConfig);
    const node = makeElement('root', { value: "simple text" });
    
    const expectedJson: JsonObject = {
      "root": {
        [naming.value]: "simple text"
      }
    };
    const result = converter.convert(node);
    expect(result).toEqual(expectedJson);
  });

  describe('Attributes', () => {
    it('should convert attributes to $attr array with $val for values', () => {
      const converter = createXNodeToJsonHiFiConverter(defaultConfig);
      const node = makeElement('root', { attributes: { "attr1": "value1", "attr2": "value2" } });
      
      const expectedJson: JsonObject = {
        "root": {
          [naming.attribute]: [
            { "attr1": { [naming.value]: "value1" } },
            { "attr2": { [naming.value]: "value2" } }
          ]
        }
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should handle namespaced attributes correctly, respecting preservePrefixedNames for the key in $attr', () => {
      // preservePrefixedNames: true -> key in $attr is "p:name"
      // preservePrefixedNames: false -> key in $attr is "name", with "$prefix" property
      
      // Test case 1: preservePrefixedNames = true
      let config = createConfig({ preservePrefixedNames: true });
      let converter = createXNodeToJsonHiFiConverter(config);
      let node = makeElement('root', { attributes: { "ns:attr": "val" } });
      node.namespaceDeclarations = { "ns" : "http://example.com/ns"}; // Provide context for the prefix

      let expectedJson: JsonObject = {
        "root": {
          "namespaceDeclarations": { "ns" : "http://example.com/ns"},
          [naming.attribute]: [
            // With preservePrefixedNames: true, the key is "ns:attr"
            // The value object includes $val, $prefix, and $ns
            { "ns:attr": { [naming.value]: "val", [naming.prefix]: "ns", [naming.namespace]: "http://example.com/ns"} }
          ]
        }
      };
      let result = converter.convert(node);
      expect(result).toEqual(expectedJson);

      // Test case 2: preservePrefixedNames = false (default)
      config = createConfig({ preservePrefixedNames: false });
      converter = createXNodeToJsonHiFiConverter(config);
      node = makeElement('root', { attributes: { "ns:attr": "val" } });
      node.namespaceDeclarations = { "ns" : "http://example.com/ns"};


      expectedJson = {
        "root": {
          "namespaceDeclarations": { "ns" : "http://example.com/ns"},
          [naming.attribute]: [
            // With preservePrefixedNames: false, the key is "attr" (localName)
            // The value object includes $val, $prefix, and $ns
            { "attr": { [naming.value]: "val", [naming.prefix]: "ns", [naming.namespace]: "http://example.com/ns"} }
          ]
        }
      };
      result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });
  });

  describe('Compact Option (via emptyElementStrategy: "remove")', () => {
    it('should produce standard output with default emptyElementStrategy ("object")', () => {
      const converter = createXNodeToJsonHiFiConverter(defaultConfig); // default is 'object'
      const emptyChild = makeElement('emptyChild');
      const node = makeElement('root', { children: [emptyChild, makeElement('sibling', {value: 'text'})] });
      
      const expectedJson: JsonObject = {
        "root": {
          [naming.children]: [
            { "emptyChild": {} }, // Empty object for emptyChild
            { "sibling": { [naming.value]: "text" } }
          ]
        }
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should produce compact output when emptyElementStrategy is "remove"', () => {
      const config = createConfig({ strategies: { emptyElementStrategy: 'remove' } });
      const converter = createXNodeToJsonHiFiConverter(config);
      const emptyChild = makeElement('emptyChild'); // This child will be removed
      const textChild = createTextNode(" "); // Whitespace-only text node, should also be removed if it results in empty $val object.
                                            // However, processSpecialNode for text creates {$val: " "}, which is not empty by removeEmptyElements.
                                            // Let's test an empty element.
      const anotherEmpty = makeElement('anotherEmpty');
      const node = makeElement('root', { children: [emptyChild, anotherEmpty, makeElement('sibling', {value: 'text'})] });
      
      // emptyChild and anotherEmpty should be removed from the $children array.
      // If $children becomes empty, it might also be removed depending on removeEmptyElements.
      // If 'root' itself becomes empty (no $val, no $attr, no $children), it becomes {}.
      const expectedJson: JsonObject = {
        "root": {
          [naming.children]: [
            // emptyChild and anotherEmpty are removed
            { "sibling": { [naming.value]: "text" } }
          ]
        }
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);

      // Test with a root that becomes entirely empty
      const onlyEmptyChild = makeElement('root', { children: [makeElement('onlyChildThatIsEmpty')]});
      const resultOnlyEmpty = converter.convert(onlyEmptyChild);
      // { root: { $children: [ { onlyChildThatIsEmpty: {} } ] } } -> removeEmptyElements makes inner {} to undefined
      // then $children: [undefined] -> $children: [] -> $children removed. root: {}
      expect(resultOnlyEmpty).toEqual({ "root": {} });

      // Test root itself is empty and removed by the top-level call in createXNodeToJsonHiFiConverter
      const emptyRoot = makeElement('emptyRoot');
      const resultEmptyRoot = converter.convert(emptyRoot);
      expect(resultEmptyRoot).toEqual({}); // removeEmptyElements returns undefined, then factory returns {}
    });
  });

  it('should convert nested elements to $children array', () => {
    const converter = createXNodeToJsonHiFiConverter(defaultConfig);
    const child = makeElement('child', { value: "child text" });
    const parent = makeElement('parent', { children: [child] });
    const root = makeElement('root', { children: [parent] });

    const expectedJson: JsonObject = {
      "root": {
        [naming.children]: [
          { "parent": {
              [naming.children]: [
                { "child": { [naming.value]: "child text" } }
              ]
            }
          }
        ]
      }
    };
    const result = converter.convert(root);
    expect(result).toEqual(expectedJson);
  });

  it('should convert CDATA sections correctly', () => {
    const converter = createXNodeToJsonHiFiConverter(defaultConfig);
    const cdata = createCDATANode("<p>Hello & Welcome</p>");
    const root = makeElement('root', { children: [cdata] });

    const expectedJson: JsonObject = {
      "root": {
        [naming.children]: [
          { [naming.cdata]: "<p>Hello & Welcome</p>" }
        ]
      }
    };
    const result = converter.convert(root);
    expect(result).toEqual(expectedJson);
  });

  describe('Mixed Content', () => {
    it('should handle mixed content correctly in $children array', () => {
      const converter = createXNodeToJsonHiFiConverter(defaultConfig);
      const text1 = createTextNode("text before ");
      const elem = makeElement('child', { value: "element text" });
      const comment = createCommentNode("a comment");
      const text2 = createTextNode(" text after");
      const root = makeElement('root', { children: [text1, elem, comment, text2] });

      const expectedJson: JsonObject = {
        "root": {
          [naming.children]: [
            { [naming.value]: "text before " },
            { "child": { [naming.value]: "element text" } },
            { [naming.comment]: "a comment" },
            { [naming.value]: " text after" }
          ]
        }
      };
      const result = converter.convert(root);
      expect(result).toEqual(expectedJson);
    });
  });

  it('should convert processing instruction nodes correctly', () => {
    const converter = createXNodeToJsonHiFiConverter(defaultConfig);
    const pi = createProcessingInstructionNode("xml-stylesheet", "href='style.css'");
    const root = makeElement('root', { children: [pi] });

    const expectedJson: JsonObject = {
      "root": {
        [naming.children]: [
          { [naming.processingInstr]: { 
              [naming.target]: "xml-stylesheet",
              [naming.value]: "href='style.css'" 
            } 
          }
        ]
      }
    };
    const result = converter.convert(root);
    expect(result).toEqual(expectedJson);
  });

  describe('Namespaces', () => {
    it('should handle default namespace declaration', () => {
      const converter = createXNodeToJsonHiFiConverter(defaultConfig);
      const nsUri = "http://example.com/default";
      const node = makeElement('root', { 
        namespace: nsUri, 
        namespaceDeclarations: { "": nsUri },
        isDefaultNamespace: true 
      });

      const expectedJson: JsonObject = {
        "root": {
          [naming.namespace]: nsUri,
          "namespaceDeclarations": { "": nsUri },
          "isDefaultNamespace": true
        }
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should handle prefixed namespace declaration and usage', () => {
      const converter = createXNodeToJsonHiFiConverter(defaultConfig);
      const nsUri = "http://example.com/custom";
      const prefix = "custom";
      const node = makeElement('root', { 
        prefix: prefix,
        namespace: nsUri,
        namespaceDeclarations: { [prefix]: nsUri }
      });

      const expectedJson: JsonObject = {
        "root": {
          [naming.prefix]: prefix,
          [naming.namespace]: nsUri,
          "namespaceDeclarations": { [prefix]: nsUri }
        }
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });
    
    it('should represent prefixed element names correctly based on preservePrefixedNames', () => {
      // Test case 1: preservePrefixedNames = true
      let config = createConfig({ preservePrefixedNames: true });
      let converter = createXNodeToJsonHiFiConverter(config);
      let node = makeElement('Data', { prefix: 'ns1' });
      
      let expectedJson: JsonObject = { "ns1:Data": {} };
      let result = converter.convert(node);
      expect(result).toEqual(expectedJson);

      // Test case 2: preservePrefixedNames = false (default)
      config = createConfig({ preservePrefixedNames: false }); // is default
      converter = createXNodeToJsonHiFiConverter(config);
      node = makeElement('Data', { prefix: 'ns1' });
      
      // When preservePrefixedNames is false, the element name in JSON is "Data",
      // and the prefix is stored in the "$prefix" property.
      expectedJson = { "Data": { [naming.prefix]: "ns1" } };
      result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });
  });

  it('should convert comment nodes correctly', () => {
    const converter = createXNodeToJsonHiFiConverter(defaultConfig);
    const comment = createCommentNode("This is a comment");
    const root = makeElement('root', { children: [comment] });

    const expectedJson: JsonObject = {
      "root": {
        [naming.children]: [
          { [naming.comment]: "This is a comment" }
        ]
      }
    };
    const result = converter.convert(root);
    expect(result).toEqual(expectedJson);
  });

  // Test cases will be added here
});
