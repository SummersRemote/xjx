/**
 * Template for creating a new converter for the XJX library
 * 
 * This template provides boilerplate code for creating converters that transform
 * between custom formats and XNode. Copy this file and modify as needed.
 * 
 * Steps to create a new converter:
 * 1. Replace 'MyFormat' with your format name throughout
 * 2. Define your input/output types
 * 3. Implement validation logic
 * 4. Implement parsing/conversion logic
 * 5. Add comprehensive tests
 * 6. Export from converters/index.ts
 */

import { Configuration } from '../core/config';
import { logger, ProcessingError, ValidationError } from '../core/error';
import { XNode, createElement, createTextNode, createCDATANode, createCommentNode, addChild } from '../core/xnode';
import { NodeType } from '../core/dom';
import { 
  Converter, 
  NodeCallback, 
  validateInput,
  applyNodeCallbacks
} from '../core/converter';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Options for MyFormat conversion
 */
export interface MyFormatOptions {
  // Define conversion-specific options
  encoding?: 'utf8' | 'utf16' | 'ascii';
  strictMode?: boolean;
  preserveFormatting?: boolean;
  customParser?: (input: any) => ParsedData;
  
  // Standard converter options
  highFidelity?: boolean;
  formatting?: {
    pretty?: boolean;
    indent?: number;
  };
}

/**
 * Input type for your format
 * Replace with your actual input type(s)
 */
export type MyFormatInput = string | Buffer | MyFormatObject | MyFormatArray;

/**
 * Object representation of your format
 */
export interface MyFormatObject {
  version?: string;
  metadata?: Record<string, any>;
  content: MyFormatContent;
}

/**
 * Array representation of your format
 */
export type MyFormatArray = MyFormatElement[];

/**
 * Content structure within your format
 */
export interface MyFormatContent {
  elements: MyFormatElement[];
  attributes?: Record<string, any>;
}

/**
 * Individual elements in your format
 */
export interface MyFormatElement {
  name: string;
  type?: 'element' | 'text' | 'comment' | 'cdata';
  value?: any;
  attributes?: Record<string, any>;
  children?: MyFormatElement[];
  namespace?: string;
  prefix?: string;
}

/**
 * Internal parsed representation
 */
export interface ParsedData {
  root: ParsedElement;
  metadata: Record<string, any>;
  namespaces?: Record<string, string>;
}

export interface ParsedElement {
  name: string;
  type: NodeType;
  value?: any;
  attributes?: Record<string, any>;
  children?: ParsedElement[];
  namespace?: string;
  prefix?: string;
  namespaceDeclarations?: Record<string, string>;
}

// ============================================================================
// CONVERTER IMPLEMENTATION
// ============================================================================

/**
 * MyFormat to XNode converter
 * 
 * Converts from your custom format to XNode representation for processing
 * within the XJX pipeline.
 */
export const myFormatToXNodeConverter: Converter<MyFormatInput, XNode, MyFormatOptions> = {
  convert(
    input: MyFormatInput,
    config: Configuration,
    options: MyFormatOptions = {},
    beforeFn?: NodeCallback,
    afterFn?: NodeCallback
  ): XNode {
    // ========================================================================
    // INPUT VALIDATION
    // ========================================================================
    
    validateInput(input !== null && input !== undefined, 'MyFormat input cannot be null or undefined');
    validateInput(isValidMyFormatInput(input), 'Input must be valid MyFormat');
    
    logger.debug('Starting MyFormat to XNode conversion', {
      inputType: getInputType(input),
      inputSize: getInputSize(input),
      hasCallbacks: !!(beforeFn || afterFn),
      options: sanitizeOptionsForLogging(options)
    });

    try {
      // ====================================================================
      // PARSING PHASE
      // ====================================================================
      
      // Parse input into internal representation
      const parsedData = parseMyFormatInput(input, options);
      
      logger.debug('Successfully parsed MyFormat input', {
        rootElementName: parsedData.root.name,
        elementCount: countElements(parsedData.root),
        hasNamespaces: !!parsedData.namespaces
      });

      // ====================================================================
      // CONVERSION PHASE
      // ====================================================================
      
      // Convert parsed data to XNode tree
      const rootNode = convertParsedElementToXNode(
        parsedData.root,
        config,
        parsedData.namespaces || {},
        beforeFn,
        afterFn
      );

      // Add global metadata if present
      if (parsedData.metadata && Object.keys(parsedData.metadata).length > 0) {
        rootNode.metadata = { ...rootNode.metadata, ...parsedData.metadata };
      }

      logger.debug('Successfully converted MyFormat to XNode', {
        rootNodeName: rootNode.name,
        rootNodeType: rootNode.type,
        childCount: rootNode.children?.length || 0
      });

      return rootNode;

    } catch (err) {
      const errorMessage = `Failed to convert MyFormat to XNode: ${
        err instanceof Error ? err.message : String(err)
      }`;
      
      logger.error('MyFormat conversion failed', {
        error: err,
        inputType: getInputType(input)
      });
      
      throw new ProcessingError(errorMessage, input);
    }
  }
};

