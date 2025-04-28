// =====================================================================================
// TemplateExtension.ts
//
// Boilerplate for creating XJX Extensions:
// - Patches methods into JsonUtil and XmlUtil
// - Dynamically adds them to XJX instances
// =====================================================================================

// --- Imports ---
import { JsonUtil } from "../core/utils/json-utils";
import { XmlUtil } from "../core/utils/xml-utils";
import { XJX } from "../core/XJX";

// =====================================================================================
// Main Extension Function
// =====================================================================================

/**
 * Apply extension methods to JsonUtil, XmlUtil, and XJX.
 */
export function extendXJXWithTemplate() {
  patchUtility(JsonUtil.prototype, "jsonUtil");
  patchUtility(XmlUtil.prototype, "xmlUtil");
}

/**
 * Helper to patch a utility prototype (JsonUtil or XmlUtil)
 * and dynamically forward methods into XJX.
 *
 * @param proto The prototype object to patch (JsonUtil.prototype or XmlUtil.prototype)
 * @param field The field name inside XJX ("jsonUtil" or "xmlUtil")
 */
function patchUtility(proto: any, field: "jsonUtil" | "xmlUtil") {
  // --- Define new methods to add (example: sayHello) ---
  const extensionMethods = {
    /**
     * sayHello
     * 
     * Example extension method.
     * @param name Name to greet
     */
    sayHello(this: any, name: string = "XJX"): string {
      return `Hello, ${name}! (from ${field})`;
    },

    // =====================================================================================
    // TODO: Add your additional methods here.
    // =====================================================================================
    //
    // exampleMethod(this: any, input: string): any {
    //   return input.toUpperCase();
    // }
  };

  // --- Add methods safely ---
  for (const [methodName, methodFn] of Object.entries(extensionMethods)) {
    if (typeof proto[methodName] !== "function") {
      proto[methodName] = methodFn;
    }

    // --- Forward the method into XJX if not already present ---
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

// --- Extend JsonUtil types ---
declare module "../core/utils/json-utils" {
  interface JsonUtil {
    sayHello(name?: string): string;
    // TODO: Add additional JsonUtil method declarations here
    // exampleMethod(input: string): any;
  }
}

// --- Extend XmlUtil types ---
declare module "../core/utils/xml-utils" {
  interface XmlUtil {
    sayHello(name?: string): string;
    // TODO: Add additional XmlUtil method declarations here
    // exampleMethod(input: string): any;
  }
}

// --- Extend XJX types ---
declare module "../core/XJX" {
  interface XJX {
    sayHello(name?: string): string;
    // TODO: Add forwarded XJX method declarations here
    // exampleMethod(input: string): any;
  }
}

// =====================================================================================
// Auto-run extension
// =====================================================================================

extendXJXWithTemplate();

// =====================================================================================
// Example usage
//
// import { XJX } from "./XJX";
// import "./extensions/TemplateExtension"; // ← Important! Must import the extension!
// 
// const xjx = new XJX();
// 
// console.log(xjx.sayHello("developer")); 
// // ➔ Hello, developer! (from jsonUtil)
// // =====================================================================================

// =====================================================================================
// END OF FILE
// =====================================================================================
