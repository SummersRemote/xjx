// =====================================================================================
// ExtensionTemplate.ts
//
// This file provides a *template* for creating extensions to JsonUtil or XmlUtil.
//
// - It demonstrates best practices for XJX extensions: safe prototype patching, type
//   augmentation, and automatic registration.
// - Developers should COPY this file when writing their own extensions.
// - Follow the marked "TODO" areas to implement your custom functionality.
// =====================================================================================

// --- Import the utilities you want to extend ---
import { JsonUtil } from "../core/utils/json-utils";
import { XmlUtil } from "../core/utils/xml-utils";

// --- (Optional) Import types if needed ---
// import { JSONObject } from "../core/types/json-types";

/**
 * ExtensionTemplate
 *
 * - Use this function to extend JsonUtil and/or XmlUtil with additional methods.
 * - It safely adds methods if they do not already exist.
 * - It runs automatically at module load time, ensuring your extension is applied.
 *
 * @pure
 */
export function extendUtilWithTemplate() {
  // --- Internal helper to patch a utility prototype ---
  function patchPrototype(proto: any, utilName: string) {
    // Guard: Only patch if the method does not already exist
    if (typeof proto.sayHello !== "function") {
      Object.assign(proto, {
        /**
         * sayHello
         *
         * A placeholder example method. Replace this with your actual method.
         *
         * @param name Optional name to personalize the greeting.
         * @returns A friendly greeting string.
         */
        sayHello(this: any, name: string = "XJX"): string {
          return `Hello, ${name}! You are using ${utilName}.`;
        },

        // =====================================================================================
        // TODO: Add your own methods here!
        // Example:
        //
        // myNewMethod(this: any, input: string): JSONObject {
        //   // Your logic here...
        //   return { result: input.toUpperCase() };
        // }
        // =====================================================================================
      });
    }
  }

  // --- Apply patch to JsonUtil ---
  patchPrototype(JsonUtil.prototype, "JsonUtil");

  // --- Apply patch to XmlUtil ---
  patchPrototype(XmlUtil.prototype, "XmlUtil");
}

// --- Automatically apply the extension when this file is imported ---
extendUtilWithTemplate();

// =====================================================================================
// TypeScript Module Augmentation
//
// This part tells TypeScript that new methods exist on JsonUtil and XmlUtil,
// so that IDE auto-completion, type checking, and documentation work properly.
//
// Always keep this section synchronized with the methods you add above!
// =====================================================================================

// --- JsonUtil augmentation ---
declare module "../core/utils/json-utils" {
  interface JsonUtil {
    /**
     * Say hello from JsonUtil.
     * @param name Optional name to personalize the greeting.
     */
    sayHello(name?: string): string;

    // =====================================================================================
    // TODO: Declare your additional JsonUtil methods here.
    //
    // myNewMethod(input: string): JSONObject;
    // =====================================================================================
  }
}

// --- XmlUtil augmentation ---
declare module "../core/utils/xml-utils" {
  interface XmlUtil {
    /**
     * Say hello from XmlUtil.
     * @param name Optional name to personalize the greeting.
     */
    sayHello(name?: string): string;

    // =====================================================================================
    // TODO: Declare your additional XmlUtil methods here.
    //
    // myNewMethod(input: string): JSONObject;
    // =====================================================================================
  }
}

// =====================================================================================
// END OF FILE
//
// Safe: no double-patching.
// Typed: full TypeScript support.
// Auto-Registered: runs at module load.
// Developer Friendly: clear placeholders and copy-paste structure.
// =====================================================================================