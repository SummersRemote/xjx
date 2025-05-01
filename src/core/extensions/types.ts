/**
 * Type definitions for XJX extensions
 */

// To fix the error with relative module paths, we need to use a non-relative path
// We can use the package name 'xjx' instead of '../XJX'

// Add extension methods to XJX interface
declare module 'xjx' {
    interface XJX {
      // String replace transformer factory
      stringReplace(options: any): any;
      
      // GetPath utility
      getPath(obj: Record<string, any>, path: string, fallback?: any): any;
      
      // GetJsonSchema utility
      getJsonSchema(): Record<string, any>;
      
      // Additional extension methods will be added by their respective extensions
    }
  }
  
  // Note: You need to ensure that the 'xjx' package name matches what's used in your tsconfig.json
  // and package.json files for module resolution to work correctly.