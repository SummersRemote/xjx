/**
 * Template for creating new extensions for the XJX library
 * 
 * This template provides boilerplate code for creating both terminal and 
 * non-terminal extensions. Copy this file and modify as needed.
 * 
 * Steps to create a new extension:
 * 1. Choose terminal or non-terminal type
 * 2. Replace 'MyExtension' with your extension name throughout
 * 3. Define your parameter and return types
 * 4. Implement your extension logic
 * 5. Add comprehensive tests
 * 6. Import in src/index.ts to auto-register
 */

import { XJX } from '../XJX';
import { XNode, createElement, addChild, cloneNode } from '../core/xnode';
import { logger, ValidationError, ProcessingError } from '../core/error';
import { NodeType } from '../core/dom';
import { 
  TerminalExtensionContext, 
  NonTerminalExtensionContext 
} from '../core/extension';
import { 
  validateInput, 
  NodeCallback, 
  applyNodeCallbacks 
} from '../core/converter';
import { transformXNode } from '../converters/xnode-transformer';

// ============================================================================
// EXTENSION TYPE 1: TERMINAL EXTENSION
// ============================================================================

/**
 * Options for terminal extension
 */
export interface MyTerminalOptions {
  // Define your extension-specific options
  format?: 'compact' | 'verbose' | 'custom';
  includeMetadata?: boolean;
  customSerializer?: (data: any) => string;
  encoding?: 'utf8' | 'base64' | 'hex';
  
  // Output formatting options
  pretty?: boolean;
  indent?: number;
  maxDepth?: number;
}

/**
 * Return type for terminal extension
 */
export interface MyTerminalResult {
  // Define your return type structure
  data: any;
  metadata: {
    processedAt: Date;
    nodeCount: number;
    format: string;
  };
  statistics?: {
    elements: number;
    attributes: number;
    textNodes: number;
  };
}

/**
 * Terminal extension that processes the document and returns a value
 * 
 * Terminal extensions:
 * - End the method chain (return a value instead of 'this')
 * - Should call this.validateSource() to ensure source is set
 * - Can apply pending transforms before processing
 * - Return any type of value (string, object, array, etc.)
 * 
 * @example
 * ```typescript
 * const result = new XJX()
 *   .fromXml(xml)
 *   .filter(node => node.name === 'item')
 *   .myTerminalMethod({ format: 'verbose' });
 * 
 * console.log(result.data);
 * console.log(result.metadata.nodeCount);
 * ```
 */
