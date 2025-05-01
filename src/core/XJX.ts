/**
 * XJX - Main class for XML-JSON transformation with improved Transformation API
 */
import { DOMAdapter } from "./adapters/dom-adapter";
import { DEFAULT_CONFIG } from "./config/config";
import { Configuration } from "./types/config-types";
import { XJXError } from "./types/error-types";
import { XmlToJsonConverter } from "./converters/xml-to-json-converter";
import { JsonToXmlConverter } from "./converters/json-to-xml-converter";
import {
  ValueTransformer,
  AttributeTransformer,
  ChildrenTransformer,
  NodeTransformer,
  XNode,
  TransformContext,
  TransformDirection,
  TransformResult
} from "./types/transform-types";
import { XmlUtil } from "./utils/xml-utils";
import { JsonUtil } from "./utils/json-utils";
import { TransformUtil } from "./utils/transform-utils";
import { ExtensionRegistry } from "./extensions/registry";
import { NodeType } from './types/dom-types';

export class XJX {
  private config: Configuration;
  private xmlToJsonConverter: XmlToJsonConverter;
  private jsonToXmlConverter: JsonToXmlConverter;
  private valueTransformers: Map<TransformDirection, ValueTransformer[]> = new Map([
    [TransformDirection.XML_TO_JSON, []],
    [TransformDirection.JSON_TO_XML, []]
  ]);
  private attributeTransformers: Map<TransformDirection, AttributeTransformer[]> = new Map([
    [TransformDirection.XML_TO_JSON, []],
    [TransformDirection.JSON_TO_XML, []]
  ]);
  private childrenTransformers: Map<TransformDirection, ChildrenTransformer[]> = new Map([
    [TransformDirection.XML_TO_JSON, []],
    [TransformDirection.JSON_TO_XML, []]
  ]);
  private nodeTransformers: Map<TransformDirection, NodeTransformer[]> = new Map([
    [TransformDirection.XML_TO_JSON, []],
    [TransformDirection.JSON_TO_XML, []]
  ]);
  private jsonUtil: JsonUtil;
  private xmlUtil: XmlUtil;
  private transformUtil: TransformUtil;

  /**
   * Constructor for XJX
   * @param config Configuration options
   */
  constructor(config: Partial<Configuration> = {}) {
    // Create a temporary JsonUtil to help with deep merging config
    const tempJsonUtil = new JsonUtil(DEFAULT_CONFIG);

    // Create a deep clone of the default config
    const defaultClone = tempJsonUtil.deepClone(DEFAULT_CONFIG);

    // Deep merge with the provided config
    this.config = tempJsonUtil.deepMerge(defaultClone, config);

    // Initialize utilities with the merged config
    this.jsonUtil = new JsonUtil(this.config);
    this.xmlUtil = new XmlUtil(this.config);
    this.transformUtil = new TransformUtil(this.config);

    // Store a reference to the transformUtil in the config for extensions to use
    (this.config as any)._transformUtil = this.transformUtil;

    // Initialize converters
    this.xmlToJsonConverter = new XmlToJsonConverter(this.config, this);
    this.jsonToXmlConverter = new JsonToXmlConverter(this.config, this);

    // Load extension methods
    this.loadExtensionMethods();
  }

  /**
   * Load all registered extension methods onto this instance
   * @private
   */
  private loadExtensionMethods(): void {
    for (const [name, method] of ExtensionRegistry.getAllMethods().entries()) {
      if (!(this as any)[name]) {
        // Bind the method to this instance
        (this as any)[name] = (...args: any[]) => {
          return method.apply(this, args);
        };
      }
    }
  }

  /**
   * Add a transformer for primitive values
   * @param direction Direction of transformation to apply the transformer to
   * @param transformer Value transformer
   * @returns This XJX instance for chaining
   */
  public addValueTransformer(
    direction: TransformDirection,
    transformer: ValueTransformer
  ): this {
    const transformers = this.valueTransformers.get(direction);
    if (transformers) {
      transformers.push(transformer);
    }
    return this;
  }

  /**
   * Add a transformer for attributes
   * @param direction Direction of transformation to apply the transformer to
   * @param transformer Attribute transformer
   * @returns This XJX instance for chaining
   */
  public addAttributeTransformer(
    direction: TransformDirection,
    transformer: AttributeTransformer
  ): this {
    const transformers = this.attributeTransformers.get(direction);
    if (transformers) {
      transformers.push(transformer);
    }
    return this;
  }

