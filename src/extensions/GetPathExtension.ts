// =====================================================================================
// GetPathExtension.ts
//
// Extension that adds a `getPath` method using the unified registry system
// =====================================================================================

import { UnifiedRegistry, RegistryType } from "../core/registry/unified-registry";

/**
 * Safely retrieves a value from a JSON object using a dot-separated path.
 *
 * @param this The XJX instance
 * @param obj The input JSON object
 * @param path The dot-separated path string (e.g., "root.item.description.$val")
 * @param fallback The fallback value if the path does not exist
 * @returns The value at the specified path or the fallback value
 */
function getPath(this: any, obj: Record<string, any>, path: string, fallback: any = undefined): any {
  if (!obj || typeof obj !== "object") return fallback;
  
  const segments = path.split(".");
  let current: any = obj;
  
  for (const segment of segments) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      return fallback;
    }
  }
  
  return current;
}

// Register the utility function with the unified registry
UnifiedRegistry.register(RegistryType.UTILITY, "getPath", getPath);

// TypeScript module augmentation for type definitions
declare module "../core/XJX" {
  interface XJX {
    getPath(obj: Record<string, any>, path: string, fallback?: any): any;
  }
}

// =====================================================================================
// END OF FILE
// =====================================================================================