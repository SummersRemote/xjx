/**
 * JSONUtil - Utility functions for JSON processing
 */
import { Configuration } from "../types/types";

export class JSONUtil {
  private config: Configuration;

  /**
   * Constructor for JSONUtil
   * @param config Configuration options
   */
  constructor(config: Configuration) {
    this.config = config;
  }

  /**
   * Safely retrieves a value from a JSON object using a dot-separated path.
   * Automatically traverses into children arrays and flattens results.
   *
   * @param obj The input JSON object
   * @param path The dot-separated path string (e.g., "root.item.description.$val")
   * @param fallback Value to return if the path does not resolve
   * @returns Retrieved value or fallback
   */
  getPath(
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
   * Falls back to searching children for matching keys.
   *
   * @param obj The current object
   * @param segment The path segment to resolve
   * @returns Resolved value or undefined
   */
  private resolveSegment(obj: any, segment: string): any {
    if (obj == null || typeof obj !== "object") return undefined;

    // Direct property access
    if (segment in obj) {
      return obj[segment];
    }

    // Check if this is a special property name that matches the config
    if (
      segment === this.config.propNames.value ||
      segment === this.config.propNames.children ||
      segment === this.config.propNames.attributes ||
      segment === this.config.propNames.namespace ||
      segment === this.config.propNames.prefix ||
      segment === this.config.propNames.cdata ||
      segment === this.config.propNames.comments ||
      segment === this.config.propNames.instruction ||
      segment === this.config.propNames.target
    ) {
      const configKey = Object.entries(this.config.propNames).find(
        ([_, value]) => value === segment
      )?.[0];

      if (configKey && obj[segment] !== undefined) {
        return obj[segment];
      }
    }

    // Check children for objects that contain the segment
    const childrenKey = this.config.propNames.children;
    const children = obj[childrenKey];
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
  objectToXJX(obj: any, root?: any): any {
    const wrappedObject = this.wrapObject(obj);

    if (typeof root === "string") {
      // Root is a simple string: wrap result with this root tag
      return { [root]: wrappedObject };
    }

    if (root && typeof root === "object") {
      // Handle root with config-based keys
      const elementName = root.name || "root"; // Default to "root" if no name is provided
      const prefix = root[this.config.propNames.prefix] || "";
      const qualifiedName = prefix ? `${prefix}:${elementName}` : elementName;

      const result: any = {
        [qualifiedName]: {},
      };

      // Add attributes to the root element if defined
      const attrsKey = this.config.propNames.attributes;
      if (root[attrsKey] && Array.isArray(root[attrsKey])) {
        result[qualifiedName][attrsKey] = root[attrsKey];
      }

      // Merge existing children with the new generated children
      const childrenKey = this.config.propNames.children;
      const children = root[childrenKey] ? root[childrenKey] : [];
      result[qualifiedName][childrenKey] = [
        ...children,
        { [elementName]: wrappedObject },
      ];

      // Add namespace and prefix if defined
      const nsKey = this.config.propNames.namespace;
      if (root[nsKey]) {
        result[qualifiedName][nsKey] = root[nsKey];
      }

      if (prefix && root[nsKey]) {
        result[qualifiedName][`xmlns:${prefix}`] = root[nsKey];
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
  private wrapObject(value: any): any {
    const valKey = this.config.propNames.value;
    const childrenKey = this.config.propNames.children;

    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return { [valKey]: value };
    }

    if (Array.isArray(value)) {
      // For arrays, wrap each item and return as a children-style array of repeated elements
      return {
        [childrenKey]: value.map((item) => {
          return this.wrapObject(item);
        }),
      };
    }

    if (typeof value === "object") {
      // It's an object: wrap its properties in children
      const children = Object.entries(value).map(([key, val]) => ({
        [key]: this.wrapObject(val),
      }));

      return { [childrenKey]: children };
    }

    return undefined; // Fallback for unhandled types
  }

  /**
   * Check if an object is empty
   * @param value Value to check
   * @returns true if empty
   */
  isEmpty(value: any): boolean {
    if (value == null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Safely stringify JSON for debugging
   * @param obj Object to stringify
   * @param indent Optional indentation level
   * @returns JSON string representation
   */
  safeStringify(obj: any, indent: number = 2): string {
    try {
      return JSON.stringify(obj, null, indent);
    } catch (error) {
      return "[Cannot stringify object]";
    }
  }

  /**
   * Deep clone an object
   * @param obj Object to clone
   * @returns Cloned object
   */
  deepClone(obj: any): any {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      throw new Error(
        `Failed to deep clone object: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Deep merge two objects with proper type handling
   * @param target Target object
   * @param source Source object
   * @returns Merged object (target is modified)
   */
  deepMerge<T>(target: T, source: Partial<T>): T {
    if (!source || typeof source !== "object" || source === null) {
      return target;
    }

    if (!target || typeof target !== "object" || target === null) {
      return source as unknown as T;
    }

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key as keyof Partial<T>];
      const targetValue = target[key as keyof T];

      // If both source and target values are objects, recursively merge them
      if (
        sourceValue !== null &&
        targetValue !== null &&
        typeof sourceValue === "object" &&
        typeof targetValue === "object" &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue)
      ) {
        // Recursively merge the nested objects
        (target as any)[key] = this.deepMerge(targetValue, sourceValue as any);
      } else {
        // Otherwise just replace the value
        (target as any)[key] = sourceValue;
      }
    });

    return target;
  }

  /**
   * Generates a JSON schema that matches the current configuration
   * @returns JSON schema object
   */
  generateJsonSchema(): Record<string, any> {
    try {
      const propNames = this.config.propNames;
      const compact = this.config.outputOptions.compact || false;
      const preserveNamespaces = this.config.preserveNamespaces;
      const preserveComments = this.config.preserveComments;
      const preserveCDATA = this.config.preserveCDATA;
      const preserveProcessingInstr = this.config.preserveProcessingInstr;
      const preserveTextNodes = this.config.preserveTextNodes;
      const preserveWhitespace = this.config.preserveWhitespace;
      const preserveAttributes = this.config.preserveAttributes;

      // Determine which properties are required based on the configuration
      const requiredProps: string[] = [];

      if (!compact) {
        // Only add collections as required if they're preserved in the config
        if (preserveAttributes) requiredProps.push(propNames.attributes);

        if (preserveCDATA) requiredProps.push(propNames.cdata);
        if (preserveComments) requiredProps.push(propNames.comments);
        if (preserveProcessingInstr) requiredProps.push(propNames.instruction);
        requiredProps.push(propNames.children);

        if (preserveTextNodes) {
          requiredProps.push(propNames.value);

          if (preserveNamespaces) {
            requiredProps.push(propNames.namespace);
            // Note: prefix is not required as it may not be present for all elements
          }
        }
      }

      // Create schema for element properties
      const elementProperties: Record<string, any> = {};

      // Add namespace property if preserving namespaces
      if (preserveNamespaces) {
        elementProperties[propNames.namespace] = {
          description: "Namespace URI of the element",
          type: "string",
        };

        // Add prefix property if preserving namespaces
        elementProperties[propNames.prefix] = {
          description: "Namespace prefix of the element",
          type: "string",
        };
      }

      // Add value property if preserving text nodes
      if (preserveTextNodes) {
        elementProperties[propNames.value] = {
          description: "Text content of the element",
          type: "string",
        };
      }

      // Add attributes property
      if (preserveAttributes) {
        elementProperties[propNames.attributes] = {
          description: "Element attributes",
          type: "array",
          items: {
            type: "object",
            patternProperties: {
              "^.*$": {
                type: "object",
                properties: {
                  [propNames.value]: {
                    description: "Attribute value",
                    type: "string",
                  },
                },
                required: [propNames.value],
              },
            },
            additionalProperties: false,
          },
        };

        // If preserving namespaces, add namespace properties to attribute schema
        if (preserveNamespaces) {
          const attrProps =
            elementProperties[propNames.attributes].items.patternProperties[
              "^.*$"
            ].properties;

          attrProps[propNames.namespace] = {
            description: "Namespace URI of the attribute",
            type: "string",
          };

          attrProps[propNames.prefix] = {
            description: "Namespace prefix of the attribute",
            type: "string",
          };
        }
      }

      // Add CDATA property if preserving CDATA
      if (preserveCDATA) {
        elementProperties[propNames.cdata] = {
          description: "CDATA section content",
          type: "string",
        };
      }

      // Add comments property if preserving comments
      if (preserveComments) {
        elementProperties[propNames.comments] = {
          description: "Comment content",
          type: "string",
        };
      }

      // Add processing instructions property if preserving them
      if (preserveProcessingInstr) {
        elementProperties[propNames.instruction] = {
          description: "Processing instruction",
          type: "object",
          properties: {
            [propNames.target]: {
              description: "Processing instruction target",
              type: "string",
            },
            [propNames.value]: {
              description: "Processing instruction content",
              type: "string",
            },
          },
          required: [propNames.target],
        };
      }

      // Add children property with recursive schema
      elementProperties[propNames.children] = {
        description: "Child elements",
        type: "array",
        items: {
          type: "object",
          patternProperties: {
            "^.*$": {
              $ref: "#/definitions/element",
            },
          },
          additionalProperties: false,
        },
      };

      // Create element definition (will be referenced recursively)
      const elementDefinition = {
        type: "object",
        properties: elementProperties,
        required: requiredProps,
        additionalProperties: false,
      };

      // Build the complete schema
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        title: "XJX JSON Schema",
        description:
          "Schema for JSON representation of XML documents using the XJX library",
        type: "object",
        patternProperties: {
          "^.*$": {
            $ref: "#/definitions/element",
          },
        },
        additionalProperties: false,
        definitions: {
          element: elementDefinition,
        },
      };

      return schema;
    } catch (error) {
      throw new Error(
        `Schema generation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Generate an example JSON object based on the schema
   * @param {string} rootName - Name of the root element
   * @returns {Record<string, any>} - Example JSON object
   */
  generateExample(rootName: string = "root"): Record<string, any> {
    const propNames = this.config.propNames;
    const preserveNamespaces = this.config.preserveNamespaces;
    const preserveComments = this.config.preserveComments;
    const preserveCDATA = this.config.preserveCDATA;
    const preserveProcessingInstr = this.config.preserveProcessingInstr;
    const preserveAttributes = this.config.preserveAttributes;

    // Simple example with common features
    const example: Record<string, any> = {
      [rootName]: {
        [propNames.value]: "Root content",
        [propNames.children]: [
          {
            child: {
              [propNames.value]: "Child content",
            },
          },
        ],
      },
    };

    // Add namespace properties if enabled
    if (preserveNamespaces) {
      example[rootName][propNames.namespace] = "http://example.org/ns";
      example[rootName][propNames.prefix] = "ex";
      example[rootName][propNames.children][0].child[propNames.namespace] =
        "http://example.org/ns";
      example[rootName][propNames.children][0].child[propNames.prefix] = "ex";
    }

    // Add attributes if enabled
    if (preserveAttributes) {
      example[rootName][propNames.attributes] = [
        { id: { [propNames.value]: "root-1" } },
        { lang: { [propNames.value]: "en" } },
      ];

      if (preserveNamespaces) {
        example[rootName][propNames.attributes][1].lang[propNames.prefix] =
          "xml";
      }

      example[rootName][propNames.children][0].child[propNames.attributes] = [
        { id: { [propNames.value]: "child-1" } },
      ];
    }

    // Add CDATA if enabled
    if (preserveCDATA) {
      example[rootName][propNames.children][0].child[propNames.children] = [
        { [propNames.cdata]: "<data>Raw content</data>" },
      ];
    }

    // Add comments if enabled
    if (preserveComments) {
      if (!example[rootName][propNames.children][0].child[propNames.children]) {
        example[rootName][propNames.children][0].child[propNames.children] = [];
      }

      example[rootName][propNames.children][0].child[propNames.children].push({
        [propNames.comments]: "Comment about the child",
      });
    }

    // Add processing instruction if enabled
    if (preserveProcessingInstr) {
      if (!example[rootName][propNames.children]) {
        example[rootName][propNames.children] = [];
      }

      example[rootName][propNames.children].unshift({
        [propNames.instruction]: {
          [propNames.target]: "xml-stylesheet",
          [propNames.value]: 'type="text/css" href="style.css"',
        },
      });
    }

    return example;
  }
}
