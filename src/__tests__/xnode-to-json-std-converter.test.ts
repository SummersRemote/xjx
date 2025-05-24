import { createXNodeToJsonConverter } from '../converters/xnode-to-json-std-converter';
import { XNode, createElement, createTextNode, addChild } from '../core/xnode';
import { NodeType } from '../core/dom';
import { Configuration, getDefaultConfig, createConfig } from '../core/config';
import { JsonObject, JsonValue } from '../core/converter';

// Helper to create a simple XNode element with optional value and attributes
const makeElement = (name: string, value?: any, attributes?: Record<string, any>, children?: XNode[]): XNode => {
  const node = createElement(name);
  if (value !== undefined) {
    // If it's meant to be direct text content for an element that might also have attributes/children,
    // the converter expects it as a child text node or via node.value if it's the ONLY content.
    // For simplicity in tests, if children are also provided, we'll assume value is a text child.
    // If no children and value is primitive, it can be node.value.
    if (children && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
        addChild(node, createTextNode(String(value)));
    } else {
        node.value = value;
    }
  }
  if (attributes) {
    node.attributes = attributes;
  }
  if (children) {
    children.forEach(child => addChild(node, child));
  }
  return node;
};


describe('XNodeToJsonConverter (Standard JSON)', () => {
  let defaultConfig: Configuration;
  
  beforeEach(() => {
    defaultConfig = getDefaultConfig();
  });

  it('should convert a simple XNode with text value', () => {
    const converter = createXNodeToJsonConverter(defaultConfig);
    const node = makeElement('root', 'simple text');
    const expectedJson = { "root": "simple text" };
    const result = converter.convert(node);
    expect(result).toEqual(expectedJson);
  });

  it('should convert a simple XNode with only attributes', () => {
    const converter = createXNodeToJsonConverter(defaultConfig);
    // Default attributeStrategy: 'merge'
    const node = makeElement('root', undefined, { "attr1": "val1" });
    const expectedJson = { "root": { "attr1": "val1" } };
    const result = converter.convert(node);
    expect(result).toEqual(expectedJson);
  });

  it('should convert nested XNodes to hierarchical JSON', () => {
    const converter = createXNodeToJsonConverter(defaultConfig);
    const child = makeElement('child', 'child text');
    const parent = makeElement('parent', undefined, undefined, [child]);
    const root = makeElement('root', undefined, undefined, [parent]);

    const expectedJson = {
      "root": {
        "parent": {
          "child": "child text"
        }
      }
    };
    const result = converter.convert(root);
    expect(result).toEqual(expectedJson);
  });

  describe('Attribute Handling', () => {
    it('should ignore attributes if preserveAttributes is false', () => {
      const config = createConfig({ preserveAttributes: false });
      const converter = createXNodeToJsonConverter(config);
      const node = makeElement('root', 'text', { "attr1": "val1" });
      // Expecting only text, attributes ignored.
      const expectedJson = { "root": "text" };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should merge attributes with default strategy ("merge")', () => {
      // defaultConfig has preserveAttributes: true, strategies.attributeStrategy: 'merge'
      const converter = createXNodeToJsonConverter(defaultConfig);
      const node = makeElement('root', undefined, { "attr1": "val1", "attr2": "val2" });
      const expectedJson = { "root": { "attr1": "val1", "attr2": "val2" } };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });
    
    it('should merge attributes and text value correctly with "merge" strategy', () => {
        const converter = createXNodeToJsonConverter(defaultConfig);
        const node = makeElement('root', undefined, { "attr1": "val1" });
        // Add text child to 'root'
        addChild(node, createTextNode("main text"));

        const expectedJson = { 
            "root": { 
                "attr1": "val1",
                [defaultConfig.properties.value]: "main text" // Default is $val for text
            } 
        };
        const result = converter.convert(node);
        expect(result).toEqual(expectedJson);
    });

    it('should handle name clashes between attribute and child element with "merge" strategy (child takes precedence)', () => {
      const converter = createXNodeToJsonConverter(defaultConfig);
      const childElement = makeElement('clash', 'child value');
      const node = makeElement('root', undefined, { "clash": "attribute value" }, [childElement]);
      
      // In XNodeToJsonConverterImpl, child elements are processed, and their properties are added to the result object.
      // If an attribute with the same name exists, it would have been added first if attributeStrategy was 'merge' (direct property).
      // The current implementation processes attributes first if strategy is 'merge', then children.
      // So, if a child has the same name as an attribute, the child's data (as an object/value) will overwrite the attribute.
      const expectedJson = {
        "root": {
          "clash": { // The child 'clash' overwrites the attribute 'clash'
            "clash": "child value" // because child 'clash' itself becomes an object {clash: "child value"}
          }
        }
      };
      // Let's trace:
      // 1. processElementNode for 'root'
      // 2. processElementWithChildren for 'root'
      // 3. addAttributes for 'root': result['clash'] = "attribute value"
      // 4. processChildElements for 'root': child 'clash' is processed.
      //    - convert(childElement) -> {"clash": "child value"}
      //    - result['clash'] is updated to {"clash": "child value"}
      // This means the child element's structure will be under the 'clash' key.

      const result = converter.convert(node);
      // The child element 'clash' will create a field 'clash' in the parent.
      // The attribute 'clash' would also want to create a field 'clash'.
      // The implementation seems to process children last for a given name if names collide.
      // The structure is `result[childName] = convertedChildValue` where `convertedChildValue` is `{childName: childActualValue}`
      // So, `result.root.clash` becomes `{"clash": "child value"}`
      expect(result).toEqual(expectedJson);
    });

    it('should prefix attributes with "prefix" strategy', () => {
      const attrPrefix = defaultConfig.prefixes.attribute; // Default '@'
      const config = createConfig({ strategies: { attributeStrategy: 'prefix' } });
      const converter = createXNodeToJsonConverter(config);
      const node = makeElement('root', 'text', { "attr1": "val1" });
      // Text is primary, attributes are prefixed.
      const expectedJson = { 
        "root": { 
          [`${attrPrefix}attr1`]: "val1",
          [defaultConfig.properties.value]: "text" // Default $val for text when there are attributes
        } 
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should group attributes under a property with "property" strategy', () => {
      const attrProp = defaultConfig.properties.attribute; // Default '$attr'
      const config = createConfig({ strategies: { attributeStrategy: 'property' } });
      const converter = createXNodeToJsonConverter(config);
      const node = makeElement('root', 'text', { "attr1": "val1" });
      const expectedJson = { 
        "root": { 
          [attrProp]: { "attr1": "val1" },
          [defaultConfig.properties.value]: "text" // Default $val for text
        } 
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });
  });

  describe('Prefixed Element and Attribute Names (preservePrefixedNames)', () => {
    it('should preserve prefixes for element and attribute names if preservePrefixedNames is true', () => {
      const config = createConfig({ 
        preservePrefixedNames: true,
        strategies: { attributeStrategy: 'merge' } // Use merge to see attrs directly
      });
      const converter = createXNodeToJsonConverter(config);
      
      const child = makeElement('child', 'child text');
      child.prefix = 'c'; // c:child
      const node = makeElement('root', undefined, { "a:attr": "val" });
      node.prefix = 'p'; // p:root
      addChild(node, child);

      const expectedJson = {
        "p:root": {
          "a:attr": "val",
          "c:child": "child text"
        }
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should strip prefixes for element and attribute names if preservePrefixedNames is false (default)', () => {
      // defaultConfig has preservePrefixedNames: false
      const converter = createXNodeToJsonConverter(defaultConfig); 
      
      const child = makeElement('child', 'child text');
      child.prefix = 'c'; // c:child
      const node = makeElement('root', undefined, { "a:attr": "val" });
      node.prefix = 'p'; // p:root
      addChild(node, child);

      const expectedJson = {
        "root": { // Prefix 'p' stripped
          "attr": "val", // Prefix 'a' stripped
          "child": "child text" // Prefix 'c' stripped
        }
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });
  });

  describe('Data Type Conversion', () => {
    it('should preserve original data types if present in XNode.value', () => {
      const converter = createXNodeToJsonConverter(defaultConfig);
      const node = createElement('data');
      const numNode = makeElement('numberValue');
      numNode.value = 123; // Actual number
      const boolNode = makeElement('booleanValue');
      boolNode.value = true; // Actual boolean
      const stringNumNode = makeElement('stringNumValue', "456"); // String
      
      addChild(node, numNode);
      addChild(node, boolNode);
      addChild(node, stringNumNode);

      const expectedJson = {
        "data": {
          "numberValue": 123,
          "booleanValue": true,
          "stringNumValue": "456"
        }
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
      
      // Verify types in the result
      const resultData = (result as JsonObject).data as JsonObject;
      expect(typeof resultData.numberValue).toBe('number');
      expect(typeof resultData.booleanValue).toBe('boolean');
      expect(typeof resultData.stringNumValue).toBe('string');
    });

    it('should treat text node values as strings, even if numeric/boolean-like', () => {
      const converter = createXNodeToJsonConverter(defaultConfig);
      const node = makeElement('data');
      // Text nodes always have string values
      addChild(node, makeElement('numStr', "123.45")); 
      addChild(node, makeElement('boolStr', "false"));

      const expectedJson = {
        "data": {
          "numStr": "123.45",
          "boolStr": "false"
        }
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
      const resultData = (result as JsonObject).data as JsonObject;
      expect(typeof resultData.numStr).toBe('string');
      expect(typeof resultData.boolStr).toBe('string');
    });
  });

  describe('Empty Elements (emptyElementStrategy)', () => {
    it('should convert empty element to {} with "object" strategy (default)', () => {
      const converter = createXNodeToJsonConverter(defaultConfig); // default is 'object'
      const node = makeElement('empty');
      const expectedJson = { "empty": {} };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should convert empty element to null with "null" strategy', () => {
      const config = createConfig({ strategies: { emptyElementStrategy: 'null' } });
      const converter = createXNodeToJsonConverter(config);
      const node = makeElement('empty');
      const expectedJson = { "empty": null };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should convert empty element to "" with "string" strategy', () => {
      const config = createConfig({ strategies: { emptyElementStrategy: 'string' } });
      const converter = createXNodeToJsonConverter(config);
      const node = makeElement('empty');
      const expectedJson = { "empty": "" };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should remove empty element if strategy is "remove" (resulting in empty parent or specific handling)', () => {
      const config = createConfig({ strategies: { emptyElementStrategy: 'remove' } });
      const converter = createXNodeToJsonConverter(config);
      
      // Case 1: Root is empty and removed
      const emptyRoot = makeElement('emptyRoot');
      const resultEmptyRoot = converter.convert(emptyRoot);
      // removeEmptyElements returns undefined if the root itself is removed, converter wraps this to {}
      expect(resultEmptyRoot).toEqual({}); 

      // Case 2: Child is empty and removed
      const emptyChild = makeElement('emptyChild');
      const parent = makeElement('parent', undefined, undefined, [emptyChild]);
      const resultParent = converter.convert(parent);
      // 'emptyChild' property should be absent from 'parent'
      const expectedParentJson = { "parent": {} }; // Parent itself is now empty of children
      expect(resultParent).toEqual(expectedParentJson);

       // Case 3: Empty element with attributes should not be removed by 'remove' strategy for empty elements
      const emptyWithAttrs = makeElement('emptyWithAttrs', undefined, { "id": "123" });
      const resultEmptyWithAttrs = converter.convert(emptyWithAttrs);
      const expectedEmptyWithAttrsJson = { "emptyWithAttrs": { "id": "123" } };
      expect(resultEmptyWithAttrs).toEqual(expectedEmptyWithAttrsJson);
    });
  });

  describe('Mixed Content (mixedContentStrategy)', () => {
    it('should preserve text and elements separately with "preserve" strategy', () => {
      const config = createConfig({ strategies: { mixedContentStrategy: 'preserve' } }); // Default
      const converter = createXNodeToJsonConverter(config);
      const text1 = createTextNode("text1 ");
      const elem = makeElement('elem', 'elem_text'); // elem_text will be its direct value
      const text2 = createTextNode(" text2");
      const node = makeElement('root', undefined, undefined, [text1, elem, text2]);

      // Expected: text nodes combined into $val, 'elem' as a separate property.
      const expectedJson = {
        "root": {
          [defaultConfig.properties.value]: "text1  text2", // Note: getTextContent joins with no space if nodes are direct siblings. My helper might add space.
                                                           // The actual getTextContent from node.children in converter might be "text1 text2"
                                                           // Let's check converter logic: it's `textNodes.map(t => t.value).join('')`
          "elem": "elem_text" // child 'elem' has its own value
        }
      };
      const result = converter.convert(node);
      // Adjust expected based on join('')
      expectedJson.root[defaultConfig.properties.value] = "text1 text2";
      expect(result).toEqual(expectedJson);
    });

    it('should merge all text content with "merge" strategy', () => {
      const config = createConfig({ strategies: { mixedContentStrategy: 'merge' } });
      const converter = createXNodeToJsonConverter(config);
      const text1 = createTextNode("text1 ");
      const elem = makeElement('elem', 'elem_text_val'); // child element has its own value
      const text2 = createTextNode(" text2");
      const node = makeElement('root', undefined, undefined, [text1, elem, text2]);
      
      // extractAllTextContent joins with spaces, then trims.
      // It gets node.value OR recursively calls extractAllTextContent.
      // So, "text1 " + "elem_text_val" + " text2" -> "text1 elem_text_val text2"
      const expectedJson = { 
        "root": {
          [defaultConfig.properties.value]: "text1 elem_text_val text2"
        } 
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });
  });

  describe('Array Creation (arrayStrategy and forceArrays)', () => {
    it('should create an array if multiple children have the same name (default "multiple" strategy)', () => {
      const converter = createXNodeToJsonConverter(defaultConfig); // arrayStrategy: 'multiple'
      const item1 = makeElement('item', '1');
      const item2 = makeElement('item', '2');
      const node = makeElement('list', undefined, undefined, [item1, item2]);
      
      const expectedJson = { "list": { "item": ["1", "2"] } };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should not create an array for single child even with "multiple" strategy', () => {
      const converter = createXNodeToJsonConverter(defaultConfig);
      const item1 = makeElement('item', '1');
      const node = makeElement('list', undefined, undefined, [item1]);
      
      const expectedJson = { "list": { "item": "1" } };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should always create an array if arrayStrategy is "always"', () => {
      const config = createConfig({ strategies: { arrayStrategy: 'always' } });
      const converter = createXNodeToJsonConverter(config);
      const item1 = makeElement('item', '1');
      const node = makeElement('list', undefined, undefined, [item1]);
      
      const expectedJson = { "list": { "item": ["1"] } }; // Array even for one item
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should never create an array if arrayStrategy is "never" (last one wins for same name)', () => {
      const config = createConfig({ strategies: { arrayStrategy: 'never' } });
      const converter = createXNodeToJsonConverter(config);
      const item1 = makeElement('item', '1');
      const item2 = makeElement('item', '2'); // This one should overwrite item1's value
      const node = makeElement('list', undefined, undefined, [item1, item2]);
      
      const expectedJson = { "list": { "item": "2" } }; // item2's value
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });
    
    it('should force array creation for specific element names in forceArrays', () => {
      const config = createConfig({ 
        arrays: { forceArrays: ['forcedItem'] },
        strategies: { arrayStrategy: 'multiple' } // To ensure forceArrays is taking precedence
      });
      const converter = createXNodeToJsonConverter(config);
      const item1 = makeElement('forcedItem', '1');
      const node = makeElement('list', undefined, undefined, [item1]);
      
      const expectedJson = { "list": { "forcedItem": ["1"] } };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });
  });

  describe('Text Property Name (properties.value and strategies.textStrategy)', () => {
    it('should use default properties.value ("$val") when text coexists with attributes (merge strategy)', () => {
      const converter = createXNodeToJsonConverter(defaultConfig); // default textStrategy: 'direct'
      const node = makeElement('root', undefined, { "attr": "val" });
      addChild(node, createTextNode("the text"));
      
      const expectedJson = { 
        "root": { 
          "attr": "val",
          [defaultConfig.properties.value]: "the text"
        } 
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should use custom properties.value when text coexists with attributes', () => {
      const customTextProp = "_text";
      const config = createConfig({ properties: { value: customTextProp } });
      const converter = createXNodeToJsonConverter(config);
      const node = makeElement('root', undefined, { "attr": "val" });
      addChild(node, createTextNode("the text"));

      const expectedJson = { 
        "root": { 
          "attr": "val",
          [customTextProp]: "the text"
        } 
      };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });

    it('should place text directly if textStrategy is "direct" and no attributes/children', () => {
      const config = createConfig({ strategies: { textStrategy: 'direct' }}); // This is default
      const converter = createXNodeToJsonConverter(config);
      const node = makeElement('root', 'direct text');
      const expectedJson = { "root": "direct text" };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });
    
    it('should use properties.value if textStrategy is "property", even if no attributes/children', () => {
      const textProp = defaultConfig.properties.value; // $val
      const config = createConfig({ strategies: { textStrategy: 'property' }});
      const converter = createXNodeToJsonConverter(config);
      const node = makeElement('root', 'text for property');
      // If strategy is 'property', text always goes into the designated property.
      const expectedJson = { "root": { [textProp]: "text for property" } };
      const result = converter.convert(node);
      expect(result).toEqual(expectedJson);
    });
  });

  // Test cases will be added here
});
