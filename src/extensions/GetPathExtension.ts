// =====================================================================================
// GetPathExtension.ts
//
// Extension that adds a `getPath` method to JsonUtil and exposes it through XJX.
// =====================================================================================

// --- Imports ---
import { JsonUtil } from "../core/utils/json-utils";
import { XJX } from "../core/XJX";

// =====================================================================================
// Main Extension Function
// =====================================================================================

/**
 * Apply getPath extension to JsonUtil and XJX.
 */
export function extendXJXWithGetPath() {
  patchUtility(JsonUtil.prototype, "jsonUtil");
}

function patchUtility(proto: any, field: "jsonUtil") {
  const extensionMethods = {
    /**
     * Safely retrieves a value from a JSON object using a dot-separated path.
     *
     * @param obj The input JSON object
     * @param path The dot-separated path string (e.g., "root.item.description.$val")
     * @param fallback The fallback value if the path does not exist
     * @returns The value at the specified path or the fallback value
     */
    getPath(this: any, obj: Record<string, any>, path: string, fallback: any = undefined): any {
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
  };

  for (const [methodName, methodFn] of Object.entries(extensionMethods)) {
    if (typeof proto[methodName] !== "function") {
      proto[methodName] = methodFn;
    }
    if (typeof (XJX.prototype as any)[methodName] !== "function") {
      (XJX.prototype as any)[methodName] = function (...args: any[]) {
        return (this[field] as any)[methodName](...args);
      };
    }
  }
}

// =====================================================================================
// TypeScript Module Augmentation
// =====================================================================================

declare module "../core/utils/json-utils" {
  interface JsonUtil {
    getPath(obj: Record<string, any>, path: string, fallback?: any): any;
  }
}

declare module "../core/XJX" {
  interface XJX {
    getPath(obj: Record<string, any>, path: string, fallback?: any): any;
  }
}

// =====================================================================================
// Auto-run extension
// =====================================================================================

extendXJXWithGetPath();

// =====================================================================================
// END OF FILE
// =====================================================================================