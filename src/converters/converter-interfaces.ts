/**
 * Converter interfaces for XJX transformation pipeline
 * 
 * Defines the interfaces for the different converters in the transformation pipeline.
 */
import {   Configuration } from "../core/config";
import { 
  Transform, 
  TransformContext,
  FormatId
} from '../core/transform';
import { XNode } from '../core/xnode';
  
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