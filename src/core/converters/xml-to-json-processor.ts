/**
 * XML to JSON processor implementation
 */
import { XmlProcessor, TransformApplier } from "./processor-interfaces";
import {
  Configuration,
  Transform,
  XNode,
  TransformContext,
  TransformDirection,
  TransformTarget,
} from "../../core/types/transform-interfaces";
import { XmlUtil } from "../../core/utils/xml-utils";
import { DOMAdapter } from "../../core/adapters/dom-adapter";
import { NodeType } from "../../core/types/dom-types";
import { XJXError } from "../../core/types/error-types";
import { NamespaceUtil } from "../../core/utils/namespace-util";
import { XmlEntityHandler } from "../../core/utils/xml-entity-handler";

/**
 * Processor that converts XML to JSON with transformation support
 */
export class XmlToJsonProcessor implements XmlProcessor {
  private xmlUtil: XmlUtil;
  private namespaceUtil: NamespaceUtil;
  private entityHandler: XmlEntityHandler;
  private namespaceMap: Record<string, string> = {};

  /**
   * Create a new processor
   * @param config Configuration
   */
  constructor(private config: Configuration) {
    this.xmlUtil = new XmlUtil(config);
    this.namespaceUtil = NamespaceUtil.getInstance();
    this.entityHandler = XmlEntityHandler.getInstance();
  }

