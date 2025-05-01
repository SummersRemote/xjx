// =====================================================================================
// GetJsonSchemaExtension.ts
//
// Extension that adds a `getJsonSchema` method using the registry system
// =====================================================================================

import { ExtensionRegistry } from "../core/extensions/registry";
import { JSONObject } from "../core/types/json-types";
import { XJXError } from "../core/types/error-types";

/**
 * Generate a simple JSON Schema based on current configuration.
 *
 * @param this The XJX instance
 * @returns A basic JSON schema object
 */
function getJsonSchema(this: any): Record<string, any> {
  try {
    const config = this.config;
    const propNames = config.propNames;
    const compact = config.outputOptions.compact || false;
    const preserveNamespaces = config.preserveNamespaces;
    const preserveComments = config.preserveComments;
    const preserveCDATA = config.preserveCDATA;
    const preserveProcessingInstr = config.preserveProcessingInstr;
    const preserveTextNodes = config.preserveTextNodes;
    const preserveWhitespace = config.preserveWhitespace;
    const preserveAttributes = config.preserveAttributes;

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
    throw new XJXError(
      `Schema generation failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Register the utility function
ExtensionRegistry.registerUtility("getJsonSchema", getJsonSchema);

// TypeScript module augmentation for type definitions
declare module "../core/XJX" {
  interface XJX {
    getJsonSchema(): Record<string, any>;
  }
}

// =====================================================================================
// END OF FILE
// =====================================================================================