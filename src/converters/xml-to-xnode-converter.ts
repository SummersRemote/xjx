/**
 * XML to XNode converter implementation
 * 
 * Converts XML strings to XNode representation using the new static utilities.
 */
import { XmlToXNodeConverter } from './converter-interfaces';
import { Config, Configuration } from '../core/config';
import { XmlParser } from '../core/xml';
import { NodeType } from '../core/dom';
import { logger, validate, ParseError, handleError, ErrorType } from '../core/error';
import { XmlNamespace } from '../core/xml';
import { XmlEntity } from '../core/xml';
import { XNode } from '../core/xnode';

/**
 * Converts XML strings to XNode representation
 */
export class DefaultXmlToXNodeConverter implements XmlToXNodeConverter {
  private config: Configuration;
  private namespaceMap: Record<string, string> = {};

  /**
   * Create a new converter
   * @param config Configuration
   */
  constructor(config: Configuration) {
    // Initialize properties first to satisfy TypeScript
    this.config = config;
    this.namespaceMap = {};
    
    try {
      // Then validate and potentially update
      if (!Config.isValid(config)) {
        this.config = Config.createOrUpdate({}, config);
      }
    } catch (err) {
      // If validation/update fails, use default config
      this.config = Config.getDefault();
      handleError(err, "initialize XML to XNode converter", {
        errorType: ErrorType.CONFIGURATION
      });
    }
  }

  /**
   * Convert XML string to XNode
   * @param xml XML string
   * @returns XNode representation
   */
  public convert(xml: string): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(typeof xml === "string" && xml.length > 0, "XML source must be a non-empty string");
      
      // Reset namespace map
      this.namespaceMap = {};
      
      // Parse XML string to DOM
      const doc = XmlParser.parse(xml);
      
      logger.debug('Successfully parsed XML to DOM', {
        rootElement: doc.documentElement?.nodeName
      });
      