export function myTerminalMethod(
  this: TerminalExtensionContext,
  options: MyTerminalOptions = {}
): MyTerminalResult {
  try {
    // ========================================================================
    // INPUT VALIDATION & SETUP
    // ========================================================================
    
    // Source validation is handled by the registration mechanism
    // But we can add our own parameter validation
    validateInput(
      options && typeof options === 'object', 
      'Options must be an object'
    );
    
    // Validate specific options
    if (options.format) {
      validateInput(
        ['compact', 'verbose', 'custom'].includes(options.format),
        'Format must be compact, verbose, or custom'
      );
    }
    
    if (options.maxDepth !== undefined) {
      validateInput(
        typeof options.maxDepth === 'number' && options.maxDepth > 0,
        'maxDepth must be a positive number'
      );
    }
    
    logger.debug('Starting terminal extension operation', {
      hasTransforms: this.transforms.length > 0,
      options: sanitizeOptionsForLogging(options)
    });

    // ========================================================================
    // TRANSFORM APPLICATION
    // ========================================================================
    
    // Apply any pending transforms before processing
    let nodeToProcess = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      logger.debug('Applying pending transforms', {
        transformCount: this.transforms.length
      });
      
      nodeToProcess = transformXNode(nodeToProcess, this.transforms, this.config);
    }

    // ========================================================================
    // MAIN PROCESSING LOGIC
    // ========================================================================
    
    // Collect statistics
    const statistics = gatherStatistics(nodeToProcess);
    
    // Process based on format option
    let processedData: any;
    
    switch (options.format) {
      case 'compact':
        processedData = processCompactFormat(nodeToProcess, options);
        break;
      case 'verbose':
        processedData = processVerboseFormat(nodeToProcess, options);
        break;
      case 'custom':
        if (!options.customSerializer) {
          throw new ValidationError('customSerializer is required when format is "custom"');
        }
        processedData = options.customSerializer(nodeToProcess);
        break;
      default:
        processedData = processDefaultFormat(nodeToProcess, options);
        break;
    }

    // ========================================================================
    // RESULT CONSTRUCTION
    // ========================================================================
    
    const result: MyTerminalResult = {
      data: processedData,
      metadata: {
        processedAt: new Date(),
        nodeCount: statistics.total,
        format: options.format || 'default'
      }
    };
    
    // Include statistics if requested
    if (options.includeMetadata) {
      result.statistics = {
        elements: statistics.elements,
        attributes: statistics.attributes,
        textNodes: statistics.textNodes
      };
    }
    
    logger.debug('Successfully completed terminal extension operation', {
      resultDataType: typeof result.data,
      nodeCount: result.metadata.nodeCount
    });
    
    return result;
    
  } catch (err) {
    logger.error('Terminal extension operation failed', { error: err });
    
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed in myTerminalMethod: ${String(err)}`);
  }
}

// ============================================================================
// EXTENSION TYPE 2: NON-TERMINAL EXTENSION
// ============================================================================

/**
 * Options for non-terminal extension
 */
export interface MyNonTerminalOptions {
  // Define your extension-specific options
  operation?: 'transform' | 'filter' | 'augment' | 'rearrange';
  target?: string | RegExp | ((node: XNode) => boolean);
  replacement?: any;
  
  // Processing options
  recursive?: boolean;
  preserveOriginal?: boolean;
  addMetadata?: boolean;
  
  // Callback options
  beforeProcess?: (node: XNode) => void;
  afterProcess?: (node: XNode) => void;
}

/**
 * Non-terminal extension that modifies the processing pipeline
 * 
 * Non-terminal extensions:
 * - Return 'this' to enable method chaining
 * - Can modify this.xnode (the current document tree)
 * - Can add transforms to this.transforms array
 * - Can be called multiple times in a chain
 * 
 * @example
 * ```typescript
 * const result = new XJX()
 *   .fromXml(xml)
 *   .myNonTerminalMethod({ operation: 'transform', target: 'price' })
 *   .myNonTerminalMethod({ operation: 'filter', target: /[0-9]+/ })
 *   .toJson();
 * ```
 */
export function myNonTerminalMethod(
  this: NonTerminalExtensionContext,
  options: MyNonTerminalOptions = {}
): void {
  try {
    // ========================================================================
    // INPUT VALIDATION & SETUP
    // ========================================================================
    
    validateInput(
      options && typeof options === 'object',
      'Options must be an object'
    );
    
    // Validate operation type
    if (options.operation) {
      validateInput(
        ['transform', 'filter', 'augment', 'rearrange'].includes(options.operation),
        'Operation must be transform, filter, augment, or rearrange'
      );
    }
    
    // Validate target parameter
    if (options.target !== undefined) {
      validateInput(
        typeof options.target === 'string' || 
        options.target instanceof RegExp ||
        typeof options.target === 'function',
        'Target must be a string, RegExp, or function'
      );
    }
    
    logger.debug('Starting non-terminal extension operation', {
      operation: options.operation || 'default',
      hasSource: !!this.xnode,
      targetType: options.target ? typeof options.target : 'none'
    });

    // ========================================================================
    // SOURCE VALIDATION (if required)
    // ========================================================================
    
    // Only validate source if this operation requires it
    const requiresSource = needsSourceForOperation(options.operation || 'transform');
    
    if (requiresSource) {
      this.validateSource();
    }

    // ========================================================================
    // MAIN PROCESSING LOGIC
    // ========================================================================
    
    switch (options.operation) {
      case 'transform':
        performTransformOperation(this, options);
        break;
      case 'filter':
        performFilterOperation(this, options);
        break;
      case 'augment':
        performAugmentOperation(this, options);
        break;
      case 'rearrange':
        performRearrangeOperation(this, options);
        break;
      default:
        performDefaultOperation(this, options);
        break;
    }
    
    logger.debug('Successfully completed non-terminal extension operation', {
      operation: options.operation || 'default',
      resultNodeName: this.xnode?.name
    });
    
  } catch (err) {
    logger.error('Non-terminal extension operation failed', { 
      error: err,
      operation: options.operation 
    });
    
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed in myNonTerminalMethod: ${String(err)}`);
  }
}

