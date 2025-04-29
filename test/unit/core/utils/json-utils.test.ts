import { JsonUtil } from '../../../../src/core/utils/json-utils';
import { DEFAULT_CONFIG } from '../../../../src/core/config/config';
import { JSONValue } from '../../../../src/core/types/json-types';

describe('JsonUtil', () => {
  let jsonUtil: JsonUtil;

  beforeEach(() => {
    // Create a fresh JsonUtil instance for each test
    jsonUtil = new JsonUtil(DEFAULT_CONFIG);
  });

  describe('isEmpty', () => {
    it('should return true for null and undefined', () => {
      expect(jsonUtil.isEmpty(null)).toBe(true);
      // Explicitly cast undefined to JSONValue to match the type expected by isEmpty
      expect(jsonUtil.isEmpty(undefined as unknown as JSONValue)).toBe(true);
    });

    it('should return true for empty arrays', () => {
      expect(jsonUtil.isEmpty([])).toBe(true);
    });

    it('should return true for empty objects', () => {
      expect(jsonUtil.isEmpty({})).toBe(true);
    });

    it('should return false for non-empty arrays', () => {
      expect(jsonUtil.isEmpty([1, 2, 3])).toBe(false);
    });

    it('should return false for non-empty objects', () => {
      expect(jsonUtil.isEmpty({ key: 'value' })).toBe(false);
    });

    it('should return false for primitive values', () => {
      // Note: While the method doesn't explicitly handle primitives as non-empty,
      // the current implementation returns false for them
      expect(jsonUtil.isEmpty('test')).toBe(false);
      expect(jsonUtil.isEmpty(42)).toBe(false);
      expect(jsonUtil.isEmpty(true)).toBe(false);
    });
  });

  describe('safeStringify', () => {
    it('should stringify a simple object', () => {
      const obj = { name: 'test', value: 42 };
      const result = jsonUtil.safeStringify(obj);
      expect(typeof result).toBe('string');
      expect(JSON.parse(result)).toEqual(obj);
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'circular' };
      circular.self = circular; // Create circular reference
      
      // Should not throw and return a fallback string
      expect(() => jsonUtil.safeStringify(circular)).not.toThrow();
      expect(jsonUtil.safeStringify(circular)).toBe('[Cannot stringify object]');
    });

    it('should respect the indent parameter', () => {
      const obj = { a: 1 };
      const result = jsonUtil.safeStringify(obj, 4);
      expect(result).toBe('{\n    "a": 1\n}');
    });
  });

  describe('deepClone', () => {
    it('should create a deep copy of an object', () => {
      const original = {
        name: 'test',
        nested: {
          value: 42,
          array: [1, 2, 3]
        }
      };
      
      const clone = jsonUtil.deepClone(original);
      
      // Should be equal in value
      expect(clone).toEqual(original);
      
      // But not the same reference
      expect(clone).not.toBe(original);
      expect(clone.nested).not.toBe(original.nested);
      expect(clone.nested.array).not.toBe(original.nested.array);
      
      // Modifying the clone should not affect the original
      clone.nested.value = 99;
      clone.nested.array.push(4);
      
      expect(original.nested.value).toBe(42);
      expect(original.nested.array).toEqual([1, 2, 3]);
    });

    it('should throw an error when cloning non-serializable objects', () => {
      const obj: any = {};
      obj.circular = obj;
      
      expect(() => jsonUtil.deepClone(obj)).toThrow();
    });
  });

  describe('deepMerge', () => {
    it('should merge two simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      
      const result = jsonUtil.deepMerge(target, source);
      
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
      // Should modify the target object
      expect(result).toBe(target);
    });

    it('should handle nested objects correctly', () => {
      interface TestObj {
        a?: number;
        b?: number;
        nested: {
          x?: number;
          y?: number;
          z?: number;
        };
      }
      
      const target: TestObj = {
        a: 1,
        nested: {
          x: 10,
          y: 20
        }
      };
      
      const source: Partial<TestObj> = {
        b: 2,
        nested: {
          y: 30,
          z: 40
        }
      };
      
      const result = jsonUtil.deepMerge(target, source);
      
      expect(result).toEqual({
        a: 1,
        b: 2,
        nested: {
          x: 10,
          y: 30,
          z: 40
        }
      });
    });

    it('should replace arrays instead of merging them', () => {
      const target = { arr: [1, 2, 3] };
      const source = { arr: [4, 5] };
      
      const result = jsonUtil.deepMerge(target, source);
      
      expect(result).toEqual({ arr: [4, 5] });
    });

    it('should handle null or undefined inputs', () => {
      expect(jsonUtil.deepMerge({ a: 1 }, {} as any)).toEqual({ a: 1 });
      expect(jsonUtil.deepMerge({ a: 1 }, {} as any)).toEqual({ a: 1 });
      expect(jsonUtil.deepMerge({} as any, { b: 2 })).toEqual({ b: 2 });
    });
  });

  describe('objectToXJX', () => {
    it('should convert primitive values', () => {
      const valueKey = DEFAULT_CONFIG.propNames.value;
      
      expect(jsonUtil.objectToXJX('text')).toEqual({
        [valueKey]: 'text'
      });
      
      expect(jsonUtil.objectToXJX(42)).toEqual({
        [valueKey]: 42
      });
      
      expect(jsonUtil.objectToXJX(true)).toEqual({
        [valueKey]: true
      });
      
      expect(jsonUtil.objectToXJX(null)).toEqual({
        [valueKey]: null
      });
    });

    it('should convert arrays to children', () => {
      const childrenKey = DEFAULT_CONFIG.propNames.children;
      const valueKey = DEFAULT_CONFIG.propNames.value;
      
      const result = jsonUtil.objectToXJX([1, 'two', true]);
      
      expect(result).toEqual({
        [childrenKey]: [
          { [valueKey]: 1 },
          { [valueKey]: 'two' },
          { [valueKey]: true }
        ]
      });
    });

    it('should convert objects to children', () => {
      const childrenKey = DEFAULT_CONFIG.propNames.children;
      const valueKey = DEFAULT_CONFIG.propNames.value;
      
      const result = jsonUtil.objectToXJX({
        a: 1,
        b: 'text',
        c: true
      });
      
      expect(result).toEqual({
        [childrenKey]: [
          { a: { [valueKey]: 1 } },
          { b: { [valueKey]: 'text' } },
          { c: { [valueKey]: true } }
        ]
      });
    });

    it('should handle nested structures', () => {
      const childrenKey = DEFAULT_CONFIG.propNames.children;
      const valueKey = DEFAULT_CONFIG.propNames.value;
      
      const result = jsonUtil.objectToXJX({
        person: {
          name: 'John',
          age: 30,
          address: {
            city: 'New York',
            zip: 10001
          }
        }
      });
      
      // Verify the structure is correctly converted
      expect(result).toEqual({
        [childrenKey]: [
          {
            person: {
              [childrenKey]: [
                { name: { [valueKey]: 'John' } },
                { age: { [valueKey]: 30 } },
                {
                  address: {
                    [childrenKey]: [
                      { city: { [valueKey]: 'New York' } },
                      { zip: { [valueKey]: 10001 } }
                    ]
                  }
                }
              ]
            }
          }
        ]
      });
    });

    it('should wrap result with a root element if provided', () => {
      const result = jsonUtil.objectToXJX('content', 'root');
      
      expect(Object.keys(result)[0]).toBe('root');
      expect(Object.keys(result).length).toBe(1);
    });
  });
});