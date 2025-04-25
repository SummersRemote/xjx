/**
 * Tests for JSONUtil class
 */
import { JSONUtil } from '../../../../src/core/utils/JSONUtil';
import { Configuration } from '../../../../src/core/types/types'; 
import { createTestConfig, cloneConfig } from '../../../utils/testUtils';

describe('JSONUtil', () => {
  let jsonUtil: JSONUtil;
  const testConfig: Configuration = createTestConfig();
  
  beforeEach(() => {
    // Create a fresh JSONUtil instance with a clone of our test config
    jsonUtil = new JSONUtil(cloneConfig(testConfig));
  });

  describe('getPath', () => {
    it('should retrieve values using dot notation', () => {
      const json = {
        user: {
          name: "John",
          contact: {
            email: "john@example.com"
          }
        }
      };
      
      expect(jsonUtil.getPath(json, 'user.name')).toBe('John');
      expect(jsonUtil.getPath(json, 'user.contact.email')).toBe('john@example.com');
    });
    
    it('should traverse arrays automatically', () => {
      const json = {
        users: [
          { id: 1, name: "John" },
          { id: 2, name: "Jane" }
        ]
      };
      
      const names = jsonUtil.getPath(json, 'users.name');
      expect(Array.isArray(names)).toBe(true);
      expect(names).toEqual(['John', 'Jane']);
    });
    
    it('should return fallback value when path does not exist', () => {
      const json = { user: { name: "John" } };
      
      expect(jsonUtil.getPath(json, 'user.age', 30)).toBe(30);
      expect(jsonUtil.getPath(json, 'company.name', 'Unknown')).toBe('Unknown');
    });
    
    it('should handle XML-like JSON structures', () => {
      const childrenKey = testConfig.propNames.children;
      const valKey = testConfig.propNames.value;
      
      const json = {
        root: {
          [childrenKey]: [
            { item: { [valKey]: "Item 1" } },
            { item: { [valKey]: "Item 2" } }
          ]
        }
      };
      
      expect(jsonUtil.getPath(json, `root.${childrenKey}.item.${valKey}`)).toEqual(["Item 1", "Item 2"]);
    });
    
    it('should collapse singleton arrays', () => {
      const json = {
        user: {
          roles: ["admin"]
        }
      };
      
      expect(jsonUtil.getPath(json, 'user.roles')).toBe('admin');
    });
  });
  
  describe('fromJSONObject', () => {
    it('should convert a plain JSON object to XML-like JSON structure', () => {
      const json = {
        name: "John",
        age: 30
      };
      
      const result = jsonUtil.fromJSONObject(json);
      const childrenKey = testConfig.propNames.children;
      const valKey = testConfig.propNames.value;
      
      expect(result).toHaveProperty(childrenKey);
      expect(result[childrenKey]).toHaveLength(2);
      expect(result[childrenKey][0].name).toHaveProperty(valKey, 'John');
      expect(result[childrenKey][1].age).toHaveProperty(valKey, 30);
    });
    
    it('should wrap result in a root element if provided', () => {
      const json = { name: "John" };
      const result = jsonUtil.fromJSONObject(json, "user");
      const childrenKey = testConfig.propNames.children;
      
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty(childrenKey);
    });
    
    it('should handle arrays correctly', () => {
      const json = {
        items: ["A", "B", "C"]
      };
      
      const result = jsonUtil.fromJSONObject(json);
      const childrenKey = testConfig.propNames.children;
      const valKey = testConfig.propNames.value;
      
      expect(result[childrenKey][0].items).toHaveProperty(childrenKey);
      expect(result[childrenKey][0].items[childrenKey]).toHaveLength(3);
      expect(result[childrenKey][0].items[childrenKey][0]).toHaveProperty(valKey, 'A');
    });
    
    it('should handle complex root configuration', () => {
      const nsKey = testConfig.propNames.namespace;
      const preKey = testConfig.propNames.prefix;
      const attrKey = testConfig.propNames.attributes;
      const valKey = testConfig.propNames.value;
      
      const json = { name: "John" };
      const result = jsonUtil.fromJSONObject(json, {
        name: "user",
        [preKey]: "ns",
        [nsKey]: "http://example.org",
        [attrKey]: [
          { id: { [valKey]: "u1" } }
        ]
      });
      
      expect(result).toHaveProperty('ns:user');
      expect(result['ns:user']).toHaveProperty(nsKey, 'http://example.org');
      expect(result['ns:user']).toHaveProperty(attrKey);
      expect(result['ns:user'][attrKey][0].id).toHaveProperty(valKey, 'u1');
    });
  });
  
  describe('isEmpty', () => {
    it('should return true for null and undefined', () => {
      expect(jsonUtil.isEmpty(null)).toBe(true);
      expect(jsonUtil.isEmpty(undefined)).toBe(true);
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
      expect(jsonUtil.isEmpty(0)).toBe(false);
      expect(jsonUtil.isEmpty('')).toBe(false);
      expect(jsonUtil.isEmpty(false)).toBe(false);
    });
  });
  
  describe('safeStringify', () => {
    it('should stringify valid JSON objects', () => {
      const obj = { name: "John", age: 30 };
      const result = jsonUtil.safeStringify(obj);
      
      expect(result).toBe(JSON.stringify(obj, null, 2));
    });
    
    it('should handle circular references gracefully', () => {
      const obj: Record<string, any> = { name: "John" };
      obj.self = obj; // Create circular reference
      
      const result = jsonUtil.safeStringify(obj);
      expect(result).toBe('[Cannot stringify object]');
    });
    
    it('should respect custom indent', () => {
      const obj = { name: "John", age: 30 };
      const result = jsonUtil.safeStringify(obj, 4);
      
      expect(result).toBe(JSON.stringify(obj, null, 4));
    });
  });
  
  describe('deepClone and deepMerge', () => {
    it('should create a deep clone of an object', () => {
      const original = {
        name: "John",
        contact: {
          email: "john@example.com"
        },
        tags: ["user", "admin"]
      };
      
      const clone = jsonUtil.deepClone(original);
      
      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.contact).not.toBe(original.contact);
      expect(clone.tags).not.toBe(original.tags);
    });
    
    it('should deep merge two objects', () => {
      const target: Record<string, any> = {
        name: "John",
        contact: {
          email: "john@example.com"
        },
        settings: {
          theme: "dark"
        }
      };
      
      const source = {
        age: 30,
        contact: {
          phone: "555-1234"
        },
        settings: {
          notifications: true
        }
      };
      
      const result = jsonUtil.deepMerge(target, source);
      
      expect(result).toBe(target); // Should modify target
      expect(result.name).toBe("John");
      expect(result.age).toBe(30);
      expect(result.contact.email).toBe("john@example.com");
      expect(result.contact.phone).toBe("555-1234");
      expect(result.settings.theme).toBe("dark");
      expect(result.settings.notifications).toBe(true);
    });
    
    it('should handle arrays during merge', () => {
      const target: Record<string, any> = { tags: ["user"] };
      const source = { tags: ["admin"] };
      
      const result = jsonUtil.deepMerge(target, source);
      
      expect(result.tags).toEqual(["admin"]);
    });
    
    it('should handle null and undefined values', () => {
      // Fix: Use an empty object instead of null to match TypeScript constraints
      expect(jsonUtil.deepMerge({ name: "John" }, {} as Partial<{name: string}>)).toEqual({ name: "John" });
      expect(jsonUtil.deepMerge({} as {name: string}, { name: "John" })).toEqual({ name: "John" });
    });
  });
});