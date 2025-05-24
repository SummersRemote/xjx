import { BooleanTransform, BooleanTransformOptions } from '../transforms/boolean-transform';
import { TransformContext, FORMAT, TransformResult, createRootContext } from '../core/transform';
import { XNode, createElement } from '../core/xnode';
import { NodeType } from '../core/dom';
import { getDefaultConfig } from '../core/config';

describe('BooleanTransform', () => {
  let defaultConfig: ReturnType<typeof getDefaultConfig>;
  let baseContextJson: TransformContext;
  let baseContextXml: TransformContext;

  beforeEach(() => {
    defaultConfig = getDefaultConfig();
    // Create a dummy root XNode for context creation
    const dummyRootNode = createElement('root');
    baseContextJson = createRootContext(FORMAT.JSON, dummyRootNode, defaultConfig);
    baseContextXml = createRootContext(FORMAT.XML, dummyRootNode, defaultConfig);
  });

  // --- Tests for stringToBoolean conversion (context.targetFormat === FORMAT.JSON) ---
  describe('String to Boolean (targetFormat: JSON)', () => {
    it('should convert default true values to true', () => {
      const transform = new BooleanTransform();
      const trueInputs = ['true', 'TRUE', '  yes  ', 'YES', '1', 'on', 'ON  '];
      trueInputs.forEach(input => {
        const result = transform.transform(input, baseContextJson);
        expect(result.value).toBe(true);
      });
    });

    it('should convert default false values to false', () => {
      const transform = new BooleanTransform();
      const falseInputs = ['false', 'FALSE', 'no', '  NO  ', '0', 'off', 'OFF '];
      falseInputs.forEach(input => {
        const result = transform.transform(input, baseContextJson);
        expect(result.value).toBe(false);
      });
    });

    it('should use custom trueValues', () => {
      const options: BooleanTransformOptions = { trueValues: ['active', 'enabled'] };
      const transform = new BooleanTransform(options);
      expect(transform.transform('active', baseContextJson).value).toBe(true);
      expect(transform.transform('enabled', baseContextJson).value).toBe(true);
      expect(transform.transform('true', baseContextJson).value).toBe('true'); // Default 'true' no longer works
    });

    it('should use custom falseValues', () => {
      const options: BooleanTransformOptions = { falseValues: ['inactive', 'disabled'] };
      const transform = new BooleanTransform(options);
      expect(transform.transform('inactive', baseContextJson).value).toBe(false);
      expect(transform.transform('disabled', baseContextJson).value).toBe(false);
      expect(transform.transform('false', baseContextJson).value).toBe('false'); // Default 'false' no longer works
    });

    it('should handle ignoreCase: true (default)', () => {
      const transform = new BooleanTransform(); // ignoreCase is true by default
      expect(transform.transform('TrUe', baseContextJson).value).toBe(true);
      expect(transform.transform('fAlSe', baseContextJson).value).toBe(false);
    });

    it('should handle ignoreCase: false', () => {
      const options: BooleanTransformOptions = { ignoreCase: false };
      const transform = new BooleanTransform(options);
      expect(transform.transform('True', baseContextJson).value).toBe('True'); // Not converted
      expect(transform.transform('true', baseContextJson).value).toBe(true);
      expect(transform.transform('FALSE', baseContextJson).value).toBe('FALSE'); // Not converted
      expect(transform.transform('false', baseContextJson).value).toBe(false);
    });

    it('should return original value if no match', () => {
      const transform = new BooleanTransform();
      expect(transform.transform('maybe', baseContextJson).value).toBe('maybe');
      expect(transform.transform('123', baseContextJson).value).toBe('123'); // Not in default lists
    });

    it('should return original value if input is not a string (and not boolean)', () => {
      const transform = new BooleanTransform();
      expect(transform.transform(123, baseContextJson).value).toBe(123);
      expect(transform.transform(null, baseContextJson).value).toBeNull();
      expect(transform.transform(undefined, baseContextJson).value).toBeUndefined();
      const obj = { a: 1 };
      expect(transform.transform(obj, baseContextJson).value).toBe(obj);
    });
    
    it('should return boolean input as is', () => {
      const transform = new BooleanTransform();
      expect(transform.transform(true, baseContextJson).value).toBe(true);
      expect(transform.transform(false, baseContextJson).value).toBe(false);
    });
  });

  // --- Tests for booleanToString conversion (context.targetFormat === FORMAT.XML) ---
  describe('Boolean to String (targetFormat: XML)', () => {
    it('should convert true to "true"', () => {
      const transform = new BooleanTransform();
      const result = transform.transform(true, baseContextXml);
      expect(result.value).toBe('true');
    });

    it('should convert false to "false"', () => {
      const transform = new BooleanTransform();
      const result = transform.transform(false, baseContextXml);
      expect(result.value).toBe('false');
    });

    it('should return non-boolean values as is', () => {
      const transform = new BooleanTransform();
      expect(transform.transform('text', baseContextXml).value).toBe('text');
      expect(transform.transform(123, baseContextXml).value).toBe(123);
      expect(transform.transform(null, baseContextXml).value).toBeNull();
    });
  });
  
  // --- Test application to XNode value ---
  it('should transform an XNode value when context is JSON', () => {
    const transform = new BooleanTransform();
    const node = createElement('data');
    node.value = 'on';
    
    // Simulate applying the transform to the node's value
    const transformedResult = transform.transform(node.value, baseContextJson);
    node.value = transformedResult.value;
    
    expect(node.value).toBe(true);
  });

  it('should transform an XNode value (boolean) to string when context is XML', () => {
    const transform = new BooleanTransform();
    const node = createElement('data');
    node.value = true;
    
    const transformedResult = transform.transform(node.value, baseContextXml);
    node.value = transformedResult.value;
    
    expect(node.value).toBe('true');
  });
  
  // --- Test targets property ---
  it('should have "Value" as its target', () => {
    const transform = new BooleanTransform();
    expect(transform.targets).toEqual(['value']);
  });
});
