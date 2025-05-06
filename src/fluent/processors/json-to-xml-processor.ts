/**
 * JSON to XML processor implementation
 */
import { JsonProcessor, TransformApplier } from './processor-interfaces';
import { 
  Configuration, 
  Transform, 
  XNode, 
  TransformContext, 
  TransformDirection,
  TransformTarget 
} from '../../core/types/transform-interfaces';
import { XmlUtil } from '../../core/utils/xml-utils';
import { DOMAdapter } from '../../core/adapters/dom-adapter';
import { NodeType } from '../../core/types/dom-types';
import { XJXError, JsonToXmlError } from '../../core/types/error-types';
import { NamespaceUtil } from '../../core/utils/namespace-util';
import { XmlEntityHandler } from '../../core/utils/xml-entity-handler';

/**
 * Processor that converts JSON to XML with transformation support
 */
export class JsonToXmlProcessor implements JsonProcessor {
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
   * Process JSON to XML with transforms
   * @param source JSON object
   * @param transforms Transforms to apply
   * @returns XML string
   */
  process(source: Record<string, any>, transforms: Transform[]): string {
    try {
      // Reset namespace map
      this.namespaceMap = {};
      
      // Convert JSON to XNode
      const xnode = this.jsonToXNode(source);
      
      // Create root context
      const context: TransformContext = {
        nodeName: xnode.name,
        nodeType: xnode.type,
        path: xnode.name,
        namespace: xnode.namespace,
        prefix: xnode.prefix,
        config: this.config,
        direction: TransformDirection.JSON_TO_XML
      };
      
      // Apply transformations
      const transformedNode = this.applyTransforms(xnode, context, transforms);
      
      if (!transformedNode) {
        throw new XJXError('Root node was removed during transformation');
      }
      
      // Convert to XML
      return this.xnodeToXml(transformedNode);
    } catch (error) {
      throw new XJXError(
        `Failed to convert JSON to XML: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  
  /**
   * Convert JSON object to XNode
   * @param jsonObj JSON object
   * @param parentNode Optional parent node
   * @returns XNode representation
   */
  jsonToXNode(jsonObj: Record<string, any>, parentNode?: XNode): XNode {
    this.validateJsonObject(jsonObj);

    // Get the node name (first key in the object)
    const nodeName = Object.keys(jsonObj)[0];
    if (!nodeName) {
      throw new JsonToXmlError("Empty JSON object");
    }

    const nodeData = jsonObj[nodeName];

    // Create base XNode
    const xnode: XNode = {
      name: nodeName,
      type: NodeType.ELEMENT_NODE,
      parent: parentNode
    };

    // Process namespace and prefix
    const namespaceKey = this.config.propNames.namespace;
    const prefixKey = this.config.propNames.prefix;
    
    if (nodeData[namespaceKey] && this.config.preserveNamespaces) {
      xnode.namespace = nodeData[namespaceKey];
    }

    if (nodeData[prefixKey] && this.config.preserveNamespaces) {
      xnode.prefix = nodeData[prefixKey];
    }

    // Process value
    const valueKey = this.config.propNames.value;
    if (nodeData[valueKey] !== undefined) {
      xnode.value = nodeData[valueKey];
    }

    // Process attributes
    const attributesKey = this.config.propNames.attributes;
    if (this.config.preserveAttributes && 
        nodeData[attributesKey] && 
        Array.isArray(nodeData[attributesKey])) {
      
      xnode.attributes = {};
      const namespaceDecls: Record<string, string> = {};
      let hasNamespaceDecls = false;

      for (const attrObj of nodeData[attributesKey]) {
        const attrName = Object.keys(attrObj)[0];
        if (!attrName) continue;

        const attrData = attrObj[attrName];
        const attrValue = attrData[valueKey];

        if (this.processNamespaceDeclaration(attrName, attrValue, namespaceDecls)) {
          hasNamespaceDecls = true;
        } else {
          // Regular attribute
          xnode.attributes[attrName] = attrValue;
        }
      }

      // Add namespace declarations if any were found
      if (hasNamespaceDecls) {
        xnode.namespaceDeclarations = namespaceDecls;
      }
    }

    // Process children
    const childrenKey = this.config.propNames.children;
    if (nodeData[childrenKey] && Array.isArray(nodeData[childrenKey])) {
      xnode.children = this.processChildren(nodeData[childrenKey], xnode);
    }

    return xnode;
  }
  
  /**
   * Process namespace declaration
   * @param attrName Attribute name
   * @param attrValue Attribute value
   * @param namespaceDecls Namespace declarations map
   * @returns True if processed as namespace declaration
   */
  private processNamespaceDeclaration(
    attrName: string,
    attrValue: any,
    namespaceDecls: Record<string, string>
  ): boolean {
    // Check if this is a namespace declaration
    if (attrName === "xmlns") {
      // Default namespace
      namespaceDecls[""] = attrValue;
      
      // Add to global namespace map
      this.namespaceMap[""] = attrValue;
      return true;
    } else if (attrName.startsWith("xmlns:")) {
      // Prefixed namespace
      const prefix = attrName.substring(6);
      namespaceDecls[prefix] = attrValue;
      
      // Add to global namespace map
      this.namespaceMap[prefix] = attrValue;
      return true;
    }
    
    return false;
  }
  
  /**
   * Process child nodes from JSON
   * @param children Children array from JSON
   * @param parentNode Parent XNode
   * @returns Array of XNode children
   */
  private processChildren(children: any[], parentNode: XNode): XNode[] {
    const result: XNode[] = [];
    
    for (const child of children) {
      // Special node types
      if (this.processSpecialChild(child, result, parentNode)) {
        continue;
      }
      
      // Element node (recursively process)
      if (typeof child === 'object' && !Array.isArray(child)) {
        result.push(this.jsonToXNode(child, parentNode));
      }
    }
    
    return result;
  }
  
  /**
   * Process special child node types (text, CDATA, comment, PI)
   * @param child Child data from JSON
   * @param result Output children array
   * @param parentNode Parent XNode
   * @returns True if processed as special node
   */
  private processSpecialChild(child: any, result: XNode[], parentNode: XNode): boolean {
    const valueKey = this.config.propNames.value;
    const cdataKey = this.config.propNames.cdata;
    const commentsKey = this.config.propNames.comments;
    const instructionKey = this.config.propNames.instruction;
    const targetKey = this.config.propNames.target;
    
    // Text node
    if (child[valueKey] !== undefined && this.config.preserveTextNodes) {
      result.push({
        name: "#text",
        type: NodeType.TEXT_NODE,
        value: child[valueKey],
        parent: parentNode
      });
      return true;
    }
    
    // CDATA section
    if (child[cdataKey] !== undefined && this.config.preserveCDATA) {
      result.push({
        name: "#cdata",
        type: NodeType.CDATA_SECTION_NODE,
        value: child[cdataKey],
        parent: parentNode
      });
      return true;
    }
    
    // Comment
    if (child[commentsKey] !== undefined && this.config.preserveComments) {
      result.push({
        name: "#comment",
        type: NodeType.COMMENT_NODE,
        value: child[commentsKey],
        parent: parentNode
      });
      return true;
    }
    
    // Processing instruction
    if (child[instructionKey] !== undefined && this.config.preserveProcessingInstr) {
      const piData = child[instructionKey];
      const target = piData[targetKey];
      const value = piData[valueKey] || "";
      
      if (target) {
        result.push({
          name: "#pi",
          type: NodeType.PROCESSING_INSTRUCTION_NODE,
          value: value,
          attributes: { target },
          parent: parentNode
        });
      }
      return true;
    }
    
    return false;
  }
  
  /**
   * Convert XNode to XML string
   * @param node XNode to convert
   * @returns XML string
   */
  xnodeToXml(node: XNode): string {
    try {
      // Create DOM document
      const doc = DOMAdapter.createDocument();
      
      // Convert XNode to DOM
      const element = this.xnodeToDom(node, doc);
      
      // Handle the root element
      if (doc.documentElement && doc.documentElement.nodeName === "temp") {
        doc.replaceChild(element, doc.documentElement);
      } else {
        doc.appendChild(element);
      }
      
      // Serialize and format XML
      let xmlString = this.xmlUtil.serializeXml(doc);
      
      // Apply pretty printing if enabled
      if (this.config.outputOptions.prettyPrint) {
        xmlString = this.xmlUtil.prettyPrintXml(xmlString);
      }
      
      // Add XML declaration if configured
      if (this.config.outputOptions.xml.declaration) {
        xmlString = this.xmlUtil.ensureXMLDeclaration(xmlString);
      }
      
      return xmlString;
    } catch (error) {
      throw new XJXError(
        `Failed to convert to XML: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  
  /**
   * Convert XNode to DOM element
   * @param node XNode to convert
   * @param doc DOM document
   * @returns DOM element
   */
  private xnodeToDom(node: XNode, doc: Document): Element {
    let element: Element;
    
    // Create element with namespace if needed
    if (node.namespace && this.config.preserveNamespaces) {
      const qualifiedName = this.namespaceUtil.createQualifiedName(node.prefix, node.name);
      element = doc.createElementNS(node.namespace, qualifiedName);
    } else {
      element = doc.createElement(node.name);
    }
    
    // Add namespace declarations
    if (node.namespaceDeclarations && this.config.preserveNamespaces) {
      this.namespaceUtil.addNamespaceDeclarations(element, node.namespaceDeclarations);
    }
    
    // Add attributes
    if (node.attributes) {
      for (const [name, value] of Object.entries(node.attributes)) {
        // Skip xmlns attributes (handled separately)
        if (name === "xmlns" || name.startsWith("xmlns:")) continue;
        
        // Handle attributes with namespaces
        const colonIndex = name.indexOf(":");
        if (colonIndex > 0 && this.config.preserveNamespaces) {
          const attrPrefix = name.substring(0, colonIndex);
          const attrNs = this.findNamespaceForPrefix(node, attrPrefix);
          
          if (attrNs) {
            element.setAttributeNS(
              attrNs,
              name,
              this.entityHandler.escapeXML(String(value))
            );
            continue;
          }
        }
        
        // Regular attribute
        element.setAttribute(
          name,
          this.entityHandler.escapeXML(String(value))
        );
      }
    }
    
    // Add content
    // Simple node with only text content
    if (node.value !== undefined && (!node.children || node.children.length === 0)) {
      element.textContent = this.entityHandler.safeXmlText(String(node.value));
    }
    // Node with children
    else if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        switch (child.type) {
          case NodeType.TEXT_NODE:
            element.appendChild(
              doc.createTextNode(this.entityHandler.safeXmlText(String(child.value)))
            );
            break;
            
          case NodeType.CDATA_SECTION_NODE:
            element.appendChild(doc.createCDATASection(String(child.value)));
            break;
            
          case NodeType.COMMENT_NODE:
            element.appendChild(doc.createComment(String(child.value)));
            break;
            
          case NodeType.PROCESSING_INSTRUCTION_NODE:
            const target = child.attributes?.target || "";
            element.appendChild(
              doc.createProcessingInstruction(target, String(child.value))
            );
            break;
            
          case NodeType.ELEMENT_NODE:
            element.appendChild(this.xnodeToDom(child, doc));
            break;
        }
      }
    }
    
    return element;
  }
  
  /**
   * Apply transforms to an XNode
   * @param node XNode to transform
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed XNode or null if removed
   */
  applyTransforms(node: XNode, context: TransformContext, transforms: Transform[]): XNode | null {
    // 1. Apply element transforms first
    const elementResult = TransformApplier.applyTransforms(
      node,
      context,
      transforms,
      TransformTarget.Element
    );
    
    if (elementResult.remove) {
      return null;
    }
    
    const transformedNode = elementResult.value as XNode;
    
    // 2. Transform node value if present
    if (transformedNode.value !== undefined) {
      const textContext: TransformContext = {
        ...context,
        isText: true
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
  private transformAttributes(node: XNode, context: TransformContext, transforms: Transform[]): void {
    if (!node.attributes) return;
    
    const newAttributes: Record<string, any> = {};
    
    for (const [name, value] of Object.entries(node.attributes)) {
      // Skip xmlns attributes since they're handled separately
      if (name === 'xmlns' || name.startsWith('xmlns:')) continue;
      
      // Create attribute context
      const attrContext: TransformContext = {
        ...context,
        isAttribute: true,
        attributeName: name,
        path: `${context.path}.@${name}`
      };
      
      // Apply attribute transforms
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
  private transformChildren(node: XNode, context: TransformContext, transforms: Transform[]): void {
    if (!node.children) return;
    
    const newChildren: XNode[] = [];
    
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      
      // Create child context
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
        isProcessingInstruction: child.type === NodeType.PROCESSING_INSTRUCTION_NODE
      };
      
      // Apply transforms based on node type
      let transformedChild: XNode | null = null;
      
      switch (child.type) {
        case NodeType.TEXT_NODE:
          transformedChild = this.transformTextNode(child, childContext, transforms);
          break;
          
        case NodeType.CDATA_SECTION_NODE:
          transformedChild = this.transformCDATANode(child, childContext, transforms);
          break;
          
        case NodeType.COMMENT_NODE:
          transformedChild = this.transformCommentNode(child, childContext, transforms);
          break;
          
        case NodeType.PROCESSING_INSTRUCTION_NODE:
          transformedChild = this.transformProcessingInstructionNode(child, childContext, transforms);
          break;
          
        case NodeType.ELEMENT_NODE:
          transformedChild = this.applyTransforms(child, childContext, transforms);
          break;
      }
      
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
  private transformTextNode(node: XNode, context: TransformContext, transforms: Transform[]): XNode | null {
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
  private transformCDATANode(node: XNode, context: TransformContext, transforms: Transform[]): XNode | null {
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
  private transformCommentNode(node: XNode, context: TransformContext, transforms: Transform[]): XNode | null {
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
  
  /**
   * Find namespace URI for a prefix
   * @param node XNode to start from
   * @param prefix Prefix to find
   * @returns Namespace URI or undefined
   */
  private findNamespaceForPrefix(node: XNode, prefix: string): string | undefined {
    return this.namespaceUtil.findNamespaceForPrefix(node, prefix, this.namespaceMap);
  }
  
  /**
   * Validate JSON object
   * @param jsonObj JSON object to validate
   */
  private validateJsonObject(jsonObj: Record<string, any>): void {
    if (!jsonObj || typeof jsonObj !== 'object' || Array.isArray(jsonObj)) {
      throw new JsonToXmlError('Invalid JSON object: must be a non-array object');
    }
    
    if (Object.keys(jsonObj).length !== 1) {
      throw new JsonToXmlError('Invalid JSON object: must have exactly one root element');
    }
  }
}