/**
 * Base Converter - Abstract class for XML/JSON converters
 * 
 * Contains shared functionality between XML-to-JSON and JSON-to-XML converters
 */
import { Configuration } from "../types/config-types";
import { XJXError } from "../types/error-types";
import { 
  XNode, 
  TransformContext, 
  TransformDirection 
} from "../types/transform-types";
import { TransformUtil } from "../utils/transform-utils";
import { XmlUtil } from "../utils/xml-utils";
import { XmlEntityHandler } from "../utils/xml-entity-handler";
import { NamespaceUtil } from "../utils/namespace-util";
import { UnifiedRegistry, RegistryType } from "../registry/unified-registry";
import { NodeType } from "../types/dom-types";

/**
 * Abstract base class for converters
 */
export abstract class BaseConverter {
  protected config: Configuration;
  protected transformUtil: TransformUtil;
  protected xmlUtil: XmlUtil;
  protected entityHandler: XmlEntityHandler;
  protected namespaceUtil: NamespaceUtil;
  protected namespaceMap: Record<string, string>;
  
  /**
   * Constructor
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = config;
    this.transformUtil = new TransformUtil(this.config);
    this.xmlUtil = new XmlUtil(this.config);
    this.entityHandler = XmlEntityHandler.getInstance();
    this.namespaceUtil = NamespaceUtil.getInstance();
    this.namespaceMap = {};
  }
  
  /**
   * Apply transformations to an XNode using the unified registry
   * @param node Node to transform
   * @param context Transformation context
   * @returns Transformed node or null if removed
   */
  protected applyTransformations(node: XNode, context: TransformContext): XNode | null {
    try {
      const transformOperation = UnifiedRegistry.get(
        RegistryType.TRANSFORM_OPERATION, 
        'applyTransformations'
      );
      
      return transformOperation(node, context) || null;
    } catch (error) {
      throw new XJXError(
        `Failed to apply transformations: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  
  /**
   * Create a root transformation context
   * @param direction Transformation direction
   * @param rootName Name of the root node
   * @returns Root context
   */
  protected createRootContext(direction: TransformDirection, rootName: string): TransformContext {
    return this.transformUtil.createRootContext(direction, rootName);
  }
  
  /**
   * Create an attribute context
   * @param parentContext Parent context
   * @param attributeName Attribute name
   * @returns Attribute context
   */
  protected createAttributeContext(
    parentContext: TransformContext,
    attributeName: string
  ): TransformContext {
    return this.transformUtil.createAttributeContext(parentContext, attributeName);
  }
  
  /**
   * Create a child context
   * @param parentContext Parent context
   * @param childNode Child node
   * @param index Index of child
   * @returns Child context
   */
  protected createChildContext(
    parentContext: TransformContext,
    childNode: XNode,
    index: number
  ): TransformContext {
    return this.transformUtil.createChildContext(parentContext, childNode, index);
  }
  
  /**
   * Normalize text content according to whitespace settings
   * @param text Text to normalize
   * @param inMixedContent Whether this text is part of mixed content
   * @returns Normalized text
   */
  protected normalizeTextContent(text: string, inMixedContent: boolean = false): string {
    return this.xmlUtil.normalizeTextContent(text);
  }
  
  /**
   * Check if a string has non-whitespace content
   * @param text Text to check
   * @returns True if text has non-whitespace content
   */
  protected hasContent(text: string): boolean {
    return text.trim().length > 0;
  }
  
  /**
   * Check if a node has mixed content (text and elements)
   * @param element DOM element to check
   * @returns True if element has mixed content
   */
  protected hasMixedContent(element: Element): boolean {
    if (element.childNodes.length <= 1) return false;
    
    let hasText = false;
    let hasElement = false;
    
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === NodeType.TEXT_NODE) {
        if (this.hasContent(child.nodeValue || '')) {
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
   * Process a namespace declaration attribute
   * @param attrName Attribute name
   * @param attrValue Attribute value
   * @param namespaceDecls Output namespace declarations object
   * @returns True if attribute was a namespace declaration
   */
  protected processNamespaceDeclaration(
    attrName: string, 
    attrValue: any,
    namespaceDecls: Record<string, string>
  ): boolean {
    // Check if this is a namespace declaration
    if (attrName === "xmlns") {
      // Default namespace
      namespaceDecls[""] = attrValue;
      
      // Add to global namespace map for resolution
      this.namespaceMap[""] = attrValue;
      return true;
    } else if (attrName.startsWith("xmlns:")) {
      // Prefixed namespace
      const prefix = attrName.substring(6);
      namespaceDecls[prefix] = attrValue;
      
      // Add to global namespace map for resolution
      this.namespaceMap[prefix] = attrValue;
      return true;
    }
    
    return false;
  }
  
  /**
   * Find namespace URI for a prefix
   * @param node Starting node
   * @param prefix Namespace prefix to find
   * @returns Namespace URI or undefined if not found
   */
  protected findNamespaceForPrefix(node: XNode, prefix: string): string | undefined {
    return this.namespaceUtil.findNamespaceForPrefix(node, prefix, this.namespaceMap);
  }
  
  /**
   * Abstract method to be implemented by concrete converters
   */
  public abstract convert(input: any): any;
}