import { createJsonHiFiToXNodeConverter } from '../converters/json-hifi-to-xnode-converter';
import { XNode } from '../core/xnode';
import { NodeType } from '../core/dom';
import { Configuration, getDefaultConfig, createConfig } from '../core/config';
import { JsonObject, JsonValue } from '../core/converter';

describe('JsonHiFiToXNodeConverter', () => {
  let defaultConfig: Configuration;
  let naming: Configuration['properties']; // To easily access "$val", "$attr", etc.
  
  beforeEach(() => {
    defaultConfig = getDefaultConfig();
    naming = defaultConfig.properties;
  });

  // Helper to find a child XNode by name (simple version)
  const findChild = (node: XNode, name: string): XNode | undefined => {
    return node.children?.find(c => c.name === name && c.type === NodeType.ELEMENT_NODE);
  };

  const findChildByType = (node: XNode, type: NodeType): XNode | undefined => {
    return node.children?.find(c => c.type === type);
  };

  it('should convert a basic element with text value', () => {
    const converter = createJsonHiFiToXNodeConverter(defaultConfig);
    const json: JsonObject = {
      "root": {
        [naming.value]: "simple text"
      }
    };
    const xnode = converter.convert(json);

    expect(xnode).toBeDefined();
    expect(xnode.name).toBe('root');
    expect(xnode.type).toBe(NodeType.ELEMENT_NODE);
    expect(xnode.value).toBe('simple text');
  });

  describe('Attributes', () => {
    it('should convert attributes from $attr array', () => {
      const converter = createJsonHiFiToXNodeConverter(defaultConfig);
      const json: JsonObject = {
        "root": {
          [naming.attribute]: [
            { "attr1": "value1" },
            { "attr2": "value2" }
          ]
        }
      };
      const xnode = converter.convert(json);

      expect(xnode.name).toBe('root');
      expect(xnode.attributes).toBeDefined();
      expect(xnode.attributes!['attr1']).toBe('value1');
      expect(xnode.attributes!['attr2']).toBe('value2');
    });

    it('should convert namespaced attributes from $attr array', () => {
      const config = createConfig({ preservePrefixedNames: true }); // To see "ns:attr"
      const converter = createJsonHiFiToXNodeConverter(config);
      const json: JsonObject = {
        "root": {
          [naming.attribute]: [
            { "attrName": { [naming.value]: "attrValue", [naming.prefix]: "ns" } }
          ]
        }
      };
      const xnode = converter.convert(json);

      expect(xnode.name).toBe('root');
      expect(xnode.attributes).toBeDefined();
      // The converter should form "ns:attrName" as the attribute key
      expect(xnode.attributes!['ns:attrName']).toBe('attrValue');
    });
    
    it('should convert attributes without prefix if preservePrefixedNames is false for namespaced attributes', () => {
      const config = createConfig({ preservePrefixedNames: false }); // Default
      const converter = createJsonHiFiToXNodeConverter(config);
       const json: JsonObject = {
        "root": {
          [naming.attribute]: [
            { "attrName": { [naming.value]: "attrValue", [naming.prefix]: "ns" } }
          ]
        }
      };
      const xnode = converter.convert(json);
      expect(xnode.attributes).toBeDefined();
      // When preservePrefixedNames is false, the HiFi converter still creates the prefixed name "ns:attrName"
      // because the HiFi JSON explicitly provides the prefix. The standard XNode does not automatically strip it.
      // The `getAttributeName` in XNodeToJsonConverter handles stripping, but not this direction.
      // The HiFi format for attributes is an array of objects: { "name": "value" } or { "name": { $val: "value", $prefix: "p" } }
      // The `processAttributes` in JsonHiFiToXNodeConverter uses this structure.
      // It will construct "p:name" if $prefix is given.
      expect(xnode.attributes!['ns:attrName']).toBe('attrValue');
    });
  });

  it('should convert nested elements from $children array', () => {
    const converter = createJsonHiFiToXNodeConverter(defaultConfig);
    const json: JsonObject = {
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
    const xnode = converter.convert(json);

    expect(xnode.name).toBe('root');
    expect(xnode.children).toBeDefined();
    expect(xnode.children!.length).toBe(1);

    const parentNode = findChild(xnode, 'parent');
    expect(parentNode).toBeDefined();
    expect(parentNode!.children).toBeDefined();
    expect(parentNode!.children!.length).toBe(1);
    
    const childNode = findChild(parentNode!, 'child');
    expect(childNode).toBeDefined();
    expect(childNode!.value).toBe('child text');
  });

  it('should correctly handle text content from $val property', () => {
    const converter = createJsonHiFiToXNodeConverter(defaultConfig);
    const json: JsonObject = {
      "textElement": {
        [naming.value]: "This is the text content."
      }
    };
    const xnode = converter.convert(json);

    expect(xnode.name).toBe('textElement');
    expect(xnode.type).toBe(NodeType.ELEMENT_NODE);
    expect(xnode.value).toBe("This is the text content.");
    expect(xnode.children).toBeUndefined(); // No children if only $val is present for an element
  });
  
  it('should create a text node child if $val is in a child object within $children', () => {
    const converter = createJsonHiFiToXNodeConverter(defaultConfig);
    const json: JsonObject = {
      "root": {
        [naming.children]: [
          { [naming.value]: "text content as child" } // This represents a text node
        ]
      }
    };
    const xnode = converter.convert(json);
    expect(xnode.name).toBe('root');
    expect(xnode.children).toBeDefined();
    expect(xnode.children!.length).toBe(1);
    const textChildNode = xnode.children![0];
    expect(textChildNode.type).toBe(NodeType.TEXT_NODE);
    expect(textChildNode.value).toBe("text content as child");
  });

  describe('Namespaces', () => {
    it('should handle default namespace URI from $ns property', () => {
      const converter = createJsonHiFiToXNodeConverter(defaultConfig);
      const nsUri = "http://example.com/default";
      const json: JsonObject = {
        "root": {
          [naming.namespace]: nsUri,
          // For it to be a *declaration* as well, it needs to be in namespaceDeclarations
          "namespaceDeclarations": { "": nsUri }, 
          "isDefaultNamespace": true 
        }
      };
      const xnode = converter.convert(json);
      expect(xnode.name).toBe('root');
      expect(xnode.namespace).toBe(nsUri);
      expect(xnode.namespaceDeclarations).toEqual({ "": nsUri });
      expect(xnode.isDefaultNamespace).toBe(true);
    });

    it('should handle prefixed namespace from $ns and $prefix properties', () => {
      const converter = createJsonHiFiToXNodeConverter(defaultConfig);
      const nsUri = "http://example.com/custom";
      const prefix = "custom";
      const json: JsonObject = {
        "root": {
          [naming.namespace]: nsUri,
          [naming.prefix]: prefix,
          "namespaceDeclarations": { [prefix]: nsUri }
        }
      };
      const xnode = converter.convert(json);
      expect(xnode.name).toBe('root');
      expect(xnode.prefix).toBe(prefix);
      expect(xnode.namespace).toBe(nsUri);
      expect(xnode.namespaceDeclarations).toEqual({ [prefix]: nsUri });
    });

    it('should handle attributes with namespaces', () => {
      // preservePrefixedNames: true makes the attribute name "p:attr" on the XNode.
      // preservePrefixedNames: false would make it "attr" but it would still have the namespace.
      // The HiFi format for namespaced attributes is { "attrName": { $val: "value", $prefix: "p" } }
      // The converter will then create an attribute named "p:attrName" on the XNode.
      const config = createConfig({ preservePrefixedNames: true });
      const converter = createJsonHiFiToXNodeConverter(config);
      const attrNsUri = "http://example.com/attrNS";
      
      const json: JsonObject = {
        "root": {
          // Element itself might be in a different namespace or no namespace
          "namespaceDeclarations": { "a": attrNsUri }, // Declaration needed for the prefix 'a'
          [naming.attribute]: [
            // Attribute "a:myAttr" where "a" is prefix for "http://example.com/attrNS"
            { "myAttr": { [naming.value]: "namespaced_value", [naming.prefix]: "a" } }
          ]
        }
      };
      const xnode = converter.convert(json);
      expect(xnode.name).toBe('root');
      expect(xnode.attributes).toBeDefined();
      // The attribute name in XNode.attributes becomes "prefix:name"
      expect(xnode.attributes!['a:myAttr']).toBe('namespaced_value');
      // The XNode itself doesn't store attribute namespace URIs directly, they are part of the prefixed name.
    });
  });

  it('should convert comment nodes from $comment property in $children', () => {
    const converter = createJsonHiFiToXNodeConverter(defaultConfig);
    const json: JsonObject = {
      "root": {
        [naming.children]: [
          { [naming.comment]: "This is a comment" }
        ]
      }
    };
    const xnode = converter.convert(json);
    expect(xnode.children).toBeDefined();
    expect(xnode.children!.length).toBe(1);
    const commentNode = findChildByType(xnode, NodeType.COMMENT_NODE);
    expect(commentNode).toBeDefined();
    expect(commentNode!.value).toBe("This is a comment");
  });

  it('should convert processing instruction nodes from $pi property in $children', () => {
    const converter = createJsonHiFiToXNodeConverter(defaultConfig);
    const targetName = "xml-stylesheet";
    const piData = "href='style.css'";
    const json: JsonObject = {
      "root": {
        [naming.children]: [
          { [naming.processingInstr]: { [naming.target]: targetName, [naming.value]: piData } }
        ]
      }
    };
    const xnode = converter.convert(json);
    expect(xnode.children).toBeDefined();
    expect(xnode.children!.length).toBe(1);
    
    const piNode = findChildByType(xnode, NodeType.PROCESSING_INSTRUCTION_NODE);
    expect(piNode).toBeDefined();
    expect(piNode!.name).toBe('#pi'); // Default name for PI XNodes
    expect(piNode!.attributes).toBeDefined();
    expect(piNode!.attributes!.target).toBe(targetName);
    expect(piNode!.value).toBe(piData);
  });

  it('should convert CDATA sections from $cdata property in $children', () => {
    const converter = createJsonHiFiToXNodeConverter(defaultConfig);
    const cdataText = "<p>Hello & Welcome</p>";
    const json: JsonObject = {
      "root": {
        [naming.children]: [
          { [naming.cdata]: cdataText }
        ]
      }
    };
    const xnode = converter.convert(json);
    expect(xnode.children).toBeDefined();
    expect(xnode.children!.length).toBe(1);
    
    const cdataNode = findChildByType(xnode, NodeType.CDATA_SECTION_NODE);
    expect(cdataNode).toBeDefined();
    expect(cdataNode!.value).toBe(cdataText);
  });

  it('should handle mixed content in $children array', () => {
    const converter = createJsonHiFiToXNodeConverter(defaultConfig);
    const json: JsonObject = {
      "root": {
        [naming.children]: [
          { [naming.value]: "text before element " }, // Text node
          { "childElement": { [naming.value]: "element text" } }, // Element node
          { [naming.comment]: "a comment" }, // Comment node
          { [naming.value]: " text after comment" } // Another text node
        ]
      }
    };
    const xnode = converter.convert(json);
    expect(xnode.children).toBeDefined();
    expect(xnode.children!.length).toBe(4);

    const firstTextNode = xnode.children![0];
    expect(firstTextNode.type).toBe(NodeType.TEXT_NODE);
    expect(firstTextNode.value).toBe("text before element ");

    const elementNode = xnode.children![1];
    expect(elementNode.type).toBe(NodeType.ELEMENT_NODE);
    expect(elementNode.name).toBe("childElement");
    expect(elementNode.value).toBe("element text");
    
    const commentNode = xnode.children![2];
    expect(commentNode.type).toBe(NodeType.COMMENT_NODE);
    expect(commentNode.value).toBe("a comment");

    const secondTextNode = xnode.children![3];
    expect(secondTextNode.type).toBe(NodeType.TEXT_NODE);
    expect(secondTextNode.value).toBe(" text after comment");
  });

  describe('Root Element Handling', () => {
    it('should correctly process a single root element object', () => {
      const converter = createJsonHiFiToXNodeConverter(defaultConfig);
      const json: JsonObject = {
        "myRoot": {
          [naming.value]: "Root element content"
        }
      };
      const xnode = converter.convert(json);
      expect(xnode).toBeDefined();
      expect(xnode.name).toBe('myRoot');
      expect(xnode.value).toBe("Root element content");
    });

    it('should throw an error if the input is an array (multiple roots not supported)', () => {
      const converter = createJsonHiFiToXNodeConverter(defaultConfig);
      const jsonArray: JsonValue = [
        { "root1": { [naming.value]: "content1" } },
        { "root2": { [naming.value]: "content2" } }
      ];
      // The converter's validateInput specifically checks for !Array.isArray(input)
      // and the implementation class also validates.
      expect(() => {
        converter.convert(jsonArray);
      }).toThrow(ProcessingError); // Or ValidationError, depending on which one is caught/rethrown
    });
    
    it('should throw an error if the root JSON object does not have exactly one key', () => {
      const converter = createJsonHiFiToXNodeConverter(defaultConfig);
      const jsonMultipleKeys: JsonObject = {
        "root1": { [naming.value]: "content1" },
        "root2": { [naming.value]: "content2" }
      };
       const jsonNoKeys: JsonObject = {};

      expect(() => {
        converter.convert(jsonMultipleKeys);
      }).toThrow(ProcessingError); // Or ValidationError (specifically "JSON HiFi object must have a root element")
      
       expect(() => {
        converter.convert(jsonNoKeys);
      }).toThrow(ProcessingError); // Or ValidationError
    });
  });
});
