/**
 * XMLToJSON class for converting XML to JSON with consistent namespace handling
 */
import { Configuration } from "./types/types";
import { XJXError } from "./types/errors";
import { DOMAdapter } from "./DOMAdapter";
import { JSONUtil } from "./utils/JsonUtils";
import { TransformUtil } from "./transforms/TransformUtil";
import { TransformContext } from "./transforms/ValueTransformer";

/**
 * XMLToJSON Parser for converting XML to JSON
 */
export class XMLToJSON {
  private config: Configuration;
  private jsonUtil: JSONUtil;
  private transformUtil: TransformUtil;

  /**
   * Constructor for XMLToJSON
   * @param config Configuration options
   */
  constructor(config: Configuration) {
    this.config = config;
    this.jsonUtil = new JSONUtil(this.config);
    this.transformUtil = new TransformUtil(this.config);
  }

  /**
   * Convert XML string to JSON
   * @param xmlString XML content as string
   * @returns JSON object representing the XML content
   */
  public parse(xmlString: string): Record<string, any> {
    try {
      const xmlDoc = DOMAdapter.parseFromString(xmlString, "text/xml");

      // Check for parsing errors
      const errors = xmlDoc.getElementsByTagName("parsererror");
      if (errors.length > 0) {
        throw new XJXError(`XML parsing error: ${errors[0].textContent}`);
      }

      return this.nodeToJson(xmlDoc.documentElement);
    } catch (error) {
      throw new XJXError(
        `Failed to convert XML to JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert a DOM node to JSON representation
   * @param node DOM node to convert
   * @param parentContext Optional parent context for transformation chain
   * @param path Current path in the XML tree
   * @returns JSON representation of the node
   */
  private nodeToJson(node: Node, parentContext?: TransformContext, path: string = ""): Record<string, any> {
    const result: Record<string, any> = {};

    // Handle element nodes
    if (node.nodeType === DOMAdapter.nodeTypes.ELEMENT_NODE) {
      const element = node as Element;
      // Use localName instead of nodeName to strip namespace prefix
      const nodeName =
        element.localName ||
        element.nodeName.split(":").pop() ||
        element.nodeName;

      // Update the current path
      const currentPath = path ? `${path}.${nodeName}` : nodeName;

      const nodeObj: Record<string, any> = {};

      // Create context for this node
      const context = this.transformUtil.createContext(
        'xml-to-json',
        nodeName,
        node.nodeType,
        {
          path: currentPath,
          namespace: element.namespaceURI || undefined,
          prefix: element.prefix || undefined,
          parent: parentContext
        }
      );

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

          // Create attribute context
          const attrContext = this.transformUtil.createContext(
            'xml-to-json',
            nodeName,
            node.nodeType,
            {
              path: `${currentPath}.${attrLocalName}`,
              namespace: attr.namespaceURI || undefined,
              prefix: attr.prefix || undefined,
              isAttribute: true,
              attributeName: attrLocalName,
              parent: context
            }
          );

          // Apply transformations to attribute value
          const transformedValue = this.transformUtil.applyTransforms(
            attr.value,
            attrContext
          );

          // Create attribute object with consistent structure
          const attrObj: Record<string, any> = {
            [attrLocalName]: {
              [this.config.propNames.value]: transformedValue,
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
        const childrenKey = this.config.propNames.children;
        const valueKey = this.config.propNames.value;
        const cdataKey = this.config.propNames.cdata;
        const commentsKey = this.config.propNames.comments;
        const instructionKey = this.config.propNames.instruction;
        const targetKey = this.config.propNames.target;

        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];

          // Text nodes - only process if preserveTextNodes is true
          if (child.nodeType === DOMAdapter.nodeTypes.TEXT_NODE) {
            if (this.config.preserveTextNodes) {
              let text = child.nodeValue || "";

              // Skip whitespace-only text nodes if whitespace preservation is disabled
              if (!this.config.preserveWhitespace) {
                if (text.trim() === "") {
                  continue;
                }
                // Trim the text when preserveWhitespace is false
                text = text.trim();
              }

              // Create text node context
              const textContext = this.transformUtil.createContext(
                'xml-to-json',
                '#text',
                child.nodeType,
                {
                  path: `${currentPath}.#text`,
                  parent: context
                }
              );

              // Apply transformations to text value
              const transformedText = this.transformUtil.applyTransforms(
                text,
                textContext
              );

              children.push({ [valueKey]: transformedText });
            }
          }
          // CDATA sections
          else if (
            child.nodeType === DOMAdapter.nodeTypes.CDATA_SECTION_NODE &&
            this.config.preserveCDATA
          ) {
            // Create CDATA context
            const cdataContext = this.transformUtil.createContext(
              'xml-to-json',
              '#cdata',
              child.nodeType,
              {
                path: `${currentPath}.#cdata`,
                parent: context
              }
            );

            // Apply transformations to CDATA value
            const transformedCData = this.transformUtil.applyTransforms(
              child.nodeValue || "",
              cdataContext
            );

            children.push({
              [cdataKey]: transformedCData,
            });
          }
          // Comments
          else if (
            child.nodeType === DOMAdapter.nodeTypes.COMMENT_NODE &&
            this.config.preserveComments
          ) {
            children.push({
              [commentsKey]: child.nodeValue || "",
            });
          }
          // Processing instructions
          else if (
            child.nodeType ===
              DOMAdapter.nodeTypes.PROCESSING_INSTRUCTION_NODE &&
            this.config.preserveProcessingInstr
          ) {
            children.push({
              [instructionKey]: {
                [targetKey]: child.nodeName,
                [valueKey]: child.nodeValue || "",
              },
            });
          }
          // Element nodes (recursive)
          else if (child.nodeType === DOMAdapter.nodeTypes.ELEMENT_NODE) {
            children.push(this.nodeToJson(child, context, currentPath));
          }
        }

        if (children.length > 0) {
          nodeObj[childrenKey] = children;
        }
      }

      // Apply compact option - remove empty properties if enabled
      if (this.config.outputOptions.compact) {
        Object.keys(nodeObj).forEach((key) => {
          const cleaned = this.cleanNode(nodeObj[key]);
          if (cleaned === undefined) {
            delete nodeObj[key];
          } else {
            nodeObj[key] = cleaned;
          }
        });
      }

      result[nodeName] = nodeObj;
    }

    return result;
  }

  private cleanNode(node: any): any {
    if (Array.isArray(node)) {
      // Clean each item in the array and filter out empty ones
      const cleanedArray = node
        .map((item) => this.cleanNode(item))
        .filter((item) => {
          return !(
            item === null ||
            item === undefined ||
            (typeof item === "object" && Object.keys(item).length === 0)
          );
        });
      return cleanedArray.length > 0 ? cleanedArray : undefined;
    } else if (typeof node === "object" && node !== null) {
      // Clean properties recursively
      Object.keys(node).forEach((key) => {
        const cleanedChild = this.cleanNode(node[key]);
        if (
          cleanedChild === null ||
          cleanedChild === undefined ||
          (Array.isArray(cleanedChild) && cleanedChild.length === 0) ||
          (typeof cleanedChild === "object" &&
            Object.keys(cleanedChild).length === 0)
        ) {
          delete node[key];
        } else {
          node[key] = cleanedChild;
        }
      });

      // Handle the special case for nodes with only empty children/attributes
      const childrenKey = this.config.propNames.children;
      const attrsKey = this.config.propNames.attributes;
      const keys = Object.keys(node);
      if (
        keys.every((key) => key === childrenKey || key === attrsKey) &&
        (node[childrenKey] === undefined ||
          this.jsonUtil.isEmpty(node[childrenKey])) &&
        (node[attrsKey] === undefined || this.jsonUtil.isEmpty(node[attrsKey]))
      ) {
        return undefined;
      }

      return Object.keys(node).length > 0 ? node : undefined;
    }

    return node;
  }
}