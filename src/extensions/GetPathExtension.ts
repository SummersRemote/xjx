import { JSONObject, JSONValue } from "../core/types/json-types";
import { JsonUtil } from "../core/utils/json-utils";

/** @pure */
export function extendJsonUtilWithGetPath() {
  // Guard: only patch if not already patched
  if (!("getPath" in JsonUtil.prototype)) {
    Object.assign(JsonUtil.prototype, {
      getPath(this: JsonUtil, obj: JSONObject, path: string, fallback?: JSONValue): JSONValue {
        const segments = path.split(".");
        let current: JSONValue = obj;

        for (const segment of segments) {
          if (Array.isArray(current)) {
            const results: JSONValue[] = current
              .map((item) => this.resolveSegment(item, segment))
              .flat()
              .filter((v): v is JSONValue => v !== undefined);

            if (results.length === 0) {
              return fallback as JSONValue;
            }
            current = results;
          } else {
            const resolved = this.resolveSegment(current, segment);
            if (resolved === undefined) {
              return fallback as JSONValue;
            }
            current = resolved;
          }
        }

        if (Array.isArray(current) && current.length === 1) {
          return current[0];
        }

        return current;
      },

      resolveSegment(this: JsonUtil, obj: JSONValue, segment: string): JSONValue | undefined {
        if (obj == null || typeof obj !== "object") return undefined;
        if (Array.isArray(obj)) return undefined;

        const objAsRecord = obj as JSONObject;

        if (segment in objAsRecord) {
          return objAsRecord[segment];
        }

        // Access config safely now that it's protected
        const specialProps = Object.values(this.config.propNames);
        if (specialProps.includes(segment) && objAsRecord[segment] !== undefined) {
          return objAsRecord[segment];
        }

        const childrenKey = this.config.propNames.children;
        const children = objAsRecord[childrenKey];
        if (Array.isArray(children)) {
          const matches = children
            .map((child) => {
              if (typeof child === "object" && child !== null && !Array.isArray(child)) {
                return segment in child ? (child as JSONObject)[segment] : undefined;
              }
              return undefined;
            })
            .filter((v): v is JSONValue => v !== undefined);

          return matches.length > 0 ? matches : undefined;
        }

        return undefined;
      }
    });
  }
}

// Automatically extend
extendJsonUtilWithGetPath();

// Declare new methods
declare module "../core/utils/json-utils" {
  interface JsonUtil {
    getPath(obj: JSONObject, path: string, fallback?: JSONValue): JSONValue;
    resolveSegment(obj: JSONValue, segment: string): JSONValue | undefined;
  }
}