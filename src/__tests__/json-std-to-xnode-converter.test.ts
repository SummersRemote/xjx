import { createJsonToXNodeConverter } from '../converters/json-std-to-xnode-converter';
import { XNode } from '../core/xnode';
import { NodeType } from '../core/dom';
import { Configuration, getDefaultConfig, createConfig } from '../core/config';
import { JsonObject, JsonValue } from '../core/converter';

describe('JsonToXNodeConverter', () => {
  let defaultConfig: Configuration;
  
  beforeEach(() => {
    defaultConfig = getDefaultConfig();
  });

  // Helper to find a child XNode by name
  const findChild = (node: XNode, name: string): XNode | undefined => {
    return node.children?.find(c => c.name === name);
  };

  it('should convert a simple JSON object to an XNode', () => {
    const converter = createJsonToXNodeConverter(defaultConfig);
    const json: JsonObject = { "root": { "key": "value" } };
    const xnode = converter.convert(json);

    expect(xnode).toBeDefined();
    expect(xnode.name).toBe('root');
    expect(xnode.type).toBe(NodeType.ELEMENT_NODE);
    expect(xnode.children).toBeDefined();
    expect(xnode.children!.length).toBe(1);
    
    const childNode = xnode.children![0];
    expect(childNode.name).toBe('key');
    expect(childNode.type).toBe(NodeType.ELEMENT_NODE);
    expect(childNode.value).toBe('value');
  });

  it('should convert a JSON object with nested objects to a hierarchical XNode structure', () => {
    const converter = createJsonToXNodeConverter(defaultConfig);
    const json: JsonObject = {
      "root": {
        "parent": {
          "child": "text_value"
        }
      }
    };
    const xnode = converter.convert(json);

    expect(xnode.name).toBe('root');
    const parentNode = findChild(xnode, 'parent');
    expect(parentNode).toBeDefined();
    expect(parentNode!.name).toBe('parent');
    
    const childNode = findChild(parentNode!, 'child');
    expect(childNode).toBeDefined();
    expect(childNode!.name).toBe('child');
    expect(childNode!.value).toBe('text_value');
  });

  describe('Arrays', () => {
    it('should convert an array of primitives using defaultItemName', () => {
      const converter = createJsonToXNodeConverter(defaultConfig);
      const json: JsonObject = { "root": { "numbers": [1, 2, 3] } };
      const xnode = converter.convert(json); 

      const numbersNode = findChild(xnode, 'numbers');
      expect(numbersNode).toBeDefined();
      expect(numbersNode!.children).toBeDefined();
      expect(numbersNode!.children!.length).toBe(3);

      const defaultItemName = defaultConfig.arrays.defaultItemName; 
      numbersNode!.children!.forEach((child, index) => {
        expect(child.name).toBe(defaultItemName);
        expect(child.type).toBe(NodeType.ELEMENT_NODE);
        expect(child.value).toBe(index + 1);
      });
    });

    it('should convert an array of objects, using object keys as element names if single key', () => {
      const converter = createJsonToXNodeConverter(defaultConfig);
      const json: JsonObject = {
        "root": {
          "items": [
            { "item": { "id": "1", "value": "A" } }, 
            { "item": { "id": "2", "value": "B" } }
          ]
        }
      };
      const xnode = converter.convert(json);
      
      const itemsNode = findChild(xnode, 'items');
      expect(itemsNode).toBeDefined();
      expect(itemsNode!.children).toBeDefined();
      expect(itemsNode!.children!.length).toBe(2);

      itemsNode!.children!.forEach((itemChildNode, index) => {
        expect(itemChildNode.name).toBe('item'); 
        const idNode = findChild(itemChildNode, 'id');
        expect(idNode!.value).toBe(String(index + 1));
      });
    });

    it('should use defaultItemName for array objects with multiple keys', () => {
        const converter = createJsonToXNodeConverter(defaultConfig);
        const json: JsonObject = {
          "root": { "elements": [ { "id": "1", "name": "first" } ] }
        };
        const xnode = converter.convert(json);
        const elementsNode = findChild(xnode, 'elements');
        expect(elementsNode!.children![0].name).toBe(defaultConfig.arrays.defaultItemName);
        expect(findChild(elementsNode!.children![0], 'id')).toBeDefined();
    });
  });

  it('should handle various primitive values as direct children correctly', () => {
    const converter = createJsonToXNodeConverter(defaultConfig);
    const json: JsonObject = {
      "root": {
        "stringProp": "hello",
        "numProp": 123,
        "boolProp": true,
      }
    };
    const xnode = converter.convert(json);
    expect(findChild(xnode, 'stringProp')!.value).toBe('hello');
    expect(findChild(xnode, 'numProp')!.value).toBe(123);
    expect(findChild(xnode, 'boolProp')!.value).toBe(true);
  });

  describe('Attribute Handling', () => {
    it('should handle attributes with default strategy ("merge")', () => {
      const converter = createJsonToXNodeConverter(defaultConfig); // merge is default
      const json: JsonObject = { "root": { "attr1": "value1", "child": { "key": "val" } } };
      const xnode = converter.convert(json);
      expect(xnode.attributes!['attr1']).toBe('value1');
      expect(findChild(xnode, 'child')).toBeDefined();
    });

    it('should handle attributes with "prefix" strategy', () => {
      const prefix = defaultConfig.prefixes.attribute; 
      const config = createConfig({ strategies: { attributeStrategy: 'prefix' } });
      const converter = createJsonToXNodeConverter(config);
      const json: JsonObject = { "root": { [`${prefix}attr1`]: "value1", "child": "text" } };
      const xnode = converter.convert(json);
      expect(xnode.attributes!['attr1']).toBe('value1');
      expect(findChild(xnode, 'child')!.value).toBe('text');
    });

    it('should handle attributes with "property" strategy', () => {
      const attrPropName = defaultConfig.properties.attribute; 
      const config = createConfig({ strategies: { attributeStrategy: 'property' } });
      const converter = createJsonToXNodeConverter(config);
      const json: JsonObject = { "root": { [attrPropName]: { "attr1": "value1" }, "child": "text" }};
      const xnode = converter.convert(json);
      expect(xnode.attributes!['attr1']).toBe('value1');
      expect(findChild(xnode, 'child')!.value).toBe('text');
    });
    
    it('should respect preservePrefixedNames for attribute names with "prefix" strategy', () => {
      const prefix = defaultConfig.prefixes.attribute;
      const config = createConfig({ strategies: { attributeStrategy: 'prefix' }, preservePrefixedNames: true });
      const converter = createJsonToXNodeConverter(config);
      const json: JsonObject = { "root": { [`${prefix}ns:attr1`]: "value1" } };
      const xnode = converter.convert(json);
      expect(xnode.attributes!['ns:attr1']).toBe('value1'); 
    });

    it('should strip prefixes from attribute names with "prefix" strategy if preservePrefixedNames is false', () => {
      const prefix = defaultConfig.prefixes.attribute;
      const config = createConfig({ strategies: { attributeStrategy: 'prefix' }, preservePrefixedNames: false });
      const converter = createJsonToXNodeConverter(config);
      const json: JsonObject = { "root": { [`${prefix}ns:attr1`]: "value1" } };
      const xnode = converter.convert(json);
      expect(xnode.attributes!['attr1']).toBe('value1');
    });
  });

  describe('Text Content Handling (properties.value)', () => {
    it('should use property defined by "properties.value" as text content (direct strategy)', () => {
      const valuePropName = defaultConfig.properties.value; // $val
      const converter = createJsonToXNodeConverter(defaultConfig); // direct strategy is default
      const json: JsonObject = { "root": { [valuePropName]: "This is text", "attr1": "val1" } };
      const xnode = converter.convert(json);
      expect(xnode.value).toBe("This is text");
      expect(xnode.attributes!['attr1']).toBe('val1'); // attr1 due to merge strategy for attributes
    });

    it('should use property defined by "properties.value" as text content (property strategy)', () => {
      const valuePropName = defaultConfig.properties.value;
      const config = createConfig({ strategies: { textStrategy: 'property' } });
      const converter = createJsonToXNodeConverter(config);
      const json: JsonObject = { "root": { [valuePropName]: "Main text", "child": { "key": "v" } } };
      const xnode = converter.convert(json);
      expect(xnode.value).toBe("Main text");
      expect(findChild(xnode, 'child')).toBeDefined();
    });
  });

  describe('Array Item Naming', () => {
    it('should use defaultItemName for array items if item is primitive or multi-key object', () => {
      const converter = createJsonToXNodeConverter(defaultConfig);
      const json: JsonObject = { "root": { "myArray": [1, { "k1": "v1", "k2":"v2" }] } };
      const xnode = converter.convert(json);
      const myArrayNode = findChild(xnode, 'myArray');
      expect(myArrayNode!.children![0].name).toBe(defaultConfig.arrays.defaultItemName);
      expect(myArrayNode!.children![1].name).toBe(defaultConfig.arrays.defaultItemName);
    });

    it('should use specific itemNames from config for array items', () => {
      const specificItemName = "customItem";
      const config = createConfig({ arrays: { itemNames: { "myList": specificItemName } } });
      const converter = createJsonToXNodeConverter(config);
      const json: JsonObject = { "root": { "myList": [100, { "key1": "v1" }] } };
      const xnode = converter.convert(json);
      const myListSpecificNode = findChild(xnode, 'myList');
      expect(myListSpecificNode!.children![0].name).toBe(specificItemName); // For primitive
      // For single-key object, key is used as name
      expect(myListSpecificNode!.children![1].name).toBe("key1"); 
      // To test specificItemName for objects, the object must have multiple keys or be configured to ignore keys
      const jsonMultiKey = { "root": { "myList": [{ "k1":"v1", "k2":"v2" }]}};
      const xnodeMultiKey = converter.convert(jsonMultiKey);
      const myListMultiKeyNode = findChild(xnodeMultiKey, "myList");
      expect(myListMultiKeyNode!.children![0].name).toBe(specificItemName);
    });
  });

  describe('Mixed Content', () => {
    it('should handle mixed content when $val is present with sibling objects', () => {
      const valuePropName = defaultConfig.properties.value;
      const converter = createJsonToXNodeConverter(defaultConfig);
      const json: JsonObject = { "root": { [valuePropName]: "text before ", "element": { "attr": "val" } } };
      const xnode = converter.convert(json);
      expect(xnode.children).toBeDefined();
      const textNode = xnode.children!.find(c => c.type === NodeType.TEXT_NODE);
      expect(textNode).toBeDefined();
      expect(textNode!.value).toBe("text before ");
      const elementNode = findChild(xnode, 'element');
      expect(elementNode).toBeDefined();
    });
  });
  
  describe('Null Value Handling (emptyElementStrategy)', () => {
    it('should create empty element for null value with strategy "object" (default)', () => {
        const converter = createJsonToXNodeConverter(defaultConfig); // Default is 'object'
        const json: JsonObject = { "root": { "nullChild": null } };
        const xnode = converter.convert(json);
        const nullChild = findChild(xnode, "nullChild");
        expect(nullChild).toBeDefined();
        expect(nullChild!.value).toBeUndefined();
        expect(nullChild!.children).toBeUndefined();
    });

    it('should set value to null for null value with strategy "null"', () => {
        const config = createConfig({ strategies: { emptyElementStrategy: 'null' }});
        const converter = createJsonToXNodeConverter(config);
        const json: JsonObject = { "root": { "nullChild": null } };
        const xnode = converter.convert(json);
        const nullChild = findChild(xnode, "nullChild");
        expect(nullChild!.value).toBeNull();
    });

    it('should set value to empty string for null value with strategy "string"', () => {
        const config = createConfig({ strategies: { emptyElementStrategy: 'string' }});
        const converter = createJsonToXNodeConverter(config);
        const json: JsonObject = { "root": { "nullChild": null } };
        const xnode = converter.convert(json);
        const nullChild = findChild(xnode, "nullChild");
        expect(nullChild!.value).toBe('');
    });

    it('should default to "object" behavior for "remove" strategy with null values (as not implemented for null)', () => {
        const config = createConfig({ strategies: { emptyElementStrategy: 'remove' }});
        const converter = createJsonToXNodeConverter(config);
        const json: JsonObject = { "root": { "nullChild": null } };
        const xnode = converter.convert(json);
        const nullChild = findChild(xnode, "nullChild");
        expect(nullChild).toBeDefined(); 
        expect(nullChild!.value).toBeUndefined();
    });
  });
});
