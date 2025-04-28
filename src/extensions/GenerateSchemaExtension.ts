// =====================================================================================
// GenerateJsonSchemaExtension.ts
//
// Extension that adds a `generateJsonSchema` method to JsonUtil and exposes it through XJX.
// =====================================================================================

// --- Imports ---
import { JsonUtil } from "../core/utils/json-utils";
import { XJX } from "../core/XJX";

// =====================================================================================
// Main Extension Function
// =====================================================================================

/**
 * Apply generateJsonSchema extension to JsonUtil and XJX.
 */
export function extendXJXWithGenerateJsonSchema() {
  patchUtility(JsonUtil.prototype, "jsonUtil");
}

function patchUtility(proto: any, field: "jsonUtil") {
  const extensionMethods = {
    /**
     * Generate a simple JSON Schema based on current configuration.
     *
     * @returns A basic JSON schema object
     */
    generateJsonSchema(this: any): Record<string, any> {
      // Very simple static schema as example — you can expand this later!
      return {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          root: {
            type: "object",
            properties: {},
            additionalProperties: true
          }
        }
      };
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
    generateJsonSchema(): Record<string, any>;
  }
}

declare module "../core/XJX" {
  interface XJX {
    generateJsonSchema(): Record<string, any>;
  }
}

// =====================================================================================
// Auto-run extension
// =====================================================================================

extendXJXWithGenerateJsonSchema();

// =====================================================================================
// END OF FILE
// =====================================================================================