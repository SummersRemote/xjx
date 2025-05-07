/**
 * Converter interfaces for XJX transformation pipeline
 */
import { 
    Configuration, 
    Transform, 
    NodeModel as XNode, 
    TransformContext,
    TransformDirection
  } from '../types/transform-interfaces';
  
  /**
   * Base converter interface
   */
  export interface Converter<TInput, TOutput> {
    /**
     * Convert from input to output format
     * @param input Input data
     * @returns Converted output
     */
    convert(input: TInput): TOutput;
  }
  
  /**
   * XML string to XNode converter
   */
  export interface XmlToXNodeConverter extends Converter<string, XNode> {
    /**
     * Convert XML DOM element to XNode
     * @param element DOM element
     * @param parentNode Optional parent node
     * @returns XNode representation
     */
    elementToXNode(element: Element, parentNode?: XNode): XNode;
  }
  
  /**
   * JSON object to XNode converter
   */
  export interface JsonToXNodeConverter extends Converter<Record<string, any>, XNode> {}
  
  /**
   * XNode to XML string converter
   */
  export interface XNodeToXmlConverter extends Converter<XNode, string> {
    /**
     * Convert XNode to DOM element
     * @param node XNode representation
     * @param doc DOM document
     * @returns DOM element
     */
    xnodeToDom(node: XNode, doc: Document): Element;
  }
  
  /**
   * XNode to JSON object converter
   */
  export interface XNodeToJsonConverter extends Converter<XNode, Record<string, any>> {}
  
  /**
   * XNode transformer
   */
  export interface XNodeTransformer {
    /**
     * Apply transformations to XNode
     * @param node XNode to transform
     * @param transforms Transformations to apply
     * @param direction Direction of transformation
     * @returns Transformed XNode
     */
    transform(node: XNode, transforms: Transform[], direction: TransformDirection): XNode;
    
    /**
     * Create root transformation context
     * @param node Root node
     * @param direction Direction of transformation
     * @returns Transformation context
     */
    createRootContext(node: XNode, direction: TransformDirection): TransformContext;
  }