// ============================================================================
// TERMINAL EXTENSION HELPER FUNCTIONS
// ============================================================================

/**
 * Gather statistics about the node tree
 */
function gatherStatistics(node: XNode): {
  total: number;
  elements: number;
  attributes: number;
  textNodes: number;
} {
  let stats = {
    total: 0,
    elements: 0,
    attributes: 0,
    textNodes: 0
  };
  
  function traverse(currentNode: XNode) {
    stats.total++;
    
    switch (currentNode.type) {
      case NodeType.ELEMENT_NODE:
        stats.elements++;
        if (currentNode.attributes) {
          stats.attributes += Object.keys(currentNode.attributes).length;
        }
        break;
      case NodeType.TEXT_NODE:
      case NodeType.CDATA_SECTION_NODE:
        stats.textNodes++;
        break;
    }
    
    if (currentNode.children) {
      currentNode.children.forEach(traverse);
    }
  }
  
  traverse(node);
  return stats;
}

/**
 * Process node in compact format
 */
function processCompactFormat(node: XNode, options: MyTerminalOptions): any {
  // Implement compact format processing
  return {
    name: node.name,
    value: node.value,
    children: node.children?.length || 0
  };
}

/**
 * Process node in verbose format
 */
function processVerboseFormat(node: XNode, options: MyTerminalOptions): any {
  // Implement verbose format processing
  function processNode(currentNode: XNode, depth: number = 0): any {
    if (options.maxDepth && depth > options.maxDepth) {
      return '[MAX_DEPTH_REACHED]';
    }
    
    const result: any = {
      name: currentNode.name,
      type: currentNode.type,
      depth
    };
    
    if (currentNode.value !== undefined) {
      result.value = currentNode.value;
    }
    
    if (currentNode.attributes) {
      result.attributes = { ...currentNode.attributes };
    }
    
    if (currentNode.children && currentNode.children.length > 0) {
      result.children = currentNode.children.map(child => 
        processNode(child, depth + 1)
      );
    }
    
    return result;
  }
  
  return processNode(node);
}

/**
 * Process node in default format
 */
function processDefaultFormat(node: XNode, options: MyTerminalOptions): any {
  // Implement default format processing
  return node;
}

/**
 * Remove sensitive data from options for logging
 */
function sanitizeOptionsForLogging(options: MyTerminalOptions): Partial<MyTerminalOptions> {
  const { customSerializer, ...safeOptions } = options;
  return {
    ...safeOptions,
    customSerializer: customSerializer ? '[Function]' : undefined
  };
}

// ============================================================================
// NON-TERMINAL EXTENSION HELPER FUNCTIONS
// ============================================================================

/**
 * Check if operation needs a source to be set
 */
function needsSourceForOperation(operation: string): boolean {
  // Most operations need source, but some might not
  switch (operation) {
    case 'transform':
    case 'filter':
    case 'augment':
    case 'rearrange':
      return true;
    default:
      return false;  // Configuration operations might not need source
  }
}

/**
 * Perform transform operation
 */
function performTransformOperation(
  context: NonTerminalExtensionContext,
  options: MyNonTerminalOptions
): void {
  if (!context.xnode) return;
  
  logger.debug('Performing transform operation', {
    target: options.target,
    recursive: options.recursive
  });
  
  // Create a new transformed tree
  const transformedNode = transformNodeTree(context.xnode, options);
  
  // Update the context
  context.xnode = transformedNode;
}

/**
 * Perform filter operation
 */
function performFilterOperation(
  context: NonTerminalExtensionContext,
  options: MyNonTerminalOptions
): void {
  if (!context.xnode) return;
  
  logger.debug('Performing filter operation');
  
  const predicate = createPredicateFromTarget(options.target);
  const filteredNode = filterNodeTree(context.xnode, predicate, options);
  
  context.xnode = filteredNode;
}

/**
 * Perform augment operation  
 */
function performAugmentOperation(
  context: NonTerminalExtensionContext,
  options: MyNonTerminalOptions
): void {
  if (!context.xnode) return;
  
  logger.debug('Performing augment operation');
  
  const augmentedNode = augmentNodeTree(context.xnode, options);
  context.xnode = augmentedNode;
}