      // Convert DOM element to XNode
      return this.elementToXNode(doc.documentElement);
    } catch (err) {
      return handleError(err, 'convert XML to XNode', {
        data: { xmlLength: xml.length },
        errorType: ErrorType.PARSE
      });
    }
  }

  /**
   * Convert DOM element to XNode
   * @param element DOM element
   * @param parentNode Optional parent node
   * @returns XNode representation
   */
  public elementToXNode(element: Element, parentNode?: XNode): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(element !== null && element !== undefined, "Element must be provided");
      
      // Create base node
      const xnode = new XNode(
        element.localName ||
        element.nodeName.split(":").pop() ||
        element.nodeName,
        NodeType.ELEMENT_NODE
      );
      
      xnode.namespace = element.namespaceURI || undefined;
      xnode.prefix = element.prefix || undefined;
      xnode.parent = parentNode;

      // Process attributes and namespace declarations
      if (element.attributes.length > 0) {
        xnode.attributes = {};

        // Get namespace declarations
        const namespaceDecls = XmlNamespace.getNamespaceDeclarations(element);
        if (Object.keys(namespaceDecls).length > 0) {
          xnode.namespaceDeclarations = namespaceDecls;
          xnode.isDefaultNamespace = XmlNamespace.hasDefaultNamespace(element);

          // Update global namespace map
          Object.assign(this.namespaceMap, namespaceDecls);
        }

        // Process regular attributes
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];

          // Skip namespace declarations
          if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) continue;

          // Add regular attribute
          const attrName =
            attr.localName || attr.name.split(":").pop() || attr.name;
          xnode.attributes[attrName] = attr.value;
        }
      }

      // Process child nodes
      if (element.childNodes.length > 0) {
        // Detect mixed content
        const hasMixed = this.hasMixedContent(element);

        // Optimize single text node case
        if (
          element.childNodes.length === 1 &&
          element.childNodes[0].nodeType === NodeType.TEXT_NODE &&
          !hasMixed
        ) {
          const text = element.childNodes[0].nodeValue || "";
          const normalizedText = XmlEntity.normalizeWhitespace(text, this.config.preserveWhitespace);

          if (normalizedText && this.config.preserveTextNodes) {
            xnode.value = normalizedText;
          }
        } else {
          // Process multiple children
          const children: XNode[] = [];

          for (let i = 0; i < element.childNodes.length; i++) {
            const child = element.childNodes[i];

            switch (child.nodeType) {
              case NodeType.TEXT_NODE:
                this.processTextNode(child, children, xnode, hasMixed);
                break;

              case NodeType.CDATA_SECTION_NODE:
                this.processCDATANode(child, children, xnode);
                break;

              case NodeType.COMMENT_NODE:
                this.processCommentNode(child, children, xnode);
                break;

              case NodeType.PROCESSING_INSTRUCTION_NODE:
                this.processProcessingInstructionNode(
                  child as ProcessingInstruction,
                  children,
                  xnode
                );
                break;

              case NodeType.ELEMENT_NODE:
                children.push(this.elementToXNode(child as Element, xnode));
                break;
            }
          }

          if (children.length > 0) {
            xnode.children = children;
          }
        }
      }

      logger.debug('Converted DOM element to XNode', { 
        elementName: element.nodeName, 
        xnodeName: xnode.name,
        childCount: xnode.children?.length || 0
      });
      
      return xnode;
    } catch (err) {
      return handleError(err, 'convert DOM element to XNode', {
        data: { 
          elementName: element?.nodeName,
          elementNodeType: element?.nodeType
        },
        errorType: ErrorType.PARSE
      });
    }
  }

  /**
   * Check if element has mixed content (text and elements)
   * @param element DOM element
   * @returns True if mixed content
   * @private
   */
  private hasMixedContent(element: Element): boolean {
    try {
      let hasText = false;
      let hasElement = false;

      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];

        if (child.nodeType === NodeType.TEXT_NODE) {
          if (this.hasContent(child.nodeValue || "")) {
            hasText = true;
          }
        } else if (child.nodeType === NodeType.ELEMENT_NODE) {
          hasElement = true;
        }

        if (hasText && hasElement) return true;
      }

      return false;
    } catch (err) {
      return handleError(err, 'check for mixed content', {
        data: { elementName: element?.nodeName },
        fallback: false
      });
    }
  }

  /**
   * Check if text has non-whitespace content
   * @param text Text to check
   * @returns True if has content
   * @private
   */
  private hasContent(text: string): boolean {
    return text.trim().length > 0;
  }

  /**
   * Process a text node
   * @param node Text node
   * @param children Children array to add to
   * @param parentNode Parent XNode
   * @param hasMixed True if parent has mixed content
   * @private
   */
  private processTextNode(
    node: Node,
    children: XNode[],
    parentNode: XNode,
    hasMixed: boolean
  ): void {
    try {
      const text = node.nodeValue || "";

      if (this.config.preserveWhitespace || hasMixed || this.hasContent(text)) {
        const normalizedText = XmlEntity.normalizeWhitespace(text, this.config.preserveWhitespace);

        if (normalizedText && this.config.preserveTextNodes) {
          const textNode = XNode.createTextNode(normalizedText);
          textNode.parent = parentNode;
          children.push(textNode);
        }
      }
    } catch (err) {
      handleError(err, 'process text node', {
        data: { 
          nodeValue: node.nodeValue,
          parentNodeName: parentNode.name
        }
      });
      // Continue processing even if this node fails
    }
  }

  /**
   * Process a CDATA node
   * @param node CDATA node
   * @param children Children array to add to
   * @param parentNode Parent XNode
   * @private
   */
  private processCDATANode(
    node: Node,
    children: XNode[],
    parentNode: XNode
  ): void {
    try {
      if (this.config.preserveCDATA) {
        const cdataNode = XNode.createCDATANode(node.nodeValue || "");
        cdataNode.parent = parentNode;
        children.push(cdataNode);
      }
    } catch (err) {
      handleError(err, 'process CDATA node', {
        data: { 
          nodeValue: node.nodeValue,
          parentNodeName: parentNode.name
        }
      });
      // Continue processing even if this node fails
    }
  }

  /**
   * Process a comment node
   * @param node Comment node
   * @param children Children array to add to
   * @param parentNode Parent XNode
   * @private
   */
  private processCommentNode(
    node: Node,
    children: XNode[],
    parentNode: XNode
  ): void {
    try {
      if (this.config.preserveComments) {
        const commentNode = XNode.createCommentNode(node.nodeValue || "");
        commentNode.parent = parentNode;
        children.push(commentNode);
      }
    } catch (err) {
      handleError(err, 'process comment node', {
        data: { 
          nodeValue: node.nodeValue,
          parentNodeName: parentNode.name
        }
      });
      // Continue processing even if this node fails
    }
  }

  /**
   * Process a processing instruction node
   * @param pi Processing instruction
   * @param children Children array to add to
   * @param parentNode Parent XNode
   * @private
   */
  private processProcessingInstructionNode(
    pi: ProcessingInstruction,
    children: XNode[],
    parentNode: XNode
  ): void {
    try {
      if (this.config.preserveProcessingInstr) {
        const piNode = XNode.createProcessingInstructionNode(pi.target, pi.data || "");
        piNode.parent = parentNode;
        children.push(piNode);
      }
    } catch (err) {
      handleError(err, 'process processing instruction node', {
        data: { 
          target: pi.target,
          data: pi.data,
          parentNodeName: parentNode.name
        }
      });
      // Continue processing even if this node fails
    }
  }
}