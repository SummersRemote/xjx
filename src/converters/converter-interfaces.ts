/**
 * Converter interfaces for XJX transformation pipeline
 * 
 * Defines the interfaces for the different converters in the transformation pipeline.
 */
import { 
  Transform, 
  TransformContext,
  FormatId
} from '../core/transform';
import { Converter } from '../core/converter';
import { XNode } from '../core/xnode';
  
/**
 * XML string to XNode converter
 */
export interface XmlToXNodeConverter extends Converter<string, XNode> {
  /**
   * Convert DOM element to XNode
   * @param element DOM element
   * @param parentNode Optional parent node
   * @returns XNode representation
   */
  elementToXNode(element: Element, parentNode?: XNode): XNode;
}
  
/**
 * JSON object to XNode converter
 */
export interface XjxJsonToXNodeConverter extends Converter<Record<string, any>, XNode> {}
  
/**
 * Standard JSON object to XNode converter
 */
export interface StandardJsonToXNodeConverter extends Converter<Record<string, any> | any[], XNode> {}

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
 * XNode to Standard JSON converter
 */
export interface XNodeToStandardJsonConverter extends Converter<XNode, any> {}
  
/**
 * XNode transformer
 */
export interface XNodeTransformer {
  /**
   * Apply transformations to XNode
   * @param node XNode to transform
   * @param transforms Transformations to apply
   * @param targetFormat Target format identifier
   * @returns Transformed XNode
   */
  transform(node: XNode, transforms: Transform[], targetFormat: FormatId): XNode;
  
  /**
   * Create root transformation context
   * @param node Root node
   * @param targetFormat Target format
   * @returns Transformation context
   */
  createRootContext(node: XNode, targetFormat: FormatId): TransformContext;
}