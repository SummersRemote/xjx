/**
 * CommonUtils - Static utility functions used across the library
 * 
 * Central location for shared utility functions to avoid duplication.
 */

export class CommonUtils {
  /**
   * Deep clone an object using JSON serialization
   * @param obj Object to clone
   * @returns Deep clone of the object
   */
  public static deepClone<T>(obj: T): T {
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
  public static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    if (!source || typeof source !== 'object' || source === null) {
      return CommonUtils.deepClone(target);
    }

    if (!target || typeof target !== 'object' || target === null) {
      return CommonUtils.deepClone(source) as T;
    }

    const result = CommonUtils.deepClone(target);

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
        (result[key as keyof T] as any) = CommonUtils.deepMerge(
          targetValue as Record<string, any>,
          sourceValue as Record<string, any>
        );
      } else {
        // Otherwise just replace the value
        (result[key as keyof T] as any) = CommonUtils.deepClone(sourceValue);
      }
    });

    return result;
  }

  /**
   * Check if a value is empty (null, undefined, empty string, empty array or empty object)
   * @param value Value to check
   * @returns true if the value is empty
   */
  public static isEmpty(value: any): boolean {
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
  public static getPath<T>(obj: any, path: string, defaultValue?: T): T | undefined {
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
   * Validate that a value exists
   * @param value Value to check
   * @param errorMessage Error message if validation fails
   * @throws Error with the specified message if validation fails
   */
  public static validateExists(value: any, errorMessage: string): void {
    if (value === undefined || value === null) {
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a unique string identifier
   * @returns Unique string ID
   */
  public static uniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Check if two values are deeply equal
   * @param a First value
   * @param b Second value
   * @returns true if values are deeply equal
   */
  public static isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (a == null || b == null) return false;
    
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      
      if (!CommonUtils.isEqual(a[key], b[key])) return false;
    }
    
    return true;
  }

  /**
   * Safely convert a value to number
   * @param value Value to convert
   * @param defaultValue Default value if conversion fails
   * @returns Converted number or default value
   */
  public static toNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) return defaultValue;
    
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Safely convert a value to boolean
   * @param value Value to convert
   * @param defaultValue Default value if conversion is ambiguous
   * @returns Converted boolean or default value
   */
  public static toBoolean(value: any, defaultValue: boolean = false): boolean {
    if (value === null || value === undefined) return defaultValue;
    
    if (typeof value === 'boolean') return value;
    
    if (typeof value === 'string') {
      const lowered = value.toLowerCase().trim();
      if (['true', 'yes', '1', 'on'].includes(lowered)) return true;
      if (['false', 'no', '0', 'off'].includes(lowered)) return false;
    }
    
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    
    return defaultValue;
  }
}