/**
 * XNode to MyFormat converter
 * 
 * Converts from XNode representation back to your custom format.
 * Implement this if you need bi-directional conversion.
 */
export const xnodeToMyFormatConverter: Converter<XNode, MyFormatOutput, MyFormatOptions> = {
  convert(
    node: XNode,
    config: Configuration,
    options: MyFormatOptions = {},
    beforeFn?: NodeCallback,
    afterFn?: NodeCallback
  ): MyFormatOutput {
    validateInput(node !== null && node !== undefined, 'XNode input cannot be null or undefined');
    validateInput(node.type === NodeType.ELEMENT_NODE, 'Input must be an element node');

    logger.debug('Starting XNode to MyFormat conversion', {
      nodeName: node.name,
      nodeType: node.type,
      hasCallbacks: !!(beforeFn || afterFn)
    });

    try {
      // Apply before callback
      applyNodeCallbacks(node, beforeFn);

      // Convert XNode to your format
      const result = convertXNodeToMyFormat(node, config, options, beforeFn, afterFn);

      // Apply after callback
      applyNodeCallbacks(node, undefined, afterFn);

      logger.debug('Successfully converted XNode to MyFormat');
      return result;

    } catch (err) {
      throw new ProcessingError(
        `Failed to convert XNode to MyFormat: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
};

// Define output type for XNode to MyFormat conversion
export type MyFormatOutput = string | MyFormatObject;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate that input is a supported MyFormat type
 */
function isValidMyFormatInput(input: any): input is MyFormatInput {
  if (typeof input === 'string') {
    return input.trim().length > 0 && looksLikeMyFormat(input);
  }
  
  if (Buffer.isBuffer(input)) {
    return input.length > 0;
  }
  
  if (Array.isArray(input)) {
    return input.every(item => isValidMyFormatElement(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    return 'content' in input && isValidMyFormatContent(input.content);
  }
  
  return false;
}

/**
 * Check if string looks like your format
 */
function looksLikeMyFormat(input: string): boolean {
  // Implement format-specific detection logic
  // For example, check for specific headers, patterns, etc.
  return input.includes('myformat') || input.startsWith('MF:') || /^MyFormat/i.test(input);
}

/**
 * Validate MyFormat element structure
 */
function isValidMyFormatElement(element: any): element is MyFormatElement {
  return (
    typeof element === 'object' &&
    element !== null &&
    typeof element.name === 'string' &&
    element.name.length > 0
  );
}

/**
 * Validate MyFormat content structure
 */
function isValidMyFormatContent(content: any): content is MyFormatContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    Array.isArray(content.elements) &&
    content.elements.every(isValidMyFormatElement)
  );
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse MyFormat input into internal representation
 */
function parseMyFormatInput(input: MyFormatInput, options: MyFormatOptions): ParsedData {
  if (typeof input === 'string') {
    return parseMyFormatString(input, options);
  }
  
  if (Buffer.isBuffer(input)) {
    return parseMyFormatBuffer(input, options);
  }
  
  if (Array.isArray(input)) {
    return parseMyFormatArray(input, options);
  }
  
  if (typeof input === 'object') {
    return parseMyFormatObject(input, options);
  }
  
  throw new ValidationError('Unsupported MyFormat input type');
}

/**
 * Parse string format
 */
function parseMyFormatString(input: string, options: MyFormatOptions): ParsedData {
  logger.debug('Parsing MyFormat string', { length: input.length });
  
  // Use custom parser if provided
  if (options.customParser) {
    return options.customParser(input);
  }
  
  // Implement your string parsing logic here
  // This is a placeholder implementation
  const lines = input.split('\n').filter(line => line.trim());
  const elements: ParsedElement[] = [];
  let metadata: Record<string, any> = {};
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      // Comment line
      if (options.strictMode) {
        elements.push({
          name: '#comment',
          type: NodeType.COMMENT_NODE,
          value: line.substring(1).trim()
        });
      }
    } else if (line.includes('=')) {
      // Key-value pair
      const [key, value] = line.split('=', 2);
      elements.push({
        name: key.trim(),
        type: NodeType.ELEMENT_NODE,
        value: value.trim()
      });
    } else if (line.startsWith('META:')) {
      // Metadata
      const metaLine = line.substring(5).trim();
      if (metaLine.includes('=')) {
        const [key, value] = metaLine.split('=', 2);
        metadata[key.trim()] = value.trim();
      }
    }
  }
  
  return {
    root: {
      name: 'root',
      type: NodeType.ELEMENT_NODE,
      children: elements
    },
    metadata
  };
}

/**
 * Parse buffer format
 */
function parseMyFormatBuffer(input: Buffer, options: MyFormatOptions): ParsedData {
  const encoding = options.encoding || 'utf8';
  const stringData = input.toString(encoding);
  return parseMyFormatString(stringData, options);
}

/**
 * Parse array format
 */
function parseMyFormatArray(input: MyFormatArray, options: MyFormatOptions): ParsedData {
  const elements = input.map(item => convertMyFormatElementToParsed(item, options));
  
  return {
    root: {
      name: 'root',
      type: NodeType.ELEMENT_NODE,
      children: elements
    },
    metadata: {}
  };
}

/**
 * Parse object format
 */
function parseMyFormatObject(input: MyFormatObject, options: MyFormatOptions): ParsedData {
  const elements = input.content.elements.map(item => 
    convertMyFormatElementToParsed(item, options)
  );
  
  return {
    root: {
      name: 'root',
      type: NodeType.ELEMENT_NODE,
      children: elements,
      attributes: input.content.attributes
    },
    metadata: input.metadata || {}
  };
}

/**
 * Convert MyFormat element to parsed element
 */
function convertMyFormatElementToParsed(
  element: MyFormatElement, 
  options: MyFormatOptions
): ParsedElement {
  const parsed: ParsedElement = {
    name: element.name,
    type: mapMyFormatTypeToNodeType(element.type || 'element'),
    value: element.value,
    attributes: element.attributes,
    namespace: element.namespace,
    prefix: element.prefix
  };
  
  if (element.children) {
    parsed.children = element.children.map(child => 
      convertMyFormatElementToParsed(child, options)
    );
  }
  
  return parsed;
}

/**
 * Map your format's type system to XJX NodeType
 */
function mapMyFormatTypeToNodeType(type: string): NodeType {
  switch (type) {
    case 'element': return NodeType.ELEMENT_NODE;
    case 'text': return NodeType.TEXT_NODE;
    case 'comment': return NodeType.COMMENT_NODE;
    case 'cdata': return NodeType.CDATA_SECTION_NODE;
    default: return NodeType.ELEMENT_NODE;
  }
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert parsed element to XNode
 */
function convertParsedElementToXNode(
  element: ParsedElement,
  config: Configuration,
  namespaces: Record<string, string>,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): XNode {
  let node: XNode;
  
  // Create appropriate node type
  switch (element.type) {
    case NodeType.TEXT_NODE:
      node = createTextNode(element.value || '');
      break;
    case NodeType.COMMENT_NODE:
      node = createCommentNode(element.value || '');
      break;
    case NodeType.CDATA_SECTION_NODE:
      node = createCDATANode(element.value || '');
      break;
    case NodeType.ELEMENT_NODE:
    default:
      node = createElement(element.name);
      break;
  }
  
  // Apply before callback
  applyNodeCallbacks(node, beforeFn);
  
  // Set attributes if present and configured
  if (element.attributes && config.preserveAttributes) {
    node.attributes = { ...element.attributes };
  }
  
  // Set namespace information if configured
  if (config.preserveNamespaces) {
    if (element.namespace) {
      node.namespace = element.namespace;
    }
    if (element.prefix) {
      node.prefix = element.prefix;
    }
    if (element.namespaceDeclarations) {
      node.namespaceDeclarations = { ...element.namespaceDeclarations };
    }
  }
  
  // Set value for non-element nodes
  if (element.type !== NodeType.ELEMENT_NODE && element.value !== undefined) {
    node.value = element.value;
  }
  
  // Process children for element nodes
  if (element.type === NodeType.ELEMENT_NODE && element.children) {
    for (const child of element.children) {
      const childNode = convertParsedElementToXNode(
        child, 
        config, 
        namespaces, 
        beforeFn, 
        afterFn
      );
      addChild(node, childNode);
    }
  }
  
  // Set direct value for elements with no children but with value
  if (element.type === NodeType.ELEMENT_NODE && 
      element.value !== undefined && 
      (!element.children || element.children.length === 0)) {
    node.value = element.value;
  }
  
  // Apply after callback
  applyNodeCallbacks(node, undefined, afterFn);
  
  return node;
}

/**
 * Convert XNode back to your format
 */
function convertXNodeToMyFormat(
  node: XNode,
  config: Configuration,
  options: MyFormatOptions,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): MyFormatOutput {
  // Implement reverse conversion logic
  const myFormatElement = convertXNodeToMyFormatElement(node, config);
  
  if (options.formatting?.pretty) {
    // Return formatted object
    return {
      version: '1.0',
      metadata: node.metadata || {},
      content: {
        elements: [myFormatElement],
        attributes: node.attributes
      }
    };
  } else {
    // Return compact string representation
    return serializeMyFormatElement(myFormatElement);
  }
}

/**
 * Convert XNode to MyFormat element
 */
function convertXNodeToMyFormatElement(node: XNode, config: Configuration): MyFormatElement {
  const element: MyFormatElement = {
    name: node.name,
    type: mapNodeTypeToMyFormatType(node.type)
  };
  
  if (node.value !== undefined) {
    element.value = node.value;
  }
  
  if (node.attributes && config.preserveAttributes) {
    element.attributes = { ...node.attributes };
  }
  
  if (config.preserveNamespaces) {
    if (node.namespace) element.namespace = node.namespace;
    if (node.prefix) element.prefix = node.prefix;
  }
  
  if (node.children && node.children.length > 0) {
    element.children = node.children.map(child => 
      convertXNodeToMyFormatElement(child, config)
    );
  }
  
  return element;
}

/**
 * Map NodeType back to your format's type system
 */
function mapNodeTypeToMyFormatType(nodeType: NodeType): MyFormatElement['type'] {
  switch (nodeType) {
    case NodeType.ELEMENT_NODE: return 'element';
    case NodeType.TEXT_NODE: return 'text';
    case NodeType.COMMENT_NODE: return 'comment';
    case NodeType.CDATA_SECTION_NODE: return 'cdata';
    default: return 'element';
  }
}

/**
 * Serialize MyFormat element to string
 */
function serializeMyFormatElement(element: MyFormatElement): string {
  let result = `${element.name}`;
  
  if (element.value !== undefined) {
    result += `=${element.value}`;
  }
  
  if (element.children) {
    const childrenStr = element.children
      .map(child => serializeMyFormatElement(child))
      .join('\n');
    result += `\n${childrenStr}`;
  }
  
  return result;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get input type for logging
 */
function getInputType(input: MyFormatInput): string {
  if (typeof input === 'string') return 'string';
  if (Buffer.isBuffer(input)) return 'buffer';
  if (Array.isArray(input)) return 'array';
  return 'object';
}

/**
 * Get input size for logging
 */
function getInputSize(input: MyFormatInput): number {
  if (typeof input === 'string') return input.length;
  if (Buffer.isBuffer(input)) return input.length;
  if (Array.isArray(input)) return input.length;
  return Object.keys(input).length;
}

/**
 * Remove sensitive data from options for logging
 */
function sanitizeOptionsForLogging(options: MyFormatOptions): Partial<MyFormatOptions> {
  const { customParser, ...safeOptions } = options;
  return {
    ...safeOptions,
    customParser: customParser ? '[Function]' : undefined
  };
}

/**
 * Count elements in parsed tree
 */
function countElements(element: ParsedElement): number {
  let count = 1;
  if (element.children) {
    count += element.children.reduce((acc, child) => acc + countElements(child), 0);
  }
  return count;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export main converters
export {
  myFormatToXNodeConverter,
  xnodeToMyFormatConverter
};

// Export types for use by extensions
export type {
  MyFormatOptions,
  MyFormatInput,
  MyFormatOutput,
  MyFormatObject,
  MyFormatArray,
  MyFormatElement,
  MyFormatContent,
  ParsedData,
  ParsedElement
};