/**
 * Perform rearrange operation
 */
function performRearrangeOperation(
  context: NonTerminalExtensionContext,
  options: MyNonTerminalOptions
): void {
  if (!context.xnode) return;
  
  logger.debug('Performing rearrange operation');
  
  const rearrangedNode = rearrangeNodeTree(context.xnode, options);
  context.xnode = rearrangedNode;
}

/**
 * Perform default operation
 */
function performDefaultOperation(
  context: NonTerminalExtensionContext,
  options: MyNonTerminalOptions
): void {
  // Default operation - might just add metadata or perform minimal processing
  if (context.xnode && options.addMetadata) {
    if (!context.xnode.metadata) {
      context.xnode.metadata = {};
    }
    context.xnode.metadata.processedBy = 'myNonTerminalMethod';
    context.xnode.metadata.processedAt = new Date().toISOString();
  }
}

/**
 * Transform node tree based on options
 */
function transformNodeTree(node: XNode, options: MyNonTerminalOptions): XNode {
  const cloned = cloneNode(node, true);
  
  function traverse(currentNode: XNode) {
    // Apply before callback if provided
    if (options.beforeProcess) {
      try {
        options.beforeProcess(currentNode);
      } catch (err) {
        logger.warn('Error in beforeProcess callback', { error: err });
      }
    }
    
    // Perform transformation based on target
    if (matchesTarget(currentNode, options.target)) {
      // Apply transformation
      if (options.replacement !== undefined) {
        currentNode.value = options.replacement;
      }
      
      // Add metadata if requested
      if (options.addMetadata) {
        if (!currentNode.metadata) {
          currentNode.metadata = {};
        }
        currentNode.metadata.transformed = true;
      }
    }
    
    // Recursively process children if requested
    if (options.recursive && currentNode.children) {
      currentNode.children.forEach(traverse);
    }
    
    // Apply after callback if provided
    if (options.afterProcess) {
      try {
        options.afterProcess(currentNode);
      } catch (err) {
        logger.warn('Error in afterProcess callback', { error: err });
      }
    }
  }
  
  traverse(cloned);
  return cloned;
}

/**
 * Filter node tree based on predicate
 */
function filterNodeTree(
  node: XNode, 
  predicate: (node: XNode) => boolean,
  options: MyNonTerminalOptions
): XNode {
  const cloned = cloneNode(node, false);
  
  function shouldKeepNode(currentNode: XNode): boolean {
    try {
      return predicate(currentNode);
    } catch (err) {
      logger.warn('Error in filter predicate', { error: err });
      return true; // Keep node on error
    }
  }
  
  function filterChildren(currentNode: XNode): XNode[] {
    if (!currentNode.children) return [];
    
    return currentNode.children
      .filter(shouldKeepNode)
      .map(child => {
        const filteredChild = cloneNode(child, false);
        if (options.recursive) {
          filteredChild.children = filterChildren(child);
        }
        filteredChild.parent = currentNode;
        return filteredChild;
      });
  }
  
  cloned.children = filterChildren(node);
  return cloned;
}

/**
 * Augment node tree with additional data
 */
function augmentNodeTree(node: XNode, options: MyNonTerminalOptions): XNode {
  const cloned = cloneNode(node, true);
  
  function traverse(currentNode: XNode) {
    if (matchesTarget(currentNode, options.target)) {
      // Add augmentation data
      if (options.replacement && typeof options.replacement === 'object') {
        // Merge replacement data into attributes
        if (!currentNode.attributes) {
          currentNode.attributes = {};
        }
        Object.assign(currentNode.attributes, options.replacement);
      }
      
      // Add metadata
      if (!currentNode.metadata) {
        currentNode.metadata = {};
      }
      currentNode.metadata.augmented = true;
      currentNode.metadata.augmentedAt = new Date().toISOString();
    }
    
    if (options.recursive && currentNode.children) {
      currentNode.children.forEach(traverse);
    }
  }
  
  traverse(cloned);
  return cloned;
}

/**
 * Rearrange node tree structure
 */
