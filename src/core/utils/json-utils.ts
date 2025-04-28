/**
 * JSONUtil - Utility functions for JSON processing
 */
import { Configuration } from "../types/config-types";
import { JSONValue, JSONObject, JSONArray, XMLJSONNode, XMLJSONElement } from "../types/json-types";

export class JsonUtil {
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
    obj: JSONObject,
    path: string,
    fallback?: JSONValue
  ): JSONValue {
    const segments = path.split(".");
    let current: JSONValue = obj;

    for (const segment of segments) {
      if (Array.isArray(current)) {
        // Apply the segment to each array element and flatten results
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

    // Collapse singleton arrays
    if (Array.isArray(current) && current.length === 1) {
      return current[0];
    }

    return current;
  }

  /**
   * Resolves a single path segment in the context of a JSON object.
   * Falls back to searching children for matching keys.
   *
   * @param obj The current object
   * @param segment The path segment to resolve
   * @returns Resolved value or undefined
   */
  private resolveSegment(obj: JSONValue, segment: string): JSONValue | undefined {
    if (obj == null || typeof obj !== "object") return undefined;
    
    // Handle arrays separately
    if (Array.isArray(obj)) {
      return undefined; // Already handled in getPath
    }

    const objAsRecord = obj as JSONObject;

    // Direct property access
    if (segment in objAsRecord) {
      return objAsRecord[segment];
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

      if (configKey && objAsRecord[segment] !== undefined) {
        return objAsRecord[segment];
      }
    }

    // Check children for objects that contain the segment
    const childrenKey = this.config.propNames.children;
    const children = objAsRecord[childrenKey];
    if (Array.isArray(children)) {
      const childrenArray = children as JSONArray;
      const matches = childrenArray
        .map((child) => {
          if (typeof child === 'object' && child !== null && !Array.isArray(child)) {
            return segment in (child as JSONObject) ? (child as JSONObject)[segment] : undefined;
          }
          return undefined;
        })
        .filter((v): v is JSONValue => v !== undefined);
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
  objectToXJX(obj: JSONValue, root?: string | JSONObject): XMLJSONNode {
    const wrappedObject = this.wrapObject(obj);

    if (typeof root === "string") {
      // Root is a simple string: wrap result with this root tag
      return { [root]: wrappedObject as XMLJSONElement };
    }

    if (root && typeof root === "object" && !Array.isArray(root)) {
      // Handle root with config-based keys
      const elementName = (root as JSONObject).name as string || "root"; // Default to "root" if no name is provided
      const prefix = (root as JSONObject)[this.config.propNames.prefix] as string || "";
      const qualifiedName = prefix ? `${prefix}:${elementName}` : elementName;

      const result: XMLJSONNode = {
        [qualifiedName]: {} as XMLJSONElement,
      };
      
      const rootElement = result[qualifiedName];

      // Add attributes to the root element if defined
      const attrsKey = this.config.propNames.attributes;
      if (root[attrsKey] && Array.isArray(root[attrsKey])) {
        rootElement[attrsKey] = root[attrsKey] as JSONArray;
      }

      // Merge existing children with the new generated children
      const childrenKey = this.config.propNames.children;
      const children = root[childrenKey] ? root[childrenKey] as JSONArray : [];
      rootElement[childrenKey] = [
        ...children,
        { [elementName]: wrappedObject as XMLJSONElement },
      ] as unknown as XMLJSONNode[];

      // Add namespace and prefix if defined
      const nsKey = this.config.propNames.namespace;
      if (root[nsKey]) {
        rootElement[nsKey] = root[nsKey] as JSONValue;
      }

      if (prefix && root[nsKey]) {
        rootElement[`xmlns:${prefix}`] = root[nsKey] as JSONValue;
      }

      return result;
    }

    // Default behavior if no root is provided
    return wrappedObject as unknown as XMLJSONNode;
  }

  /**
   * Wraps a standard JSON value in the XML-like JSON structure
   * @param value Value to wrap
   * @returns Wrapped value
   */
  private wrapObject(value: JSONValue): JSONObject {
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

    if (typeof value === "object" && value !== null) {
      // It's an object: wrap its properties in children
      const children = Object.entries(value as JSONObject).map(([key, val]) => ({
        [key]: this.wrapObject(val),
      }));

      return { [childrenKey]: children };
    }

    return { }; // Empty object for unsupported types
  }

  /**
   * Check if a value is empty
   * @param value Value to check
   * @returns true if empty
   */
  isEmpty(value: JSONValue): boolean {
    if (value == null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value as JSONObject).length === 0;
    return false;
  }

  /**
   * Safely stringify JSON for debugging
   * @param obj Object to stringify
   * @param indent Optional indentation level
   * @returns JSON string representation
   */
  safeStringify(obj: JSONValue, indent: number = 2): string {
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
deepClone<T>(obj: T): T {
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
deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  if (!source || typeof source !== "object" || source === null) {
    return target;
  }

  if (!target || typeof target !== "object" || target === null) {
    return source as T;
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
      (target as Record<string, any>)[key] = this.deepMerge(
        targetValue as Record<string, any>, 
        sourceValue as Record<string, any>
      );
    } else {
      // Otherwise just replace the value
      (target as Record<string, any>)[key] = sourceValue;
    }
  });

  return target;
}

  /**
   * Generates a JSON schema that matches the current configuration
   * @returns JSON schema object
   */
  generateJsonSchema(): JSONObject {
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
      const elementProperties: JSONObject = {};

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
          const attrPatternProps = (elementProperties[propNames.attributes] as JSONObject)
            .items as JSONObject;
          const patternProps = (attrPatternProps.patternProperties as JSONObject)["^.*$"] as JSONObject;
          const attrProps = patternProps.properties as JSONObject;

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
      const elementDefinition: JSONObject = {
        type: "object",
        properties: elementProperties,
        required: requiredProps,
        additionalProperties: false,
      };

      // Build the complete schema
      const schema: JSONObject = {
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
  generateExample(rootName: string = "root"): XMLJSONNode {
    const propNames = this.config.propNames;
    const preserveNamespaces = this.config.preserveNamespaces;
    const preserveComments = this.config.preserveComments;
    const preserveCDATA = this.config.preserveCDATA;
    const preserveProcessingInstr = this.config.preserveProcessingInstr;
    const preserveAttributes = this.config.preserveAttributes;

    // Simple example with common features
    const example: XMLJSONNode = {
      [rootName]: {
        [propNames.value]: "Root content",
        [propNames.children]: [
          {
            child: {
              [propNames.value]: "Child content",
            } as XMLJSONElement,
          },
        ] as unknown as XMLJSONNode[],
      } as XMLJSONElement,
    };

    const rootElement = example[rootName];

    // Add namespace properties if enabled
    if (preserveNamespaces) {
      rootElement[propNames.namespace] = "http://example.org/ns";
      rootElement[propNames.prefix] = "ex";
      
      const childElement = (rootElement[propNames.children] as unknown as XMLJSONNode[])[0].child;
      childElement[propNames.namespace] = "http://example.org/ns";
      childElement[propNames.prefix] = "ex";
    }

    // Add attributes if enabled
    if (preserveAttributes) {
      rootElement[propNames.attributes] = [
        { id: { [propNames.value]: "root-1" } },
        { lang: { [propNames.value]: "en" } },
      ] as JSONArray;

      // Add XML namespace prefix to lang attribute if namespaces are preserved
      if (preserveNamespaces) {
        const attributesArray = rootElement[propNames.attributes] as JSONArray;
        if (attributesArray && attributesArray.length > 1) {
          const langAttrObj = attributesArray[1] as JSONObject;
          if (langAttrObj && 'lang' in langAttrObj) {
            const langAttr = langAttrObj['lang'] as JSONObject;
            if (langAttr) {
              langAttr[propNames.prefix] = "xml";
            }
          }
        }
      }

      const childElement = (rootElement[propNames.children] as unknown as XMLJSONNode[])[0].child;
      childElement[propNames.attributes] = [
        { id: { [propNames.value]: "child-1" } },
      ] as JSONArray;
    }

    // Add CDATA if enabled
    if (preserveCDATA) {
      const childElement = (rootElement[propNames.children] as unknown as XMLJSONNode[])[0].child;
      childElement[propNames.children] = [
        { [propNames.cdata]: "<data>Raw content</data>" },
      ] as unknown as XMLJSONNode[];
    }

    // Add comments if enabled
    if (preserveComments) {
      const childElement = (rootElement[propNames.children] as unknown as XMLJSONNode[])[0].child;
      
      if (!childElement[propNames.children]) {
        childElement[propNames.children] = [] as unknown as XMLJSONNode[];
      }

      const childrenArray = childElement[propNames.children] as unknown as JSONArray;
      childrenArray.push({
        [propNames.comments]: "Comment about the child",
      });
    }

    // Add processing instruction if enabled
    if (preserveProcessingInstr) {
      if (!rootElement[propNames.children]) {
        rootElement[propNames.children] = [] as unknown as XMLJSONNode[];
      }

      const childrenArray = rootElement[propNames.children] as unknown as JSONArray;
      childrenArray.unshift({
        [propNames.instruction]: {
          [propNames.target]: "xml-stylesheet",
          [propNames.value]: 'type="text/css" href="style.css"',
        },
      });
    }

    return example;
  }
}