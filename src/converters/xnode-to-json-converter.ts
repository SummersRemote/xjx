/**
 * XNode to JSON converter implementation
 *
 * Converts XNode to JSON object using the context-sensitive approach.
 */
import { XNodeToJsonConverter } from "./converter-interfaces";
import { Configuration } from "../core/types/config-types";
import { NodeType } from "../core/types/dom-types";
import { ErrorUtils } from "../core/utils/error-utils";
import { JsonUtils } from "../core/utils/json-utils";
import { XNode } from "../core/models/xnode";

/**
 * Converts XNode to JSON object
 */
export class DefaultXNodeToJsonConverter implements XNodeToJsonConverter {
  private config: Configuration;
  private repeatedElements: Set<string> = new Set();
  private namespaceMap: Record<string, string> = {};

  /**
   * Create a new converter
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }

  /**
   * Convert XNode to JSON object
   * @param node XNode representation
   * @returns JSON object
   */
  public convert(node: XNode): Record<string, any> {
    return ErrorUtils.try(
      () => {
        // Reset tracking variables
        this.repeatedElements = new Set();
        this.namespaceMap = {};

        // Pre-scan for repeated elements if needed
        if (this.config.alwaysUseArrays) {
          this.scanForRepeatedElements(node);
        }

        // Perform the conversion
        let jsonResult = this.xnodeToJson(node);

        // Apply compact mode if configured
        if (this.config.outputOptions.compact) {
          const compactedJson = JsonUtils.compactJson(jsonResult);

          // If compaction returns undefined (completely empty), return an empty object
          if (compactedJson === undefined) {
            return {};
          }

          jsonResult = compactedJson as Record<string, any>;
        }

        return jsonResult;
      },
      "Failed to convert XNode to JSON",
      "xml-to-json"
    );
  }

  /**
   * Scan for elements that appear multiple times under the same parent
   * @param node Root node to scan
   */
  private scanForRepeatedElements(node: XNode): void {
    if (!node.children) return;

    // Count elements by name
    const elementCounts = new Map<string, number>();

    // Process element nodes from children
    const elementNodes = node.children.filter(
      (child) => child.type === NodeType.ELEMENT_NODE
    );

    // Count occurrences of element names
    for (const child of elementNodes) {
      const key = this.getNodeKey(child);
      const count = (elementCounts.get(key) || 0) + 1;
      elementCounts.set(key, count);

      // Mark as repeated if count > 1
      if (count > 1) {
        this.repeatedElements.add(key);
      }

      // Recursively scan child's children
      this.scanForRepeatedElements(child);
    }
  }

  /**
   * Get the node key (name with namespace prefix if present)
   * @param node Node to get key for
   * @returns Node key
   */
  private getNodeKey(node: XNode): string {
    if (node.prefix && this.config.preserveNamespaces) {
      return `${node.prefix}:${node.name}`;
    }
    return node.name;
  }

  /**
   * Convert XNode to JSON
   * @param node XNode to convert
   * @returns JSON object
   */
  private xnodeToJson(node: XNode): Record<string, any> {
    // Handle different node types
    switch (node.type) {
      case NodeType.ELEMENT_NODE:
        return this.elementToJson(node);

      case NodeType.COMMENT_NODE:
        if (this.config.preserveComments) {
          return {
            [`${this.config.propNames.commentKey}`]: node.value || "",
          };
        }
        return {};

      case NodeType.PROCESSING_INSTRUCTION_NODE:
        return this.piToJson(node);

      case NodeType.CDATA_SECTION_NODE:
        return { [this.config.propNames.cdataKey]: node.value || "" };

      case NodeType.TEXT_NODE:
        return { "#text": this.normalizeText(node.value || "") };

      default:
        // Unknown node type
        return {};
    }
  }

