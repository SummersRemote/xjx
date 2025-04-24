/**
 * XMLToJSON main class with hybrid DOM implementation support
 */
import { XMLToJSONConfig } from "./types";
import { DEFAULT_CONFIG } from "./config";
import { DOMEnvironment } from "./DOMAdapter";

/**
 * XMLToJSON - Main class for XML to JSON transformation
 * Supports both browser and Node.js environments
 */
export class XMLToJSON {
  private config: XMLToJSONConfig;

  /**
   * Constructor for XMLToJSON utility
   * @param config Configuration options
   */
  constructor(config: Partial<XMLToJSONConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Convert XML string to JSON
   * @param xmlString XML content as string
   * @returns JSON object representing the XML content
   */
  public xmlToJson(xmlString: string): Record<string, any> {
    try {
      const xmlDoc = DOMEnvironment.parseFromString(xmlString, "text/xml");

      // Check for parsing errors
      const errors = xmlDoc.getElementsByTagName("parsererror");
      if (errors.length > 0) {
        throw new Error(`XML parsing error: ${errors[0].textContent}`);
      }

      return this.nodeToJson(xmlDoc.documentElement);
    } catch (error) {
      throw new Error(
        `Failed to convert XML to JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert JSON object back to XML string
   * @param jsonObj JSON object to convert
   * @returns XML string
   */
  public jsonToXml(jsonObj: Record<string, any>): string {
    try {
      const doc = DOMEnvironment.createDocument();
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
      let xmlString = DOMEnvironment.serializeToString(doc);
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
   * Convert a DOM node to JSON representation
   * @param node DOM node to convert
   * @returns JSON representation of the node
   */
  private nodeToJson(node: Node): Record<string, any> {
    const result: Record<string, any> = {};

    // Handle element nodes
    if (node.nodeType === DOMEnvironment.nodeTypes.ELEMENT_NODE) {
      const element = node as Element;
      // Use localName instead of nodeName to strip namespace prefix
      const nodeName =
        element.localName ||
        element.nodeName.split(":").pop() ||
        element.nodeName;

      const nodeObj: Record<string, any> = {};

      // Process namespaces if enabled
      if (this.config.preserveNamespaces) {
        const ns = element.namespaceURI;
        if (ns) {
          nodeObj[this.config.propNames.namespace] = ns;
        }

        const prefix = element.prefix;
        if (prefix) {
          nodeObj[this.config.propNames.prefix] = prefix;
        }
      }

      // Process attributes if enabled
      if (this.config.preserveAttributes && element.attributes.length > 0) {
        const attrs: Array<Record<string, any>> = [];

        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          // Strip namespace prefix from attribute name
          const attrLocalName =
            attr.localName || attr.name.split(":").pop() || attr.name;

          // Create attribute object with consistent structure
          const attrObj: Record<string, any> = {
            [attrLocalName]: {
              [this.config.propNames.value]: attr.value,
            },
          };

          // Add namespace info for attribute if present and enabled
          if (this.config.preserveNamespaces) {
            // Handle attribute namespace
            if (attr.namespaceURI) {
              attrObj[attrLocalName][this.config.propNames.namespace] =
                attr.namespaceURI;
            }

            // Handle attribute prefix
            if (attr.prefix) {
              attrObj[attrLocalName][this.config.propNames.prefix] =
                attr.prefix;
            }
          }

          attrs.push(attrObj);
        }

        if (attrs.length > 0) {
          nodeObj[this.config.propNames.attributes] = attrs;
        }
      }

      // Process child nodes
      if (element.childNodes.length > 0) {
        const children: Array<Record<string, any>> = [];

        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];

          // Text nodes - only process if preserveTextNodes is true
          if (child.nodeType === DOMEnvironment.nodeTypes.TEXT_NODE) {
            if (this.config.preserveTextNodes) {
              const text = child.nodeValue || "";

              // Skip whitespace-only text nodes if whitespace preservation is disabled
              if (!this.config.preserveWhitespace && text.trim() === "") {
                continue;
              }

              children.push({ [this.config.propNames.value]: text });
            }
          }
          // CDATA sections
          else if (
            child.nodeType === DOMEnvironment.nodeTypes.CDATA_SECTION_NODE &&
            this.config.preserveCDATA
          ) {
            children.push({
              [this.config.propNames.cdata]: child.nodeValue || "",
            });
          }
          // Comments
          else if (
            child.nodeType === DOMEnvironment.nodeTypes.COMMENT_NODE &&
            this.config.preserveComments
          ) {
            children.push({
              [this.config.propNames.comments]: child.nodeValue || "",
            });
          }
          // Processing instructions
          else if (
            child.nodeType ===
              DOMEnvironment.nodeTypes.PROCESSING_INSTRUCTION_NODE &&
            this.config.preserveProcessingInstr
          ) {
            children.push({
              [this.config.propNames.instruction]: {
                [this.config.propNames.target]: child.nodeName,
                [this.config.propNames.value]: child.nodeValue || "",
              },
            });
          }
          // Element nodes (recursive)
          else if (child.nodeType === DOMEnvironment.nodeTypes.ELEMENT_NODE) {
            children.push(this.nodeToJson(child));
          }
        }

        if (children.length > 0) {
          nodeObj[this.config.propNames.children] = children;
        }
      }

      // Apply compact option - remove empty properties if enabled
      if (this.config.outputOptions.compact) {
        Object.keys(nodeObj).forEach((key) => {
          if (
            nodeObj[key] === null ||
            nodeObj[key] === undefined ||
            (Array.isArray(nodeObj[key]) && nodeObj[key].length === 0) ||
            (typeof nodeObj[key] === "object" &&
              Object.keys(nodeObj[key]).length === 0)
          ) {
            delete nodeObj[key];
          }
        });
      }

      result[nodeName] = nodeObj;
    }

    return result;
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
        element = DOMEnvironment.createElementNS(ns, `${prefix}:${nodeName}`);
      } else {
        // Create element with namespace but no prefix
        element = DOMEnvironment.createElementNS(ns, nodeName);
      }
    } else {
      // Create element without namespace
      element = DOMEnvironment.createElement(nodeName);
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
              DOMEnvironment.createTextNode(child[this.config.propNames.value])
            );
          }
          // CDATA sections
          else if (
            child[this.config.propNames.cdata] !== undefined &&
            this.config.preserveCDATA
          ) {
            element.appendChild(
              DOMEnvironment.createCDATASection(
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
              DOMEnvironment.createComment(
                child[this.config.propNames.comments]
              )
            );
          }
          // Processing instructions
          else if (child[this.config.propNames.instruction] !== undefined && this.config.preserveProcessingInstr) {
            const piData = child[this.config.propNames.instruction];
            const target = piData[this.config.propNames.target];
            const data = piData[this.config.propNames.value] || '';
            
            if (target) {
              element.appendChild(DOMEnvironment.createProcessingInstruction(target, data));
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
   * Apply simple pretty printing to XML string
   * @param xmlString XML string to format
   * @returns Formatted XML string
   */
  private prettyPrintXml(xmlString: string): string {
    // This is a simple implementation
    // A production-ready solution would use a proper XML formatter
    let formatted = "";
    let indent = 0;
    const indentString = " ".repeat(this.config.outputOptions.indent);

    // Simple state machine for XML formatting
    let inTag = false;
    let inContent = false;
    let inCDATA = false;
    let inComment = false;

    for (let i = 0; i < xmlString.length; i++) {
      const char = xmlString.charAt(i);
      const nextChar = xmlString.charAt(i + 1);

      // Handle CDATA sections
      if (char === "<" && xmlString.substr(i, 9) === "<![CDATA[") {
        inCDATA = true;
        formatted += char;
        continue;
      }
      if (inCDATA && xmlString.substr(i, 3) === "]]>") {
        inCDATA = false;
        formatted += "]]>";
        i += 2;
        continue;
      }
      if (inCDATA) {
        formatted += char;
        continue;
      }

      // Handle comments
      if (char === "<" && xmlString.substr(i, 4) === "<!--") {
        inComment = true;
        formatted += char;
        continue;
      }
      if (inComment && xmlString.substr(i, 3) === "-->") {
        inComment = false;
        formatted += "-->";
        i += 2;
        continue;
      }
      if (inComment) {
        formatted += char;
        continue;
      }

      // Handle tags and content
      if (char === "<" && !inTag && !inContent) {
        // Check if it's a closing tag
        if (nextChar === "/") {
          indent -= 1;
        }

        if (!inContent) {
          formatted += "\n" + indentString.repeat(indent);
        }

        formatted += char;
        inTag = true;
        inContent = false;
      } else if (char === ">" && inTag) {
        formatted += char;
        inTag = false;

        // Check if it's a self-closing tag
        if (xmlString.charAt(i - 1) !== "/") {
          inContent = true;
        }

        // Check if it's an opening tag (not self-closing)
        if (
          xmlString.charAt(i - 1) !== "/" &&
          xmlString.charAt(i - 1) !== "?"
        ) {
          indent += 1;
        }
      } else if (inContent && char === "<" && nextChar !== "!") {
        inContent = false;
        i--; // Re-process this character as a tag start
      } else {
        formatted += char;
      }
    }

    return formatted;
  }

  /**
   * Clean up any resources
   */
  public cleanup(): void {
    DOMEnvironment.cleanup();
  }
}
