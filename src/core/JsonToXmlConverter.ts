/**
 * JSONToXML class for converting JSON to XML with consistent namespace handling
 */
import { Configuration } from "./types/types";
import { XJXError } from "./types/errors";
import { DOMAdapter } from "./DOMAdapter";
import { XMLUtil } from "./utils/XmlUtils";
import { TransformUtil } from "./transforms/TransformUtil";
import { TransformContext } from "./transforms/ValueTransformer";

/**
 * JSONToXML for converting JSON to XML
 */
export class JSONToXML {
  private config: Configuration;
  private xmlUtil: XMLUtil;
  private transformUtil: TransformUtil;

  /**
   * Constructor for JSONToXML
   * @param config Configuration options
   */
  constructor(config: Configuration) {
    this.config = config;
    this.xmlUtil = new XMLUtil(this.config);
    this.transformUtil = new TransformUtil(this.config);
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

      // remove xhtml decl inserted by dom
      xmlString = xmlString.replace(' xmlns="http://www.w3.org/1999/xhtml"', '');

      if (this.config.outputOptions.xml.declaration) {
        xmlString = this.xmlUtil.ensureXMLDeclaration(xmlString);
      }

      // Apply pretty printing if enabled
      if (this.config.outputOptions.prettyPrint) {
        xmlString = this.xmlUtil.prettyPrintXml(xmlString);
      }

      return xmlString;
    } catch (error) {
      throw new XJXError(
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
   * @param parentContext Optional parent context for transformation chain
   * @param path Current path in the JSON object
   * @returns DOM Element
   */
  private jsonToNode(
    jsonObj: Record<string, any>,
    doc: Document,
    parentContext?: TransformContext,
    path: string = ""
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
    
    // Update the current path
    const currentPath = path ? `${path}.${nodeName}` : nodeName;

    // Create element with namespace if available
    let element: Element;
    const namespaceKey = this.config.propNames.namespace;
    const prefixKey = this.config.propNames.prefix;
    const ns = nodeData[namespaceKey];
    const prefix = nodeData[prefixKey];

    // Create context for this node
    const context = this.transformUtil.createContext(
      'json-to-xml',
      nodeName,
      DOMAdapter.nodeTypes.ELEMENT_NODE,
      {
        path: currentPath,
        namespace: ns,
        prefix: prefix,
        parent: parentContext
      }
    );

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
          
          // Create attribute context
          const attrContext = this.transformUtil.createContext(
            'json-to-xml',
            nodeName,
            DOMAdapter.nodeTypes.ELEMENT_NODE,
            {
              path: `${currentPath}.${attrName}`,
              namespace: attrData[namespaceKey],
              prefix: attrData[prefixKey],
              isAttribute: true,
              attributeName: attrName,
              parent: context
            }
          );
          
          // Apply transformations to attribute value
          const transformedValue = this.transformUtil.applyTransforms(
            attrData[valueKey] || "",
            attrContext
          );
          
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
            transformedValue
          );
        }
      );
    }

    // Process simple text value
    if (nodeData[valueKey] !== undefined) {
      // Apply transformations to text value
      const textContext = this.transformUtil.createContext(
        'json-to-xml',
        nodeName,
        DOMAdapter.nodeTypes.TEXT_NODE,
        {
          path: `${currentPath}.#text`,
          namespace: ns,
          prefix: prefix,
          parent: context
        }
      );
      
      const transformedValue = this.transformUtil.applyTransforms(
        nodeData[valueKey],
        textContext
      );
      
      element.textContent = transformedValue;
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
            // Apply transformations to text node
            const textContext = this.transformUtil.createContext(
              'json-to-xml',
              '#text',
              DOMAdapter.nodeTypes.TEXT_NODE,
              {
                path: `${currentPath}.#text`,
                parent: context
              }
            );
            
            const transformedText = this.transformUtil.applyTransforms(
              child[valueKey],
              textContext
            );
            
            element.appendChild(
              DOMAdapter.createTextNode(this.xmlUtil.escapeXML(transformedText))
            );
          }
          // CDATA sections
          else if (
            child[cdataKey] !== undefined &&
            this.config.preserveCDATA
          ) {
            // Apply transformations to CDATA
            const cdataContext = this.transformUtil.createContext(
              'json-to-xml',
              '#cdata',
              DOMAdapter.nodeTypes.CDATA_SECTION_NODE,
              {
                path: `${currentPath}.#cdata`,
                parent: context
              }
            );
            
            const transformedCData = this.transformUtil.applyTransforms(
              child[cdataKey],
              cdataContext
            );
            
            element.appendChild(
              DOMAdapter.createCDATASection(
                transformedCData
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
            const childElement = this.jsonToNode(child, doc, context, currentPath);
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