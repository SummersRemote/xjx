/**
 * XMLSerializer class for converting JSON to XML with consistent namespace handling
 */
import { XMLToJSONConfig } from "./types";
import { DEFAULT_CONFIG } from "./config";
import { DOMEnvironment } from './DOMAdapter';

/**
 * XML Serializer for converting JSON to XML
 */
export class XMLSerializerUtil {
  private config: XMLToJSONConfig;
  private serializer: XMLSerializer | null = null;

  /**
   * Constructor for XMLSerializer
   * @param config Configuration options
   */
  constructor(config: Partial<XMLToJSONConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize serializer for browser environment
    if (typeof window !== "undefined") {
      this.serializer = new XMLSerializer();
    } else {
      // Node.js environment - dynamically import would be needed
      throw new Error(
        "Node.js environment detected. You need to use a Node-compatible XML serializer."
      );
    }
  }

  /**
   * Convert JSON object to XML string
   * @param jsonObj JSON object to convert
   * @returns XML string
   */
  public serialize(jsonObj: Record<string, any>): string {
    if (!this.serializer) {
      throw new Error("XML serializer not initialized");
    }

    try {
      const doc = document.implementation.createDocument(null, null, null);
      const rootElement = this.jsonToNode(jsonObj, doc);

      if (rootElement) {
        doc.appendChild(rootElement);
      }

      // Add XML declaration if specified
      let xmlString = this.serializer.serializeToString(doc);
      if (
        this.config.outputOptions.xml.declaration &&
        !xmlString.startsWith("<?xml")
      ) {
        xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
      }

      // Apply pretty printing if enabled
      if (this.config.outputOptions.prettyPrint) {
        xmlString = this.prettyPrintXml(xmlString);
      }

      return xmlString;
    } catch (error) {
      throw new Error(
        `Failed to convert JSON to XML: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert JSON object to DOM node
   * @param jsonObj JSON object to convert
   * @param doc Document for creating elements
   * @returns DOM Element
   */
  private jsonToNode(
    jsonObj: Record<string, any>,
    doc: Document
  ): Element | null {
    if (!jsonObj || typeof jsonObj !== "object") {
      return null;
    }

    // Get the node name (first key in the object)
    const nodeName = Object.keys(jsonObj)[0];
    if (!nodeName) {
      return null;
    }

    const nodeData = jsonObj[nodeName];

    // Create element with namespace if available
    let element: Element;
    const ns = nodeData[this.config.propNames.namespace];
    const prefix = nodeData[this.config.propNames.prefix];

    if (ns && this.config.preserveNamespaces) {
      if (prefix) {
        // Create element with namespace and prefix
        element = doc.createElementNS(ns, `${prefix}:${nodeName}`);
      } else {
        // Create element with namespace but no prefix
        element = doc.createElementNS(ns, nodeName);
      }
    } else {
      // Create element without namespace
      element = doc.createElement(nodeName);
    }

    // Process attributes with consistent namespace handling if enabled
    if (
      this.config.preserveAttributes &&
      nodeData[this.config.propNames.attributes] &&
      Array.isArray(nodeData[this.config.propNames.attributes])
    ) {
      nodeData[this.config.propNames.attributes].forEach(
        (attrObj: Record<string, any>) => {
          const attrName = Object.keys(attrObj)[0];
          if (!attrName) return;

          const attrData = attrObj[attrName];
          const attrValue = attrData[this.config.propNames.value] || "";
          const attrNs = attrData[this.config.propNames.namespace];
          const attrPrefix = attrData[this.config.propNames.prefix];

          // Form qualified name for attribute if it has a prefix
          let qualifiedName = attrName;
          if (attrPrefix && this.config.preserveNamespaces) {
            qualifiedName = `${attrPrefix}:${attrName}`;
          }

          if (attrNs && this.config.preserveNamespaces) {
            // Set attribute with namespace
            element.setAttributeNS(attrNs, qualifiedName, attrValue);
          } else {
            // Set attribute without namespace
            element.setAttribute(qualifiedName, attrValue);
          }
        }
      );
    }

    // Process simple text value
    if (nodeData[this.config.propNames.value] !== undefined) {
      element.textContent = nodeData[this.config.propNames.value];
    }

    // Process children
    if (
      nodeData[this.config.propNames.children] &&
      Array.isArray(nodeData[this.config.propNames.children])
    ) {
      nodeData[this.config.propNames.children].forEach(
        (child: Record<string, any>) => {
          // Text nodes
          if (
            child[this.config.propNames.value] !== undefined &&
            this.config.preserveTextNodes
          ) {
            element.appendChild(
              doc.createTextNode(child[this.config.propNames.value])
            );
          }
          // CDATA sections
          else if (
            child[this.config.propNames.cdata] !== undefined &&
            this.config.preserveCDATA
          ) {
            element.appendChild(
              doc.createCDATASection(child[this.config.propNames.cdata])
            );
          }
          // Comments
          else if (
            child[this.config.propNames.comments] !== undefined &&
            this.config.preserveComments
          ) {
            element.appendChild(
              doc.createComment(child[this.config.propNames.comments])
            );
          }
          // Processing instructions
          else if (
            child[this.config.propNames.instruction] !== undefined &&
            this.config.preserveProcessingInstr
          ) {
            const piData = child[this.config.propNames.instruction];
            const target = piData[this.config.propNames.target];
            const data = piData[this.config.propNames.value] || '';
            
            if (target) {
              element.appendChild(
                doc.createProcessingInstruction(target, data)
              );
            }
          }
          // Element nodes (recursive)
          else {
            const childElement = this.jsonToNode(child, doc);
            if (childElement) {
              element.appendChild(childElement);
            }
          }
        }
      );
    }

    return element;
  }

  /**
   * Pretty print an XML string
   * @param xmlString XML string to format
   * @returns Formatted XML string
   */
  private prettyPrintXml(xmlString: string): string {
    const INDENT =
      typeof this.config.outputOptions.indent === "number"
        ? " ".repeat(this.config.outputOptions.indent)
        : "  ";

    const doc = DOMEnvironment.parseFromString(xmlString, 'text/xml');

    const serializer = (node: Node, level = 0): string => {
      const pad = INDENT.repeat(level);

      switch (node.nodeType) {
        case Node.ELEMENT_NODE: {
          const el = node as Element;
          const tagName = el.tagName;
          const attrs = Array.from(el.attributes)
            .map((a) => `${a.name}="${a.value}"`)
            .join(" ");
          const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;

          const children = Array.from(el.childNodes);
          if (children.length === 0) {
            return `${pad}${openTag.replace(/>$/, " />")}\n`;
          }

          // Single text node: print inline
          if (
            children.length === 1 &&
            children[0].nodeType === Node.TEXT_NODE &&
            children[0].textContent?.trim() !== ""
          ) {
            return `${pad}${openTag}${children[0].textContent}</${tagName}>\n`;
          }

          const inner = children
            .map((child) => serializer(child, level + 1))
            .join("");
          return `${pad}${openTag}\n${inner}${pad}</${tagName}>\n`;
        }

        case Node.TEXT_NODE: {
          const text = node.textContent?.trim();
          return text ? `${pad}${text}\n` : "";
        }

        case Node.CDATA_SECTION_NODE:
          return `${pad}<![CDATA[${node.nodeValue}]]>\n`;

        case Node.COMMENT_NODE:
          return `${pad}<!--${node.nodeValue}-->\n`;

        case Node.PROCESSING_INSTRUCTION_NODE:
          const pi = node as ProcessingInstruction;
          return `${pad}<?${pi.target} ${pi.data}?>\n`;

        case Node.DOCUMENT_NODE:
          return Array.from(node.childNodes)
            .map((child) => serializer(child, level))
            .join("");

        default:
          return "";
      }
    };

    return serializer(doc).trim();
  }
}