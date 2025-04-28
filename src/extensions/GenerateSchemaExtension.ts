import { JSONArray, JSONObject, JSONValue, XMLJSONElement, XMLJSONNode } from "../core/types/json-types";
import { JsonUtil } from "../core/utils/json-utils";
import { extendJsonUtilWithGetPath } from "./GetPathExtension";

/** @pure */
export function extendJsonUtilWithGenerateSchema() {
  // Guard: only patch if not already patched
  if (!("generateSchema" in JsonUtil.prototype)) {
    Object.assign(JsonUtil.prototype, {
      /**
       * Generates a JSON schema that matches the current configuration
       * @returns JSON schema object
       */
      generateJsonSchema(this: JsonUtil): JSONObject {
        
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
            if (preserveProcessingInstr)
              requiredProps.push(propNames.instruction);
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
              const attrPatternProps = (
                elementProperties[propNames.attributes] as JSONObject
              ).items as JSONObject;
              const patternProps = (
                attrPatternProps.patternProperties as JSONObject
              )["^.*$"] as JSONObject;
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
      },

      /**
       * Generate an example JSON object based on the schema
       * @param {string} rootName - Name of the root element
       * @returns {Record<string, any>} - Example JSON object
       */
      generateExample(this: JsonUtil, rootName: string = "root"): XMLJSONNode {

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

          const childElement = (
            rootElement[propNames.children] as unknown as XMLJSONNode[]
          )[0].child;
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
            const attributesArray = rootElement[
              propNames.attributes
            ] as JSONArray;
            if (attributesArray && attributesArray.length > 1) {
              const langAttrObj = attributesArray[1] as JSONObject;
              if (langAttrObj && "lang" in langAttrObj) {
                const langAttr = langAttrObj["lang"] as JSONObject;
                if (langAttr) {
                  langAttr[propNames.prefix] = "xml";
                }
              }
            }
          }

          const childElement = (
            rootElement[propNames.children] as unknown as XMLJSONNode[]
          )[0].child;
          childElement[propNames.attributes] = [
            { id: { [propNames.value]: "child-1" } },
          ] as JSONArray;
        }

        // Add CDATA if enabled
        if (preserveCDATA) {
          const childElement = (
            rootElement[propNames.children] as unknown as XMLJSONNode[]
          )[0].child;
          childElement[propNames.children] = [
            { [propNames.cdata]: "<data>Raw content</data>" },
          ] as unknown as XMLJSONNode[];
        }

        // Add comments if enabled
        if (preserveComments) {
          const childElement = (
            rootElement[propNames.children] as unknown as XMLJSONNode[]
          )[0].child;

          if (!childElement[propNames.children]) {
            childElement[propNames.children] = [] as unknown as XMLJSONNode[];
          }

          const childrenArray = childElement[
            propNames.children
          ] as unknown as JSONArray;
          childrenArray.push({
            [propNames.comments]: "Comment about the child",
          });
        }

        // Add processing instruction if enabled
        if (preserveProcessingInstr) {
          if (!rootElement[propNames.children]) {
            rootElement[propNames.children] = [] as unknown as XMLJSONNode[];
          }

          const childrenArray = rootElement[
            propNames.children
          ] as unknown as JSONArray;
          childrenArray.unshift({
            [propNames.instruction]: {
              [propNames.target]: "xml-stylesheet",
              [propNames.value]: 'type="text/css" href="style.css"',
            },
          });
        }

        return example;
      },
    });
  }
}

// Automatically extend
extendJsonUtilWithGetPath();

// Declare new methods
declare module "../core/utils/json-utils" {
  interface JsonUtil {
    generateJsonSchema(): JSONObject;
    generateExample(rootName?: string): XMLJSONNode;
  }
}
