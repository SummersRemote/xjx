/**
 * JSONToXML class for converting JSON to XML with consistent namespace handling
 */
import { Configuration } from "./types/types";
import { XMLToJSONError } from "./types/errors";
import { DOMAdapter } from "./DOMAdapter";
import { XMLUtil } from "./utils/XMLUtil";

/**
 * JSONToXML for converting JSON to XML
 */
export class JSONToXML {
  private config: Configuration;
  private xmlUtil: XMLUtil;

  /**
   * Constructor for JSONToXML
   * @param config Configuration options
   */
  constructor(config: Configuration) {
    this.config = config;
    this.xmlUtil = new XMLUtil(this.config);
  }

  /**
   * Convert JSON object to XML string
   * @param jsonObj JSON object to convert
   * @returns XML string
   */
  public serialize(jsonObj: Record<string, any>): string {
    try {
      const doc = DOMAdapter.createDocument();
      const rootElement = this.jsonToNode(jsonObj, doc);

      if (rootElement) {
        // Handle the temporary root element if it exists
        if (doc.documentElement && doc.documentElement.nodeName === "temp") {
          doc.replaceChild(rootElement, doc.documentElement);
        } else {
          doc.appendChild(rootElement);
        }
      }

      // Add XML declaration if specified
      let xmlString = DOMAdapter.serializeToString(doc);
      if (this.config.outputOptions.xml.declaration) {
        xmlString = this.xmlUtil.ensureXMLDeclaration(xmlString);
      }

      // Apply pretty printing if enabled
      if (this.config.outputOptions.prettyPrint) {
        xmlString = this.xmlUtil.prettyPrintXml(xmlString);
      }

      return xmlString;
    } catch (error) {
      throw new XMLToJSONError(
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
    const namespaceKey = this.config.propNames.namespace;
    const prefixKey = this.config.propNames.prefix;
    const ns = nodeData[namespaceKey];
    const prefix = nodeData[prefixKey];

    if (ns && this.config.preserveNamespaces) {
      if (prefix) {
        // Create element with namespace and prefix
        element = DOMAdapter.createElementNS(ns, `${prefix}:${nodeName}`);
      } else {
        // Create element with namespace but no prefix
        element = DOMAdapter.createElementNS(ns, nodeName);
      }
    } else {
      // Create element without namespace
      element = DOMAdapter.createElement(nodeName);
    }

    // Process attributes if enabled
    const attributesKey = this.config.propNames.attributes;
    const valueKey = this.config.propNames.value;
    if (
      this.config.preserveAttributes &&
      nodeData[attributesKey] &&
      Array.isArray(nodeData[attributesKey])
    ) {
      nodeData[attributesKey].forEach(
        (attrObj: Record<string, any>) => {
          const attrName = Object.keys(attrObj)[0];
          if (!attrName) return;

          const attrData = attrObj[attrName];
          const attrValue = attrData[valueKey] || "";
          const attrNs = attrData[namespaceKey];
          const attrPrefix = attrData[prefixKey];

          // Form qualified name for attribute if it has a prefix
          let qualifiedName = attrName;
          if (attrPrefix && this.config.preserveNamespaces) {
            qualifiedName = `${attrPrefix}:${attrName}`;
          }

          DOMAdapter.setNamespacedAttribute(
            element, 
            (attrNs && this.config.preserveNamespaces) ? attrNs : null, 
            qualifiedName, 
            attrValue
          );
        }
      );
    }

    // Process simple text value
    if (nodeData[valueKey] !== undefined) {
      element.textContent = nodeData[valueKey];
    }

    // Process children
    const childrenKey = this.config.propNames.children;
    const cdataKey = this.config.propNames.cdata;
    const commentsKey = this.config.propNames.comments;
    const instructionKey = this.config.propNames.instruction;
    const targetKey = this.config.propNames.target;

    if (
      nodeData[childrenKey] &&
      Array.isArray(nodeData[childrenKey])
    ) {
      nodeData[childrenKey].forEach(
        (child: Record<string, any>) => {
          // Text nodes
          if (
            child[valueKey] !== undefined &&
            this.config.preserveTextNodes
          ) {
            element.appendChild(
              DOMAdapter.createTextNode(this.xmlUtil.escapeXML(child[valueKey]))
            );
          }
          // CDATA sections
          else if (
            child[cdataKey] !== undefined &&
            this.config.preserveCDATA
          ) {
            element.appendChild(
              DOMAdapter.createCDATASection(
                child[cdataKey]
              )
            );
          }
          // Comments
          else if (
            child[commentsKey] !== undefined &&
            this.config.preserveComments
          ) {
            element.appendChild(
              DOMAdapter.createComment(
                child[commentsKey]
              )
            );
          }
          // Processing instructions
          else if (
            child[instructionKey] !== undefined &&
            this.config.preserveProcessingInstr
          ) {
            const piData = child[instructionKey];
            const target = piData[targetKey];
            const data = piData[valueKey] || "";

            if (target) {
              element.appendChild(
                DOMAdapter.createProcessingInstruction(target, data)
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
}