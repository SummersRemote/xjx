/**
 * Helper functions for XMLToJSON
 */

/**
 * Determines if the current environment is a browser
 * @returns true if running in browser, false otherwise
 */
export const isBrowser = (): boolean => {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
  };
  
  /**
   * Determines if the current environment is Node.js
   * @returns true if running in Node.js, false otherwise
   */
  export const isNode = (): boolean => {
    return typeof process !== 'undefined' && 
           process.versions != null && 
           process.versions.node != null;
  };
  
  /**
   * Check if an object is empty
   * @param obj Object to check
   * @returns true if object is empty, false otherwise
   */
  export const isEmptyObject = (obj: any): boolean => {
    if (!obj) return true;
    if (typeof obj !== 'object') return false;
    if (Array.isArray(obj)) return obj.length === 0;
    return Object.keys(obj).length === 0;
  };
  
  /**
   * Safely stringify JSON for debugging
   * @param obj Object to stringify
   * @param indent Optional indentation level
   * @returns JSON string representation
   */
  export const safeStringify = (obj: any, indent: number = 2): string => {
    try {
      return JSON.stringify(obj, null, indent);
    } catch (error) {
      return '[Cannot stringify object]';
    }
  };
  
  export default {
    isBrowser,
    isNode,
    isEmptyObject,
    safeStringify
  };