  /**
   * Convert element node to JSON
   * @param node Element node
   * @returns JSON object
   */
  private elementToJson(node: XNode): Record<string, any> {
    // Create result object
    const result: Record<string, any> = {};

    // Get qualified name with prefix if present and namespace preservation is enabled
    const nodeName =
      this.config.preserveNamespaces && node.prefix
        ? `${node.prefix}:${node.name}`
        : node.name;

    // Process element content
    const analysis = this.analyzeNodeContent(node);
    let elementValue: any;

    // Process attributes if present
    const attributes = this.processAttributes(node);

    // Handle content based on type
    if (analysis.isEmpty) {
      // Empty element
      elementValue = this.config.emptyElementValue;

      // If there are attributes, element value must be an object
      if (attributes) {
        elementValue = { [this.config.propNames.attributesKey]: attributes };
      }
    } else if (analysis.hasOnlyText) {
      // Element with text only
      const text = this.getNodeContent(node);

      if (attributes) {
        // Element with both attributes and text
        elementValue = {
          [this.config.propNames.attributesKey]: attributes,
          [this.config.propNames.textKey]: text,
        };
      } else {
        // Simple text element
        elementValue = text;
      }
    } else if (analysis.hasMixedContent) {
      // Element with mixed content
      elementValue = {
        [this.config.propNames.contentKey]: this.processMixedContent(node),
      };

      if (attributes) {
        elementValue[this.config.propNames.attributesKey] = attributes;
      }
    } else if (analysis.hasCDATA) {
      // Element with CDATA
      const cdata = this.getNodeCDATAContent(node);

      if (attributes) {
        elementValue = {
          [this.config.propNames.attributesKey]: attributes,
          [this.config.propNames.cdataKey]: cdata,
        };
      } else {
        elementValue = { [this.config.propNames.cdataKey]: cdata };
      }
    } else {
      // Element with child elements
      elementValue = this.processChildElements(node);

      if (attributes) {
        elementValue[this.config.propNames.attributesKey] = attributes;
      }
    }

    // Set the result
    result[nodeName] = elementValue;
    return result;
  }

  /**
   * Convert processing instruction to JSON
   * @param node Processing instruction node
   * @returns JSON object
   */
  private piToJson(node: XNode): Record<string, any> {
    const target = node.attributes?.target || "xml";
    const piKey = `${this.config.propNames.processingInstrKey}${target}`;

    const attrs = this.processInstructionAttributes(node);
    return {
      [piKey]: {
        [this.config.propNames.attributesKey]: attrs,
      },
    };
  }