  /**
   * Process XML to JSON with transforms
   * @param source XML string
   * @param transforms Transforms to apply
   * @returns JSON object
   */
  process(source: string, transforms: Transform[]): Record<string, any> {
    try {
      // Reset namespace map
      this.namespaceMap = {};

      // Parse XML to DOM
      const doc = this.xmlUtil.parseXml(source);

      // Convert DOM to XNode
      const xnode = this.xmlToXNode(doc.documentElement);

      // Create root context
      const context: TransformContext = {
        nodeName: xnode.name,
        nodeType: xnode.type,
        path: xnode.name,
        namespace: xnode.namespace,
        prefix: xnode.prefix,
        config: this.config,
        direction: TransformDirection.XML_TO_JSON,
      };

      // Apply transformations
      const transformedNode = this.applyTransforms(xnode, context, transforms);

      if (!transformedNode) {
        throw new XJXError("Root node was removed during transformation");
      }

      // Convert to JSON
      return this.xnodeToJson(transformedNode);
    } catch (error) {
      throw new XJXError(
        `Failed to convert XML to JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert XML element to XNode
   * @param element DOM element
   * @param parentNode Optional parent node
   * @returns XNode representation
   */
  xmlToXNode(element: Element, parentNode?: XNode): XNode {
    // Create base node
    const xnode: XNode = {
      name:
        element.localName ||
        element.nodeName.split(":").pop() ||
        element.nodeName,
      type: NodeType.ELEMENT_NODE,
      namespace: element.namespaceURI || undefined,
      prefix: element.prefix || undefined,
      parent: parentNode,
    };

    // Process attributes and namespace declarations
    if (element.attributes.length > 0) {
      xnode.attributes = {};

      // Get namespace declarations
      const namespaceDecls =
        this.namespaceUtil.getNamespaceDeclarations(element);
      if (Object.keys(namespaceDecls).length > 0) {
        xnode.namespaceDeclarations = namespaceDecls;
        xnode.isDefaultNamespace =
          this.namespaceUtil.hasDefaultNamespace(element);

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
        const normalizedText = this.normalizeTextContent(text);

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
              children.push(this.xmlToXNode(child as Element, xnode));
              break;
          }
        }

        if (children.length > 0) {
          xnode.children = children;
        }
      }
    }

    return xnode;
  }

  /**
   * Check if element has mixed content (text and elements)
   * @param element DOM element
   * @returns True if mixed content
   */
  private hasMixedContent(element: Element): boolean {
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
  }

  /**
   * Check if text has non-whitespace content
   * @param text Text to check
   * @returns True if has content
   */
  private hasContent(text: string): boolean {
    return text.trim().length > 0;
  }

  /**
   * Normalize text content based on configuration
   * @param text Text to normalize
   * @returns Normalized text
   */
  private normalizeTextContent(text: string): string {
    if (!this.config.preserveWhitespace) {
      return text.trim().replace(/\s+/g, " ");
    }
    return text;
  }

  /**
   * Process a text node
   * @param node Text node
   * @param children Children array to add to
   * @param parentNode Parent XNode
   * @param hasMixed True if parent has mixed content
   */
  private processTextNode(
    node: Node,
    children: XNode[],
    parentNode: XNode,
    hasMixed: boolean
  ): void {
    const text = node.nodeValue || "";

    if (this.config.preserveWhitespace || hasMixed || this.hasContent(text)) {
      const normalizedText = this.normalizeTextContent(text);

      if (normalizedText && this.config.preserveTextNodes) {
        children.push({
          name: "#text",
          type: NodeType.TEXT_NODE,
          value: normalizedText,
          parent: parentNode,
        });
      }
    }
  }

  /**
   * Process a CDATA node
   * @param node CDATA node
   * @param children Children array to add to
   * @param parentNode Parent XNode
   */
  private processCDATANode(
    node: Node,
    children: XNode[],
    parentNode: XNode
  ): void {
    if (this.config.preserveCDATA) {
      children.push({
        name: "#cdata",
        type: NodeType.CDATA_SECTION_NODE,
        value: node.nodeValue || "",
        parent: parentNode,
      });
    }
  }

  /**
   * Process a comment node
   * @param node Comment node
   * @param children Children array to add to
   * @param parentNode Parent XNode
   */
  private processCommentNode(
    node: Node,
    children: XNode[],
    parentNode: XNode
  ): void {
    if (this.config.preserveComments) {
      children.push({
        name: "#comment",
        type: NodeType.COMMENT_NODE,
        value: node.nodeValue || "",
        parent: parentNode,
      });
    }
  }

  /**
   * Process a processing instruction node
   * @param pi Processing instruction
   * @param children Children array to add to
   * @param parentNode Parent XNode
   */
  private processProcessingInstructionNode(
    pi: ProcessingInstruction,
    children: XNode[],
    parentNode: XNode
  ): void {
    if (this.config.preserveProcessingInstr) {
      children.push({
        name: "#pi",
        type: NodeType.PROCESSING_INSTRUCTION_NODE,
        value: pi.data || "",
        attributes: { target: pi.target },
        parent: parentNode,
      });
    }
  }

  /**
   * Convert XNode to JSON
   * @param node XNode to convert
   * @returns JSON object
   */
  xnodeToJson(node: XNode): Record<string, any> {
    const result: Record<string, any> = {};
    const nodeObj: Record<string, any> = {};

    // Add namespace and prefix if present
    if (node.namespace && this.config.preserveNamespaces) {
      nodeObj[this.config.propNames.namespace] = node.namespace;
    }

    if (node.prefix && this.config.preserveNamespaces) {
      nodeObj[this.config.propNames.prefix] = node.prefix;
    }

    // Add value if present
    if (node.value !== undefined && this.config.preserveTextNodes) {
      nodeObj[this.config.propNames.value] = node.value;
    }

    // Add attributes
    if (
      this.config.preserveAttributes &&
      node.attributes &&
      Object.keys(node.attributes).length > 0
    ) {
      const attrs: Array<Record<string, any>> = [];

      // Add regular attributes
      for (const [name, value] of Object.entries(node.attributes)) {
        const attrObj: Record<string, any> = {
          [name]: { [this.config.propNames.value]: value },
        };
        attrs.push(attrObj);
      }

      // Add namespace declarations
      if (node.namespaceDeclarations && this.config.preserveNamespaces) {
        for (const [prefix, uri] of Object.entries(
          node.namespaceDeclarations
        )) {
          const attrName = prefix === "" ? "xmlns" : `xmlns:${prefix}`;
          const attrObj: Record<string, any> = {
            [attrName]: { [this.config.propNames.value]: uri },
          };
          attrs.push(attrObj);
        }
      }

      if (attrs.length > 0) {
        nodeObj[this.config.propNames.attributes] = attrs;
      }
    }

    // Add children
    if (node.children && node.children.length > 0) {
      const children: Array<Record<string, any>> = [];

      for (const child of node.children) {
        switch (child.type) {
          case NodeType.TEXT_NODE:
            if (this.config.preserveTextNodes) {
              children.push({ [this.config.propNames.value]: child.value });
            }
            break;

          case NodeType.CDATA_SECTION_NODE:
            children.push({ [this.config.propNames.cdata]: child.value });
            break;

          case NodeType.COMMENT_NODE:
            children.push({ [this.config.propNames.comments]: child.value });
            break;

          case NodeType.PROCESSING_INSTRUCTION_NODE:
            children.push({
              [this.config.propNames.instruction]: {
                [this.config.propNames.target]: child.attributes?.target,
                [this.config.propNames.value]: child.value,
              },
            });
            break;

          case NodeType.ELEMENT_NODE:
            children.push(this.xnodeToJson(child));
            break;
        }
      }

      if (children.length > 0) {
        nodeObj[this.config.propNames.children] = children;
      }
    }

    // Clean empty properties in compact mode
    if (this.config.outputOptions.compact) {
      Object.keys(nodeObj).forEach((key) => {
        const value = nodeObj[key];
        if (
          value === undefined ||
          value === null ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === "object" && Object.keys(value).length === 0)
        ) {
          delete nodeObj[key];
        }
      });
    }

    result[node.name] = nodeObj;
    return result;
  }

  /**
   * Apply transforms to an XNode
   * @param node XNode to transform
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed XNode or null if removed
   */
  applyTransforms(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): XNode | null {
    // 1. Apply element transforms first - using pipeline-level filtering
    const targetType = TransformApplier.getTargetType(node, context);
    const elementResult = TransformApplier.applyTransforms(
      node,
      context,
      transforms,
      targetType
    );

    if (elementResult.remove) {
      return null;
    }

    const transformedNode = elementResult.value as XNode;

    // 2. Transform node value if present
    if (transformedNode.value !== undefined) {
      const textContext: TransformContext = {
        ...context,
        isText: true,
      };

      const valueResult = TransformApplier.applyTransforms(
        transformedNode.value,
        textContext,
        transforms,
        TransformTarget.Value
      );

      if (valueResult.remove) {
        delete transformedNode.value;
      } else {
        transformedNode.value = valueResult.value;
      }
    }

    // 3. Transform attributes
    this.transformAttributes(transformedNode, context, transforms);

    // 4. Transform children
    this.transformChildren(transformedNode, context, transforms);

    return transformedNode;
  }

  /**
   * Transform node attributes
   * @param node Node to transform
   * @param context Parent context
   * @param transforms Transforms to apply
   */
  private transformAttributes(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): void {
    if (!node.attributes) return;

    const newAttributes: Record<string, any> = {};

    for (const [name, value] of Object.entries(node.attributes)) {
      // Skip xmlns attributes since they're handled separately
      if (name === "xmlns" || name.startsWith("xmlns:")) continue;

      // Create attribute context
      const attrContext: TransformContext = {
        ...context,
        isAttribute: true,
        attributeName: name,
        path: `${context.path}.@${name}`,
      };

      // Apply attribute transforms - pipeline handles filtering
      const result = TransformApplier.applyAttributeTransforms(
        name,
        value,
        attrContext,
        transforms
      );

      // Add transformed attribute if not removed
      if (!result.remove) {
        const [newName, newValue] = result.value;
        newAttributes[newName] = newValue;
      }
    }

    node.attributes = newAttributes;
  }

  /**
   * Transform child nodes
   * @param node Node to transform
   * @param context Parent context
   * @param transforms Transforms to apply
   */
  private transformChildren(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): void {
    if (!node.children) return;

    const newChildren: XNode[] = [];

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];

      // Create child context with appropriate type flags
      const childContext: TransformContext = {
        nodeName: child.name,
        nodeType: child.type,
        namespace: child.namespace,
        prefix: child.prefix,
        path: `${context.path}.${child.name}[${i}]`,
        config: context.config,
        direction: context.direction,
        parent: context,
        isText: child.type === NodeType.TEXT_NODE,
        isCDATA: child.type === NodeType.CDATA_SECTION_NODE,
        isComment: child.type === NodeType.COMMENT_NODE,
        isProcessingInstruction:
          child.type === NodeType.PROCESSING_INSTRUCTION_NODE,
      };

      // Apply transforms based on node type - recursively apply
      const transformedChild = this.applyTransforms(
        child,
        childContext,
        transforms
      );

      if (transformedChild) {
        newChildren.push(transformedChild);
      }
    }

    node.children = newChildren;
  }

  /**
   * Transform a text node
   * @param node Text node
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed node or null if removed
   */
  private transformTextNode(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): XNode | null {
    const result = TransformApplier.applyTransforms(
      node,
      context,
      transforms,
      TransformTarget.Text
    );

    if (result.remove) {
      return null;
    }

    const transformedNode = result.value as XNode;

    // Also transform the value
    const valueResult = TransformApplier.applyTransforms(
      transformedNode.value,
      context,
      transforms,
      TransformTarget.Value
    );

    if (valueResult.remove) {
      return null;
    }

    transformedNode.value = valueResult.value;
    return transformedNode;
  }

  /**
   * Transform a CDATA node
   * @param node CDATA node
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed node or null if removed
   */
  private transformCDATANode(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): XNode | null {
    const result = TransformApplier.applyTransforms(
      node,
      context,
      transforms,
      TransformTarget.CDATA
    );

    if (result.remove) {
      return null;
    }

    const transformedNode = result.value as XNode;

    // Also transform the value
    const valueResult = TransformApplier.applyTransforms(
      transformedNode.value,
      context,
      transforms,
      TransformTarget.Value
    );

    if (valueResult.remove) {
      return null;
    }

    transformedNode.value = valueResult.value;
    return transformedNode;
  }

  /**
   * Transform a comment node
   * @param node Comment node
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed node or null if removed
   */
  private transformCommentNode(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): XNode | null {
    const result = TransformApplier.applyTransforms(
      node,
      context,
      transforms,
      TransformTarget.Comment
    );

    if (result.remove) {
      return null;
    }

    return result.value as XNode;
  }

  /**
   * Transform a processing instruction node
   * @param node Processing instruction node
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed node or null if removed
   */
  private transformProcessingInstructionNode(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): XNode | null {
    const result = TransformApplier.applyTransforms(
      node,
      context,
      transforms,
      TransformTarget.ProcessingInstruction
    );

    if (result.remove) {
      return null;
    }

    return result.value as XNode;
  }
}
