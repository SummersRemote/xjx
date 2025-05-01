/**
 * Utilities for handling transformations
 */
import { Configuration } from '../types/config-types';
import { 
  TransformContext, 
  TransformDirection, 
  XNode 
} from '../types/transform-types';
import { DOMAdapter } from '../adapters/dom-adapter';

/**
 * Utility class for working with transformations
 */
export class TransformUtil {
  private config: Configuration;

  /**
   * Constructor
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }

  /**
   * Create a transform context for a node
   * @param direction Direction of transformation
   * @param node Node to create context for
   * @param path Optional path override
   * @param parent Optional parent context
   * @returns New transform context
   */
  public createContext(
    direction: TransformDirection,
    node: XNode,
    path: string = node.name,
    parent?: TransformContext
  ): TransformContext {
    return {
      direction,
      nodeName: node.name,
      nodeType: node.type,
      namespace: node.namespace,
      prefix: node.prefix,
      path,
      isAttribute: false,
      parent,
      config: this.config
    };
  }

  /**
   * Create a context for a child node
   * @param parentContext Parent context
   * @param childNode Child node
   * @param index Index of child in parent's children array
   * @returns Child context
   */
  public createChildContext(
    parentContext: TransformContext,
    childNode: XNode,
    index: number
  ): TransformContext {
    return {
      direction: parentContext.direction,
      nodeName: childNode.name,
      nodeType: childNode.type,
      namespace: childNode.namespace,
      prefix: childNode.prefix,
      path: `${parentContext.path}.${childNode.name}[${index}]`,
      isAttribute: false,
      parent: parentContext,
      config: this.config
    };
  }

  /**
   * Create a context for an attribute
   * @param parentContext Parent context
   * @param attributeName Attribute name
   * @returns Attribute context
   */
  public createAttributeContext(
    parentContext: TransformContext,
    attributeName: string
  ): TransformContext {
    return {
      direction: parentContext.direction,
      nodeName: parentContext.nodeName,
      nodeType: parentContext.nodeType,
      namespace: parentContext.namespace,
      prefix: parentContext.prefix,
      path: `${parentContext.path}.@${attributeName}`,
      isAttribute: true,
      attributeName,
      parent: parentContext,
      config: this.config
    };
  }

  /**
   * Create a root context for starting transformation
   * @param direction Direction of transformation
   * @param rootName Name of root node
   * @returns Root context
   */
  public createRootContext(
    direction: TransformDirection,
    rootName: string
  ): TransformContext {
    return {
      direction,
      nodeName: rootName,
      nodeType: DOMAdapter.NodeType.ELEMENT_NODE,
      path: rootName,
      isAttribute: false,
      config: this.config
    };
  }

  /**
   * Get a human-readable node type name (for debugging)
   * @param nodeType DOM node type
   * @returns String representation
   */
  public getNodeTypeName(nodeType: number): string {
    return DOMAdapter.getNodeTypeName(nodeType);
  }
}