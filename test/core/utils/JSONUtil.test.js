/**
 * Tests for JSONUtil class
 */
import { JSONUtil } from '../../../src/core/JSONUtil';

describe('JSONUtil', () => {
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
      
      expect(JSONUtil.getPath(json, 'user.name')).toBe('John');
      expect(JSONUtil.getPath(json, 'user.contact.email')).toBe('john@example.com');
    });
    
    it('should traverse arrays automatically', () => {
      const json = {
        users: [
          { id: 1, name: "John" },
          { id: 2, name: "Jane" }
        ]
      };
      
      const names = JSONUtil.getPath(json, 'users.name');
      expect(Array.isArray(names)).toBe(true);
      expect(names).toEqual(['John', 'Jane']);
    });
    
    it('should return fallback value when path does not exist', () => {
      const json = { user: { name: "John" } };
      
      expect(JSONUtil.getPath(json, 'user.age', 30)).toBe(30);
      expect(JSONUtil.getPath(json, 'company.name', 'Unknown')).toBe('Unknown');
    });
    
    it('should handle XML-like JSON structures', () => {
      const json = {
        root: {
          $children: [
            { item: { $val: "Item 1" } },
            { item: { $val: "Item 2" } }
          ]
        }
      };
      
      expect(JSONUtil.getPath(json, 'root.$children.item.$val')).toEqual(["Item 1", "Item 2"]);
    });
    
    it('should collapse singleton arrays', () => {
      const json = {
        user: {
          roles: ["admin"]
        }
      };
      
      expect(JSONUtil.getPath(json, 'user.roles')).toBe('admin');
    });
  });
  
  describe('fromJSONObject', () => {
    it('should convert a plain JSON object to XML-like JSON structure', () => {
      const json = {
        name: "John",
        age: 30
      };
      
      const result = JSONUtil.fromJSONObject(json);
      
      expect(result).toHaveProperty('$children');
      expect(result.$children).toHaveLength(2);
      expect(result.$children[0].name).toHaveProperty('$val', 'John');
      expect(result.$children[1].age).toHaveProperty('$val', 30);
    });
    
    it('should wrap result in a root element if provided', () => {
      const json = { name: "John" };
      const result = JSONUtil.fromJSONObject(json, "user");
      
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('$children');
    });
    
    it('should handle arrays correctly', () => {
      const json = {
        items: ["A", "B", "C"]
      };
      
      const result = JSONUtil.fromJSONObject(json);
      expect(result.$children[0].items).toHaveProperty('$children');
      expect(result.$children[0].items.$children).toHaveLength(3);
      expect(result.$children[0].items.$children[0]).toHaveProperty('$val', 'A');
    });
    
    it('should handle complex root configuration', () => {
      const json = { name: "John" };
      const result = JSONUtil.fromJSONObject(json, {
        name: "user",
        $pre: "ns",
        $ns: "http://example.org",
        $attrs: [
          { id: { $val: "u1" } }
        ]
      });
      
      expect(result).toHaveProperty('ns:user');
      expect(result['ns:user']).toHaveProperty('$ns', 'http://example.org');
      expect(result['ns:user']).toHaveProperty('$attrs');
      expect(result['ns:user'].$attrs[0].id).toHaveProperty('$val', 'u1');
    });
  });
  
  describe('isEmpty', () => {
    it('should return true for null and undefined', () => {
      expect(JSONUtil.isEmpty(null)).toBe(true);
      expect(JSONUtil.isEmpty(undefined)).toBe(true);
    });
    
    it('should return true for empty arrays', () => {
      expect(JSONUtil.isEmpty([])).toBe(true);
    });
    
    it('should return true for empty objects', () => {
      expect(JSONUtil.isEmpty({})).toBe(true);
    });
    
    it('should return false for non-empty arrays', () => {
      expect(JSONUtil.isEmpty([1, 2, 3])).toBe(false);
    });
    
    it('should return false for non-empty objects', () => {
      expect(JSONUtil.isEmpty({ key: 'value' })).toBe(false);
    });
    
    it('should return false for primitive values', () => {
      expect(JSONUtil.isEmpty(0)).toBe(false);
      expect(JSONUtil.isEmpty('')).toBe(false);
      expect(JSONUtil.isEmpty(false)).toBe(false);
    });
  });
  
  describe('safeStringify', () => {
    it('should stringify valid JSON objects', () => {
      const obj = { name: "John", age: 30 };
      const result = JSONUtil.safeStringify(obj);
      
      expect(result).toBe(JSON.stringify(obj, null, 2));
    });
    
    it('should handle circular references gracefully', () => {
      const obj: any = { name: "John" };
      obj.self = obj; // Create circular reference
      
      const result = JSONUtil.safeStringify(obj);
      expect(result).toBe('[Cannot stringify object]');
    });
    
    it('should respect custom indent', () => {
      const obj = { name: "John", age: 30 };
      const result = JSONUtil.safeStringify(obj, 4);
      
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
      
      const clone = JSONUtil.deepClone(original);
      
      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.contact).not.toBe(original.contact);
      expect(clone.tags).not.toBe(original.tags);
    });
    
    it('should deep merge two objects', () => {
      const target = {
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
      
      const result = JSONUtil.deepMerge(target, source);
      
      expect(result).toBe(target); // Should modify target
      expect(result.name).toBe("John");
      expect(result.age).toBe(30);
      expect(result.contact.email).toBe("john@example.com");
      expect(result.contact.phone).toBe("555-1234");
      expect(result.settings.theme).toBe("dark");
      expect(result.settings.notifications).toBe(true);
    });
    
    it('should handle arrays during merge', () => {
      const target = { tags: ["user"] };
      const source = { tags: ["admin"] };
      
      const result = JSONUtil.deepMerge(target, source);
      
      expect(result.tags).toEqual(["admin"]);
    });
    
    it('should handle null and undefined values', () => {
      expect(JSONUtil.deepMerge({ name: "John" }, null)).toEqual({ name: "John" });
      expect(JSONUtil.deepMerge(null, { name: "John" })).toEqual({ name: "John" });
    });
  });
});