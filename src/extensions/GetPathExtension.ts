// =====================================================================================
// GetPathExtension.ts
//
// Extension that adds a `getPath` method using the new terminal extension system
// =====================================================================================

import { XJX } from "../core/XJX";
import { TerminalExtensionContext } from "./types";

/**
 * Safely retrieves a value from a JSON object using a dot-separated path.
 *
 * @param obj The input JSON object
 * @param path The dot-separated path string (e.g., "root.item.description.$val")
 * @param fallback The fallback value if the path does not exist
 * @returns The value at the specified path or the fallback value
 */
function getPath(
  this: TerminalExtensionContext,
  obj: Record<string, any>, 
  path: string, 
  fallback: any = undefined
): any {
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

// Register the getPath terminal extension
XJX.registerTerminalExtension("getPath", getPath);

// =====================================================================================
// END OF FILE
// =====================================================================================