  /**
   * Add a transformer for children nodes
   * @param direction Direction of transformation to apply the transformer to
   * @param transformer Children transformer
   * @returns This XJX instance for chaining
   */
  public addChildrenTransformer(
    direction: TransformDirection,
    transformer: ChildrenTransformer
  ): this {
    const transformers = this.childrenTransformers.get(direction);
    if (transformers) {
      transformers.push(transformer);
    }
    return this;
  }

  /**
   * Add a generic transformer for nodes
   * @param direction Direction of transformation to apply the transformer to
   * @param transformer Node transformer
   * @returns This XJX instance for chaining
   */
  public addNodeTransformer(
    direction: TransformDirection,
    transformer: NodeTransformer
  ): this {
    const transformers = this.nodeTransformers.get(direction);
    if (transformers) {
      transformers.push(transformer);
    }
    return this;
  }

  /**
   * Clear all transformers
   * @param direction Optional specific direction to clear, or all if not specified
   * @returns This XJX instance for chaining
   */
  public clearTransformers(direction?: TransformDirection): this {
    if (direction) {
      // Clear transformers for specific direction
      this.valueTransformers.set(direction, []);
      this.attributeTransformers.set(direction, []);
      this.childrenTransformers.set(direction, []);
      this.nodeTransformers.set(direction, []);
    } else {
      // Clear all transformers
      this.valueTransformers.set(TransformDirection.XML_TO_JSON, []);
      this.valueTransformers.set(TransformDirection.JSON_TO_XML, []);
      this.attributeTransformers.set(TransformDirection.XML_TO_JSON, []);
      this.attributeTransformers.set(TransformDirection.JSON_TO_XML, []);
      this.childrenTransformers.set(TransformDirection.XML_TO_JSON, []);
      this.childrenTransformers.set(TransformDirection.JSON_TO_XML, []);
      this.nodeTransformers.set(TransformDirection.XML_TO_JSON, []);
      this.nodeTransformers.set(TransformDirection.JSON_TO_XML, []);
    }
    return this;
  }

  /**
   * Convert XML string to JSON
   * @param xmlString XML content as string
   * @returns JSON object representing the XML content
   */
  public xmlToJson(xmlString: string): Record<string, any> {
    return this.xmlToJsonConverter.convert(xmlString);
  }

  /**
   * Convert JSON object to XML string
   * @param jsonObj JSON object to convert
   * @returns XML string
   */
  public jsonToXml(jsonObj: Record<string, any>): string {
    return this.jsonToXmlConverter.convert(jsonObj);
  }

  /**
   * Pretty print an XML string
   * @param xmlString XML string to format
   * @returns Formatted XML string
   */
  public prettyPrintXml(xmlString: string): string {
    return this.xmlUtil.prettyPrintXml(xmlString);
  }

  /**
   * Validate XML string
   * @param xmlString XML string to validate
   * @returns Validation result
   */
  public validateXML(xmlString: string): {
    isValid: boolean;
    message?: string;
  } {
    return this.xmlUtil.validateXML(xmlString);
  }

  /**
   * Convert a standard JSON object to the XML-like JSON structure
   * @param obj Standard JSON object
   * @param root Optional root element configuration (string or object with properties)
   * @returns XML-like JSON object ready for conversion to XML
   */
  public objectToXJX(
    obj: any,
    root?: string | Record<string, any>
  ): Record<string, any> {
    return this.jsonUtil.objectToXJX(obj, root);
  }

  /**
   * Apply value transformers to a value
   * @param value The value to transform
   * @param node The node containing the value
   * @param context The transformation context
   * @returns The transformed value
   * @internal Used by converters
   */
  public applyValueTransformers(
    value: any,
    node: XNode,
    context: TransformContext
  ): any {
    let transformedValue = value;

    // Get transformers for the current direction
    const transformers = this.valueTransformers.get(context.direction) || [];

    for (const transformer of transformers) {
      const result = transformer.transform(transformedValue, node, context);
      
      // Check if the value should be removed
      if (result.remove) {
        return null;
      }
      
      transformedValue = result.value;
    }

    return transformedValue;
  }