function rearrangeNodeTree(node: XNode, options: MyNonTerminalOptions): XNode {
  const cloned = cloneNode(node, true);
  
  // Implement rearrangement logic based on your needs
  // This is a placeholder implementation that reverses child order
  function traverse(currentNode: XNode) {
    if (currentNode.children && currentNode.children.length > 1) {
      if (matchesTarget(currentNode, options.target)) {
        currentNode.children.reverse();
      }
    }
    
    if (options.recursive && currentNode.children) {
      currentNode.children.forEach(traverse);
    }
  }
  
  traverse(cloned);
  return cloned;
}

/**
 * Check if node matches the target criteria
 */
function matchesTarget(
  node: XNode, 
  target: MyNonTerminalOptions['target']
): boolean {
  if (!target) return true;
  
  if (typeof target === 'string') {
    return node.name === target;
  }
  
  if (target instanceof RegExp) {
    return target.test(node.name) || 
           (node.value && target.test(String(node.value)));
  }
  
  if (typeof target === 'function') {
    try {
      return target(node);
    } catch (err) {
      logger.warn('Error in target function', { error: err });
      return false;
    }
  }
  
  return false;
}

/**
 * Create predicate function from target
 */
function createPredicateFromTarget(
  target: MyNonTerminalOptions['target']
): (node: XNode) => boolean {
  if (typeof target === 'function') {
    return target;
  }
  
  return (node: XNode) => matchesTarget(node, target);
}

// ============================================================================
// EXTENSION REGISTRATION
// ============================================================================

// Register the terminal extension
XJX.registerTerminalExtension('myTerminalMethod', myTerminalMethod);

// Register the non-terminal extension  
XJX.registerNonTerminalExtension('myNonTerminalMethod', myNonTerminalMethod);

// ============================================================================
// EXPORTS FOR TESTING AND TYPE DEFINITIONS
// ============================================================================

export {
  // Extension functions
  myTerminalMethod,
  myNonTerminalMethod,
  
  // Helper functions (for testing)
  gatherStatistics,
  transformNodeTree,
  filterNodeTree,
  matchesTarget
};

export type {
  // Options interfaces
  MyTerminalOptions,
  MyNonTerminalOptions,
  
  // Result interfaces
  MyTerminalResult
};

// ============================================================================
// USAGE EXAMPLES AND DOCUMENTATION
// ============================================================================

/**
 * Example usage patterns for the extensions:
 * 
 * @example Terminal Extension
 * ```typescript
 * import { XJX } from 'xjx';
 * import './my-extension'; // Auto-registers extensions
 * 
 * const xml = '<items><item id="1">First</item><item id="2">Second</item></items>';
 * 
 * // Basic usage
 * const result = new XJX()
 *   .fromXml(xml)
 *   .myTerminalMethod();
 * 
 * console.log(result.data);
 * console.log(result.metadata.nodeCount);
 * 
 * // With options
 * const verboseResult = new XJX()
 *   .fromXml(xml)
 *   .myTerminalMethod({
 *     format: 'verbose',
 *     includeMetadata: true,
 *     maxDepth: 3
 *   });
 * 
 * console.log(verboseResult.statistics);
 * ```
 * 
 * @example Non-Terminal Extension
 * ```typescript
 * // Chain multiple operations
 * const processedJson = new XJX()
 *   .fromXml(xml)
 *   .myNonTerminalMethod({ 
 *     operation: 'transform', 
 *     target: 'item',
 *     replacement: 'ITEM',
 *     addMetadata: true
 *   })
 *   .myNonTerminalMethod({ 
 *     operation: 'filter', 
 *     target: node => node.attributes?.id === '1' 
 *   })
 *   .toJson();
 * 
 * // Use with other XJX methods
 * const filtered = new XJX()
 *   .fromXml(xml)
 *   .filter(node => node.name === 'item')
 *   .myNonTerminalMethod({ operation: 'augment', addMetadata: true })
 *   .map(node => ({ ...node, processed: true }))
 *   .toJson();
 * ```
 * 
 * @example Error Handling
 * ```typescript
 * try {
 *   const result = new XJX()
 *     .fromXml(xml)
 *     .myTerminalMethod({ format: 'invalid' }); // Will throw ValidationError
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.log('Invalid options:', error.message);
 *   } else {
 *     console.log('Processing error:', error.message);
 *   }
 * }
 * ```
 */