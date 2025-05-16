/**
 * Common utility functions used across the library
 */

export class Common {
    /**
     * Deep clone an object using JSON serialization
     * @param obj Object to clone
     * @returns Deep clone of the object
     */
    static deepClone<T>(obj: T): T {
      if (obj === undefined || obj === null) {
        return obj;
      }
      return JSON.parse(JSON.stringify(obj));
    }
  
    /**
     * Deep merge two objects
     * @param target Target object
     * @param source Source object to merge into target
     * @returns New object with merged properties (doesn't modify inputs)
     */
    static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
      if (!source || typeof source !== 'object' || source === null) {
        return Common.deepClone(target);
      }
  
      if (!target || typeof target !== 'object' || target === null) {
        return Common.deepClone(source) as T;
      }
  
      const result = Common.deepClone(target);
  
      Object.keys(source).forEach((key) => {
        const sourceValue = source[key as keyof Partial<T>];
        const targetValue = result[key as keyof T];
  
        // If both values are objects, recursively merge them
        if (
          sourceValue !== null &&
          targetValue !== null &&
          typeof sourceValue === 'object' &&
          typeof targetValue === 'object' &&
          !Array.isArray(sourceValue) &&
          !Array.isArray(targetValue)
        ) {
          (result[key as keyof T] as any) = Common.deepMerge(
            targetValue as Record<string, any>,
            sourceValue as Record<string, any>
          );
        } else {
          // Otherwise just replace the value
          (result[key as keyof T] as any) = Common.deepClone(sourceValue);
        }
      });
  
      return result;
    }
  
    /**
     * Check if a value is empty (null, undefined, empty string, empty array or empty object)
     * @param value Value to check
     * @returns true if the value is empty
     */
    static isEmpty(value: any): boolean {
      if (value == null) return true;
      if (typeof value === 'string') return value.trim().length === 0;
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      return false;
    }
  
    /**
     * Safely get a value from an object using a dot-notation path
     * @param obj Source object
     * @param path Dot-notation path (e.g., "user.address.city")
     * @param defaultValue Default value if path doesn't exist
     * @returns Value at path or default value
     */
    static getPath<T>(obj: any, path: string, defaultValue?: T): T | undefined {
      if (!obj || typeof obj !== 'object') {
        return defaultValue;
      }
      
      const segments = path.split('.');
      let current = obj;
      
      for (const segment of segments) {
        if (current === undefined || current === null || typeof current !== 'object') {
          return defaultValue;
        }
        current = current[segment];
      }
      
      return (current === undefined) ? defaultValue : current;
    }
  
    /**
     * Set a value in an object using a dot-notation path
     * @param obj Object to modify
     * @param path Dot-notation path (e.g., "user.address.city")
     * @param value Value to set
     * @returns New object with the value set (original not modified)
     */
    static setPath<T>(obj: T, path: string, value: any): T {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }
  
      const result = Common.deepClone(obj);
      const segments = path.split('.');
      let current: any = result;
  
      for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
  
        if (current[segment] === undefined || current[segment] === null) {
          current[segment] = {};
        } else if (typeof current[segment] !== 'object' || Array.isArray(current[segment])) {
          return obj;
        }
  
        current = current[segment];
      }
  
      current[segments[segments.length - 1]] = value;
      return result;
    }
  
    /**
     * Validate that a value exists
     * @param value Value to check
     * @param errorMessage Error message if validation fails
     * @throws Error with the specified message if validation fails
     */
    static validateExists(value: any, errorMessage: string): void {
      if (value === undefined || value === null) {
        throw new Error(errorMessage);
      }
    }
  
    /**
     * Create a unique string identifier
     * @returns Unique string ID
     */
    static uniqueId(): string {
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
  
    /**
     * Check if two values are deeply equal
     * @param a First value
     * @param b Second value
     * @returns true if values are deeply equal
     */
    static isEqual(a: any, b: any): boolean {
      if (a === b) return true;
      
      if (a == null || b == null) return false;
      
      if (typeof a !== 'object' || typeof b !== 'object') return false;
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        
        if (!Common.isEqual(a[key], b[key])) return false;
      }
      
      return true;
    }
  
    /**
     * Safely convert a value to number
     * @param value Value to convert
     * @param defaultValue Default value if conversion fails
     * @returns Converted number or default value
     */
    static toNumber(value: any, defaultValue: number = 0): number {
      if (value === null || value === undefined) return defaultValue;
      
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    }
  
    /**
     * Safely convert a value to boolean
     * @param value Value to convert
     * @param defaultValue Default value if conversion is ambiguous
     * @param trueValues Values that should be considered true
     * @param falseValues Values that should be considered false
     * @param ignoreCase Whether to ignore case when comparing string values
     * @returns Converted boolean or default value
     */
    static toBoolean(
      value: any, 
      defaultValue: boolean = false,
      trueValues: string[] = ['true', 'yes', '1', 'on'],
      falseValues: string[] = ['false', 'no', '0', 'off'],
      ignoreCase: boolean = true
    ): boolean {
      if (value === null || value === undefined) return defaultValue;
      
      if (typeof value === 'boolean') return value;
      
      if (typeof value === 'string') {
        const compareValue = ignoreCase ? value.toLowerCase().trim() : value.trim();
        if (trueValues.some(val => ignoreCase ? val.toLowerCase() === compareValue : val === compareValue)) return true;
        if (falseValues.some(val => ignoreCase ? val.toLowerCase() === compareValue : val === compareValue)) return false;
      }
      
      if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
      }
      
      return defaultValue;
    }
  }