  /**
   * Apply attribute transformers
   * @param name The attribute name
   * @param value The attribute value
   * @param node The node containing the attribute
   * @param context The transformation context
   * @returns Transformed [name, value] tuple or null if removed
   * @internal Used by converters
   */
  public applyAttributeTransformers(
    name: string,
    value: any,
    node: XNode,
    context: TransformContext
  ): [string, any] | null {
    let currentName = name;
    let currentValue = value;

    // Get transformers for the current direction
    const transformers = this.attributeTransformers.get(context.direction) || [];

    for (const transformer of transformers) {
      const result = transformer.transform(currentName, currentValue, node, context);
      
      // Check if the attribute should be removed
      if (result.remove) {
        return null;
      }
      
      [currentName, currentValue] = result.value;
    }

    return [currentName, currentValue];
  }

  /**
   * Apply node transformers
   * @param node The node to transform
   * @param context The transformation context
   * @returns The transformed node or null if removed
   * @internal Used by converters
   */
  public applyNodeTransformers(node: XNode, context: TransformContext): XNode | null {
    let transformedNode = { ...node };
    
    // Get transformers for the current direction
    const transformers = this.nodeTransformers.get(context.direction) || [];
    
    for (const transformer of transformers) {
      const result = transformer.transform(transformedNode, context);
      
      // Check if the node should be removed
      if (result.remove) {
        return null;
      }
      
      transformedNode = result.value;
    }
    
    return transformedNode;
  }

  /**
   * Apply children transformers
   * @param children The children array
   * @param node The parent node
   * @param context The transformation context
   * @returns The transformed children array or null if removed
   * @internal Used by converters
   */
  public applyChildrenTransformers(
    children: XNode[],
    node: XNode,
    context: TransformContext
  ): XNode[] | null {
    let transformedChildren = [...children];

    // Get transformers for the current direction
    const transformers = this.childrenTransformers.get(context.direction) || [];

    for (const transformer of transformers) {
      const result = transformer.transform(transformedChildren, node, context);
      
      // Check if the children should be removed
      if (result.remove) {
        return null;
      }
      
      transformedChildren = result.value;
    }

    return transformedChildren;
  }

  /**
   * Apply transformations to an XNode
   * @param node XNode to transform
   * @param context Transformation context
   * @returns Transformed XNode or null if removed
   * @internal Used by converters
   */
  public applyTransformations(
    node: XNode,
    context: TransformContext
  ): XNode | null {
    // 1. Apply node transformers to the node itself
    const transformedNode = this.applyNodeTransformers(node, context);
    if (transformedNode === null) {
      return null;
    }
    
    // 2. Apply value transformers to node's value
    if (transformedNode.value !== undefined) {
      const transformedValue = this.applyValueTransformers(
        transformedNode.value,
        transformedNode,
        context
      );
      
      if (transformedValue === null) {
        // Value was removed, remove the value property
        delete transformedNode.value;
      } else {
        // Update value
        transformedNode.value = transformedValue;
      }
    }

    // 3. Apply attribute transformers to node's attributes
    if (transformedNode.attributes) {
      const newAttributes: Record<string, any> = {};

      for (const [name, value] of Object.entries(transformedNode.attributes)) {
        // Create attribute-specific context
        const attrContext: TransformContext =
          this.transformUtil.createAttributeContext(context, name);

        // Apply value transformers to attribute value
        let attrValue = this.applyValueTransformers(value, transformedNode, attrContext);
        if (attrValue === null) continue; // Skip this attribute if value becomes null

        // Apply attribute transformers
        const result = this.applyAttributeTransformers(
          name,
          attrValue,
          transformedNode,
          attrContext
        );

        // Add transformed attribute if not null
        if (result !== null) {
          const [newName, newValue] = result;
          newAttributes[newName] = newValue;
        }
      }

      transformedNode.attributes = newAttributes;
    }

    // 4. Apply children transformers to node's children
    if (transformedNode.children) {
      const transformedChildren = this.applyChildrenTransformers(
        transformedNode.children,
        transformedNode,
        context
      );

      if (transformedChildren === null) {
        transformedNode.children = [];
      } else {
        transformedNode.children = transformedChildren;
      }

      // Recursively apply transformations to each child
      if (transformedNode.children.length > 0) {
        const newChildren: XNode[] = [];
        
        for (let i = 0; i < transformedNode.children.length; i++) {
          const child = transformedNode.children[i];
          const childContext = this.transformUtil.createChildContext(context, child, i);
          
          const transformedChild = this.applyTransformations(child, childContext);
          if (transformedChild !== null) {
            newChildren.push(transformedChild);
          }
        }
        
        transformedNode.children = newChildren;
      }
    }

    return transformedNode;
  }

  /**
   * Clean up any resources
   */
  public cleanup(): void {
    DOMAdapter.cleanup();
  }
}