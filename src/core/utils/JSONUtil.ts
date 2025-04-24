/**
 * JSONUtil - Utility functions for JSON processing
 */
export class JSONUtil {
  /**
   * Safely retrieves a value from a JSON object using a dot-separated path.
   * Automatically traverses into $children arrays and flattens results.
   *
   * @param obj The input JSON object
   * @param path The dot-separated path string (e.g., "root.item.description.$val")
   * @param fallback Value to return if the path does not resolve
   * @returns Retrieved value or fallback
   */
  static getPath(
    obj: Record<string, any>,
    path: string,
    fallback: any = undefined
  ): any {
    const segments = path.split(".");
    let current: any = obj;

    for (const segment of segments) {
      if (Array.isArray(current)) {
        // Apply the segment to each array element and flatten results
        const results = current
          .map((item) => this.resolveSegment(item, segment))
          .flat()
          .filter((v) => v !== undefined);
        current = results.length > 0 ? results : undefined;
      } else {
        current = this.resolveSegment(current, segment);
      }

      if (current === undefined) return fallback;
    }

    // Collapse singleton arrays
    if (Array.isArray(current) && current.length === 1) {
      return current[0];
    }

    return current !== undefined ? current : fallback;
  }

  /**
   * Resolves a single path segment in the context of a JSON object.
   * Falls back to searching $children for matching keys.
   *
   * @param obj The current object
   * @param segment The path segment to resolve
   * @returns Resolved value or undefined
   */
  private static resolveSegment(obj: any, segment: string): any {
    if (obj == null || typeof obj !== "object") return undefined;

    if (segment in obj) {
      return obj[segment];
    }

    // Check $children for objects that contain the segment
    const children = obj["$children"];
    if (Array.isArray(children)) {
      const matches = children
        .map((child) => (segment in child ? child[segment] : undefined))
        .filter((v) => v !== undefined);
      return matches.length > 0 ? matches : undefined;
    }

    return undefined;
  }

  /**
   * Converts a plain JSON object to the XML-like JSON structure.
   * Optionally wraps the result in a root element with attributes and namespaces.
   *
   * @param obj Standard JSON object
   * @param root Optional root element configuration (either a string or object with $ keys)
   * @returns XML-like JSON object
   */
  static fromJSONObject(obj: any, root?: any): any {
    const wrappedObject = this.wrapObject(obj);

    if (typeof root === "string") {
      // Root is a simple string: wrap result with this root tag
      return { [root]: wrappedObject };
    }

    if (root && typeof root === "object") {
      // Handle root with $ keys like $ns, $pre, $attrs
      const elementName = root.name || "root"; // Default to "root" if no name is provided
      const prefix = root.$pre || "";
      const qualifiedName = prefix ? `${prefix}:${elementName}` : elementName;

      const result: any = {
        [qualifiedName]: {},
      };

      // Add $attrs to the root element if defined
      if (root.$attrs && Array.isArray(root.$attrs)) {
        result[qualifiedName].$attrs = root.$attrs;
      }

      // Merge existing $children with the new generated children
      const children = root.$children ? root.$children : [];
      result[qualifiedName].$children = [
        ...children,
        { [elementName]: wrappedObject },
      ];

      // Add namespace and prefix if defined
      if (root.$ns) {
        result[qualifiedName].$ns = root.$ns;
      }

      if (prefix && root.$ns) {
        result[qualifiedName][`xmlns:${prefix}`] = root.$ns;
      }

      return result;
    }

    // Default behavior if no root is provided
    return wrappedObject;
  }

  /**
   * Wraps a standard JSON value in the XML-like JSON structure
   * @param value Value to wrap
   * @returns Wrapped value
   */
  private static wrapObject(value: any): any {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return { $val: value };
    }

    if (Array.isArray(value)) {
      // For arrays, wrap each item and return as a $children-style array of repeated elements
      return {
        $children: value.map((item) => {
          return this.wrapObject(item);
        }),
      };
    }

    if (typeof value === "object") {
      // It's an object: wrap its properties in $children
      const children = Object.entries(value).map(([key, val]) => ({
        [key]: this.wrapObject(val),
      }));

      return { $children: children };
    }

    return undefined; // Fallback for unhandled types
  }

  /**
   * Check if an object is empty
   * @param value Value to check
   * @returns true if empty
   */
  static isEmpty(value: any): boolean {
    if (value == null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Safely stringify JSON for debugging
   * @param obj Object to stringify
   * @param indent Optional indentation level
   * @returns JSON string representation
   */
  static safeStringify(obj: any, indent: number = 2): string {
    try {
      return JSON.stringify(obj, null, indent);
    } catch (error) {
      return '[Cannot stringify object]';
    }
  }

  /**
   * Deep clone an object
   * @param obj Object to clone
   * @returns Cloned object
   */
  static deepClone(obj: any): any {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      throw new Error(`Failed to deep clone object: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Deep merge two objects
   * @param target Target object
   * @param source Source object
   * @returns Merged object (target is modified)
   */
  static deepMerge(target: any, source: any): any {
    if (typeof source !== 'object' || source === null) {
      return target;
    }

    if (typeof target !== 'object' || target === null) {
      return this.deepClone(source);
    }

    Object.keys(source).forEach(key => {
      if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = this.deepClone(source[key]);
      }
    });

    return target;
  }
}