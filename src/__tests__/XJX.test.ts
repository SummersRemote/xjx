import XJX from '../XJX'; // Assuming XJX is the default export
import { NumberTransform } from '../transforms/number-transform';
import { BooleanTransform } from '../transforms/boolean-transform';
import { XNode, createElement, NodeType } from '../core/xnode';
import { Configuration, createConfig, getDefaultConfig } from '../core/config';
import { JsonValue } from '../core/converter'; // For typing
import { ProcessingError, ValidationError } from '../core/error'; // For error checking

// Helper to normalize XML strings for comparison (basic version)
const normalizeXml = (xmlString: string): string => {
  return xmlString.replace(/\s*</g, "<").replace(/>\s*/g, ">").replace(/\s+([a-zA-Z]+=)/g, ' $1').trim();
};

describe('XJX Class', () => {
  let simpleXml: string;
  let simpleStdJson: JsonValue;
  let simpleXjxJson: JsonValue;
  let configNaming: Configuration['properties'];

  beforeEach(() => {
    simpleXml = '<root><item id="1">text1</item><item id="2">true</item></root>';
    simpleStdJson = { root: { item: [{ id: "1", $val: "text1" }, { id: "2", $val: "true" }] } };
    
    const defaultConfig = getDefaultConfig();
    configNaming = defaultConfig.properties;
    simpleXjxJson = {
      "root": {
        [configNaming.children]: [
          { "item": { [configNaming.attribute]: [{ "id": { [configNaming.value]: "1" } }], [configNaming.value]: "text1" } },
          { "item": { [configNaming.attribute]: [{ "id": { [configNaming.value]: "2" } }], [configNaming.value]: "true" } }
        ]
      }
    };
  });

  // 1. XML to Standard JSON Conversion (End-to-End)
  describe('XML to Standard JSON', () => {
    it('should convert XML string to standard JSON object', () => {
      const xjx = new XJX();
      const resultJson = xjx.fromXml(simpleXml).toStandardJson();
      // The default standard JSON output for <item id="1">text1</item> might be { item: { $attr:{id:"1"}, $val:"text1"}} or similar
      // This depends on the xnode-to-json-std-converter defaults (attributeStrategy, textStrategy)
      // Assuming default 'merge' for attributes and 'direct' for text:
      const expected = {
        "root": {
          "item": [ // arrayStrategy 'multiple' is default
            { "id": "1", [configNaming.value]: "text1" },
            { "id": "2", [configNaming.value]: "true" }
          ]
        }
      };
      expect(resultJson).toEqual(expected);
    });
  });

  // 2. Standard JSON to XML String Conversion (End-to-End)
  describe('Standard JSON to XML String', () => {
    it('should convert standard JSON object to XML string', () => {
      const xjx = new XJX();
      // Input for fromJson when it's a standard object:
      const inputStdJson = { root: { item: [ { id: "1", $val: "text1" }, { id: "2", $val: "true" } ] } };
      // Assuming fromJson can take this standard structure if config.strategies.highFidelity is false (default)
      // or if there's a specific fromStandardJson method. The problem description implies fromObjJson.
      // If fromObjJson is not on XJX, this test might need to use fromJson and ensure config is for standard.
      const resultXml = xjx.fromJson(inputStdJson).toXmlString({ prettyPrint: false, declaration: false });
      const expectedXml = '<root><item id="1">text1</item><item id="2">true</item></root>';
      expect(normalizeXml(resultXml)).toBe(expectedXml);
    });
  });

  // 3. XML to XJX JSON Conversion
  describe('XML to XJX JSON', () => {
    it('should convert XML string to XJX JSON object', () => {
      const xjx = new XJX();
      const resultXjxJson = xjx.fromXml(simpleXml).toXjxJson();
      expect(resultXjxJson).toEqual(simpleXjxJson);
    });
  });

  // 4. XJX JSON to XML String Conversion
  describe('XJX JSON to XML String', () => {
    it('should convert XJX JSON object to XML string', () => {
      const xjx = new XJX();
      const resultXml = xjx.fromJson(simpleXjxJson).toXmlString({ prettyPrint: false, declaration: false });
      const expectedXml = '<root><item id="1">text1</item><item id="2">true</item></root>';
      expect(normalizeXml(resultXml)).toBe(expectedXml);
    });
  });

  // 5. withConfig() Method
  describe('withConfig()', () => {
    it('should apply config to not preserve comments in XML output', () => {
      const xmlWithComment = '<root><!--A comment--><data>value</data></root>';
      const xjx = new XJX();
      const configNoComments = createConfig({ preserveComments: false });
      
      // withConfig creates a new instance
      const xjxNoComments = xjx.withConfig(configNoComments);
      const resultXml = xjxNoComments.fromXml(xmlWithComment).toXmlString({ prettyPrint: false, declaration: false });
      
      expect(resultXml).not.toContain('<!--A comment-->');
      expect(resultXml).toBe('<root><data>value</data></root>');
      
      // Original instance should be unchanged
      const originalInstanceResult = new XJX().fromXml(xmlWithComment).toXmlString({ prettyPrint: false, declaration: false });
      expect(originalInstanceResult).toContain('<!--A comment-->');
    });

    it('should apply config for attribute handling in standard JSON output', () => {
      const xjx = new XJX();
      const configAttrPrefix = createConfig({ 
        strategies: { attributeStrategy: 'prefix' },
        prefixes: { attribute: '#' } // Custom prefix for attributes
      });
      const xjxAttrPrefix = xjx.withConfig(configAttrPrefix);
      const resultJson = xjxAttrPrefix.fromXml(simpleXml).toStandardJson();
      
      const expectedJson = {
        "root": {
          "item": [
            { "#id": "1", [configNaming.value]: "text1" },
            { "#id": "2", [configNaming.value]: "true" }
          ]
        }
      };
      expect(resultJson).toEqual(expectedJson);
    });
  });

  // 6. withTransforms() Method
  describe('withTransforms()', () => {
    it('should apply NumberTransform to convert string to number in standard JSON', () => {
      const xmlNum = '<data><value>123</value><value>45.6</value></data>';
      const xjx = new XJX();
      const xjxWithNumTransform = xjx.withTransforms([new NumberTransform()]);
      const resultJson = xjxWithNumTransform.fromXml(xmlNum).toStandardJson();
      
      const expectedJson = {
        "data": {
          "value": [123, 45.6] // Values should be numbers
        }
      };
      expect(resultJson).toEqual(expectedJson);
    });

    it('should apply BooleanTransform to convert string to boolean in standard JSON', () => {
      const xmlBool = '<data><val>true</val><val>NO</val><val>other</val></data>';
      const xjx = new XJX();
      const xjxWithBoolTransform = xjx.withTransforms([new BooleanTransform()]);
      const resultJson = xjxWithBoolTransform.fromXml(xmlBool).toStandardJson();
      
      const expectedJson = {
        "data": {
          "val": [true, false, "other"] // "other" remains string
        }
      };
      expect(resultJson).toEqual(expectedJson);
    });
  });

  // 7. Chaining and Reusability
  describe('Chaining and Reusability', () => {
    it('should allow an instance to be reused for multiple conversions', () => {
      const xjx = new XJX();
      const xml1 = '<doc1><item>A</item></doc1>';
      const xml2 = '<doc2><item>B</item></doc2>';

      const json1 = xjx.fromXml(xml1).toStandardJson();
      expect(json1).toEqual({ doc1: { item: "A" } });

      const json2 = xjx.fromXml(xml2).toStandardJson();
      expect(json2).toEqual({ doc2: { item: "B" } });
      
      // Check internal state reset (xnode should point to the latest source)
      expect(xjx.xnode!.name).toBe('doc2');
    });
    
    it('withConfig and withTransforms should produce new instances, not modify original', () => {
        const xjx1 = new XJX();
        const xjx2 = xjx1.withConfig({ preserveComments: false });
        const xjx3 = xjx2.withTransforms([new NumberTransform()]);

        expect(xjx1).not.toBe(xjx2);
        expect(xjx2).not.toBe(xjx3);
        expect(xjx1.config.preserveComments).toBe(true); // Default
        expect(xjx2.config.preserveComments).toBe(false);
        expect(xjx3.config.preserveComments).toBe(false); // Inherited from xjx2
        expect(xjx1.transforms.length).toBe(0);
        expect(xjx2.transforms.length).toBe(0);
        expect(xjx3.transforms.length).toBe(1);
    });
  });

  // 8. Error Handling (Basic)
  describe('Error Handling', () => {
    it('should throw an error for invalid XML input in fromXml()', () => {
      const xjx = new XJX();
      // ProcessingError is typically thrown by converters
      expect(() => xjx.fromXml("<invalid xml")).toThrow(ProcessingError);
    });

    it('should throw an error when calling a terminal operation before source is set', () => {
      const xjx = new XJX();
      // ValidationError is thrown by xjx.validateSource()
      expect(() => xjx.toXmlString()).toThrow(ValidationError);
      expect(() => xjx.toStandardJson()).toThrow(ValidationError);
      expect(() => xjx.toXjxJson()).toThrow(ValidationError);
    });
  });
  
  // 9. Cloning Methods
  describe('Utility Methods', () => {
    it('cloneNode should clone an XNode (shallow and deep)', () => {
        const xjx = new XJX();
        const originalNode = createElement('root');
        const child = createElement('child');
        addChild(originalNode, child);
        originalNode.attributes = {myAttr: 'val'};

        // Shallow clone
        const shallow = xjx.cloneNode(originalNode, false);
        expect(shallow.name).toBe('root');
        expect(shallow.attributes).toEqual({myAttr: 'val'});
        expect(shallow.children).toBeUndefined(); // Children not copied
        expect(shallow.parent).toBeUndefined();

        // Deep clone
        const deep = xjx.cloneNode(originalNode, true);
        expect(deep.name).toBe('root');
        expect(deep.attributes).toEqual({myAttr: 'val'});
        expect(deep.children).toBeDefined();
        expect(deep.children!.length).toBe(1);
        expect(deep.children![0].name).toBe('child');
        expect(deep.children![0].parent).toBe(deep); // Parent reference updated in clone
        expect(originalNode.children![0].parent).toBe(originalNode); // Original unchanged
    });

    it('deepClone should clone plain objects/values', () => {
        const xjx = new XJX();
        const originalObj = { a: 1, b: { c: 2 }, d: [1,2] };
        const clonedObj = xjx.deepClone(originalObj);
        expect(clonedObj).toEqual(originalObj);
        expect(clonedObj).not.toBe(originalObj);
        expect(clonedObj.b).not.toBe(originalObj.b);
        expect(clonedObj.d).not.toBe(originalObj.d);
        
        expect(xjx.deepClone(null)).toBeNull();
        expect(xjx.deepClone(undefined)).toBeUndefined();
        expect(xjx.deepClone(123)).toBe(123);
    });

    it('deepMerge should merge objects', () => {
        const xjx = new XJX();
        const target = { a: 1, b: { x: 10, y: 20 }, common: "target" };
        const source = { b: { y: 25, z: 30 }, c: 3, common: "source" };
        const merged = xjx.deepMerge(target, source);
        
        expect(merged).toEqual({
            a: 1,
            b: { x: 10, y: 25, z: 30 },
            c: 3,
            common: "source"
        });
        expect(target.b.y).toBe(20); // Original target unchanged
    });
  });
});
