/**
 * JSONToXML class for converting JSON to XML with consistent namespace handling
 */
import { XMLToJSONConfig } from "./types/types";
import { XMLToJSONError } from "./types/errors";
import { DOMAdapter } from "./DOMAdapter";
import { XMLUtil } from "./utils/XMLUtil";

/**
 * JSONToXML for converting JSON to XML
 */
export class JSONToXML {
  private config: XMLToJSONConfig;

  /**
   * Constructor for JSONToXML
   * @param config Configuration options
   */
  constructor(config: XMLToJSONConfig) {
    this.config = config;
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
        xmlString = XMLUtil.ensureXMLDeclaration(xmlString);
      }

      // Apply pretty printing if enabled
      if (this.config.outputOptions.prettyPrint) {
        xmlString = XMLUtil.prettyPrintXml(xmlString, this.config.outputOptions.indent);
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
              DOMAdapter.createTextNode(child[this.config.propNames.value])
            );
          }
          // CDATA sections
          else if (
            child[this.config.propNames.cdata] !== undefined &&
            this.config.preserveCDATA
          ) {
            element.appendChild(
              DOMAdapter.createCDATASection(
                child[this.config.propNames.cdata]
              )
            );
          }
          // Comments
          else if (
            child[this.config.propNames.comments] !== undefined &&
            this.config.preserveComments
          ) {
            element.appendChild(
              DOMAdapter.createComment(
                child[this.config.propNames.comments]
              )
            );
          }
          // Processing instructions
          else if (
            child[this.config.propNames.instruction] !== undefined &&
            this.config.preserveProcessingInstr
          ) {
            const piData = child[this.config.propNames.instruction];
            const target = piData[this.config.propNames.target];
            const data = piData[this.config.propNames.value] || "";

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