  /**
   * Process attributes
   * @param node Node with attributes
   * @returns Attributes object or null if no attributes
   */
  private processAttributes(node: XNode): Record<string, any> | null {
    if (!node.attributes || Object.keys(node.attributes).length === 0) {
      return null;
    }

    const result: Record<string, any> = {};

    // Process regular attributes
    for (const [name, value] of Object.entries(node.attributes)) {
      // Skip xmlns attributes if not preserving namespaces
      if (
        !this.config.preserveNamespaces &&
        (name === "xmlns" || name.startsWith("xmlns:"))
      ) {
        continue;
      }

      result[name] = value;
    }

    // Add namespace declarations if preserving namespaces
    if (this.config.preserveNamespaces && node.namespaceDeclarations) {
      for (const [prefix, uri] of Object.entries(node.namespaceDeclarations)) {
        const nsName = prefix === "" ? "xmlns" : `xmlns:${prefix}`;
        result[nsName] = uri;

        // Update namespace map for reference
        this.namespaceMap[prefix] = uri;
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  /**
   * Process mixed content
   * @param node Node with mixed content
   * @returns Array of mixed content items
   */
  private processMixedContent(node: XNode): any[] {
    if (!node.children) {
      return [];
    }

    const result: any[] = [];

    for (const child of node.children) {
      switch (child.type) {
        case NodeType.TEXT_NODE:
          // Text node
          const text = this.normalizeText(child.value || "");

          if (text) {
            result.push(text);
          }
          break;

        case NodeType.CDATA_SECTION_NODE:
          // CDATA section
          result.push({
            [this.config.propNames.cdataKey]: child.value || "",
          });
          break;

        case NodeType.ELEMENT_NODE:
          // Element node
          const childJson = this.xnodeToJson(child);
          result.push(childJson);
          break;

        case NodeType.COMMENT_NODE:
          // Comment node
          if (this.config.preserveComments) {
            result.push({
              [this.config.propNames.commentKey]: child.value || "",
            });
          }
          break;
      }
    }

    return result;
  }

  /**
   * Process child elements
   * @param node Parent node
   * @returns Object with child elements
   */
  private processChildElements(node: XNode): Record<string, any> {
    const result: Record<string, any> = {};

    if (!node.children) {
      return result;
    }

    // Group child elements by name
    const elementsByName = new Map<string, XNode[]>();

    // First pass - group elements by name
    for (const child of node.children) {
      if (child.type === NodeType.ELEMENT_NODE) {
        const key =
          this.config.preserveNamespaces && child.prefix
            ? `${child.prefix}:${child.name}`
            : child.name;

        const elements = elementsByName.get(key) || [];
        elements.push(child);
        elementsByName.set(key, elements);
      } else if (
        child.type === NodeType.COMMENT_NODE &&
        this.config.preserveComments
      ) {
        // Handle comments
        if (!result[this.config.propNames.commentKey]) {
          result[this.config.propNames.commentKey] = child.value || "";
        } else if (Array.isArray(result[this.config.propNames.commentKey])) {
          result[this.config.propNames.commentKey].push(child.value || "");
        } else {
          result[this.config.propNames.commentKey] = [
            result[this.config.propNames.commentKey],
            child.value || "",
          ];
        }
      }
    }

    // Second pass - process grouped elements
    for (const [key, elements] of elementsByName.entries()) {
      // Check if this element appears multiple times or if alwaysUseArrays is true
      if (
        elements.length > 1 ||
        this.repeatedElements.has(key) ||
        this.config.alwaysUseArrays
      ) {
        // Multiple occurrences - use array
        result[key] = elements.map((element) => {
          const converted = this.xnodeToJson(element);
          return converted[key];
        });
      } else {
        // Single occurrence - direct property
        const converted = this.xnodeToJson(elements[0]);
        result[key] = converted[key];
      }
    }

    return result;
  }

  /**
   * Process processing instruction attributes
   * @param node Processing instruction node
   * @returns Attributes object
   */
  private processInstructionAttributes(node: XNode): Record<string, any> {
    const result: Record<string, any> = {};

    if (!node.value) {
      return result;
    }

    // Simple attribute parser for processing instructions
    // e.g., 'type="text/css" href="style.css"'
    const attrRegex = /([^\s=]+)=["']([^"']*)["']/g;
    let match;

    while ((match = attrRegex.exec(node.value)) !== null) {
      const [, name, value] = match;
      result[name] = value;
    }

    return result;
  }

  /**
   * Analyze node content to determine its structure
   * @param node Node to analyze
   * @returns Analysis result
   */
  private analyzeNodeContent(node: XNode): {
    isEmpty: boolean;
    hasOnlyText: boolean;
    hasMixedContent: boolean;
    hasCDATA: boolean;
  } {
    // Check for direct value (simple text optimization)
    const hasDirectValue =
      node.value !== undefined && typeof node.value !== "object";

    // Element with direct value has only text
    if (hasDirectValue) {
      return {
        isEmpty: false,
        hasOnlyText: true,
        hasMixedContent: false,
        hasCDATA: false,
      };
    }

    // Check if node has no children
    const isEmpty = !node.children || node.children.length === 0;

    if (isEmpty) {
      return {
        isEmpty: true,
        hasOnlyText: false,
        hasMixedContent: false,
        hasCDATA: false,
      };
    }

    // Analyze children
    let hasText = false;
    let hasElements = false;
    let hasCDATA = false;

    for (const child of node.children!) {
      switch (child.type) {
        case NodeType.TEXT_NODE:
          // Count non-empty text nodes
          if (child.value && child.value.trim()) {
            hasText = true;
          }
          break;

        case NodeType.ELEMENT_NODE:
          hasElements = true;
          break;

        case NodeType.CDATA_SECTION_NODE:
          hasCDATA = true;
          hasText = true; // CDATA counts as text content
          break;
      }

      // Early exit if we've found both text and elements
      if (hasText && hasElements) {
        break;
      }
    }

    return {
      isEmpty: false,
      hasOnlyText: (hasText || hasCDATA) && !hasElements,
      hasMixedContent: hasText && hasElements,
      hasCDATA,
    };
  }

  /**
   * Get node content preserving its type (if primitive) or as text
   * @param node Node with content
   * @returns Node content with preserved type
   */
  private getNodeContent(node: XNode): any {
    // Check for direct value - preserve type if primitive
    if (node.value !== undefined && typeof node.value !== "object") {
      // Return the value as is to preserve its type (string, boolean, number)
      return node.value;
    }

    if (!node.children) {
      return "";
    }

    // Combine all text and CDATA nodes
    const text = node.children
      .filter(
        (child) =>
          child.type === NodeType.TEXT_NODE ||
          child.type === NodeType.CDATA_SECTION_NODE
      )
      .map((child) => child.value || "")
      .join("");

    return this.normalizeText(text);
  }

  /**
   * Get CDATA content from node
   * @param node Node with CDATA
   * @returns CDATA content
   */
  private getNodeCDATAContent(node: XNode): string {
    if (!node.children) {
      return "";
    }

    // Find first CDATA node
    const cdataNode = node.children.find(
      (child) => child.type === NodeType.CDATA_SECTION_NODE
    );

    return cdataNode ? cdataNode.value || "" : "";
  }

  /**
   * Normalize text based on whitespace configuration
   * @param text Text to normalize
   * @returns Normalized text
   */
  private normalizeText(text: string): string {
    if (this.config.preserveWhitespace) {
      return text.trim();
    } else {
      // Normalize whitespace - replace sequences with a single space and trim
      return text.trim().replace(/\s+/g, " ");
    }
  }
}