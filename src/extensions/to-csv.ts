/**
 * CSV Extension for XJX - Updated for simplified extensible configuration design
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { NodeType } from '../core/dom';
import { ProcessingError } from '../core/error';
import { XNode } from '../core/xnode';
import { UnifiedConverter } from '../core/pipeline';
import { PipelineContext } from '../core/context';
import { traverseTree, TreeVisitor, TraversalContext } from '../core/functional';
import { OutputHooks } from "../core/hooks";
import { TerminalExtensionContext } from "../core/extension";

// ============================================================================
// CSV Configuration Interface & Module Augmentation
// ============================================================================

/**
 * CSV conversion options interface
 */
export interface CsvOptions {
  includeHeaders?: boolean;
  separator?: string;
  quote?: string;
  pathSeparator?: string;
  includeEmptyElements?: boolean;
}

/**
 * Extend Configuration interface via module augmentation
 * This allows CSV options to be configured via withConfig()
 */
declare module '../core/config' {
  interface Configuration {
    csv?: CsvOptions;
  }
}

/**
 * Default CSV configuration
 */
export const CSV_DEFAULT_CONFIG: Required<CsvOptions> = {
  includeHeaders: true,
  separator: ',',
  quote: '"',
  pathSeparator: '.',
  includeEmptyElements: true
};

// ============================================================================
// CSV Data Structures
// ============================================================================

/**
 * CSV row interface representing a single data point
 */
interface CsvRow {
  ancestorPath: string;
  leafNodeName: string;
  leafIndex: number | null;
  value: string | null;
  type: 'attribute' | 'text' | 'element' | 'cdata' | 'comment' | 'processing_instruction';
  namespace: string | null;
}

// ============================================================================
// Unified Converter - Simplified Input
// ============================================================================

/**
 * Unified XNode to CSV converter - Only uses configuration system for options
 */
export const xnodeToCsvConverter: UnifiedConverter<XNode, string> = {
  name: 'xnodeToCsv',
  inputType: 'XNode',
  outputType: 'string',
  
  validate(node: XNode, context: PipelineContext): void {
    context.validateInput(!!node, "XNode cannot be null or undefined");
    context.validateInput(typeof node.name === 'string', "XNode must have a valid name");
  },
  
  execute(node: XNode, context: PipelineContext): string {
    logger.debug('Starting XNode to CSV conversion', {
      nodeName: node.name,
      nodeType: node.type
    });

    try {
      // Get CSV options from configuration system only
      const config = context.config.get();
      const configCsvOptions = config.csv || {};
      
      // Merge: defaults < config (no user options override)
      const options: Required<CsvOptions> = {
        ...CSV_DEFAULT_CONFIG,
        ...configCsvOptions
      };
      
      logger.debug('Using CSV options from configuration', {
        separator: options.separator,
        includeHeaders: options.includeHeaders,
        pathSeparator: options.pathSeparator,
        includeEmptyElements: options.includeEmptyElements,
        fromConfig: Object.keys(configCsvOptions).length > 0
      });
      
      const rows: CsvRow[] = [];
      
      // Use unified tree traversal to collect CSV rows
      const visitor: TreeVisitor<void> = {
        visit: (currentNode, traversalContext) => {
          collectCsvRows(currentNode, traversalContext, rows, options);
        }
      };

      traverseTree(node, visitor, {
        order: 'pre',
        context
      });

      // Convert rows to CSV string
      const csvString = formatCsvRows(rows, options);
      
      logger.debug('Successfully converted XNode to CSV', {
        rowCount: rows.length,
        csvLength: csvString.length,
        hasHeaders: options.includeHeaders
      });
      
      return csvString;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert XNode to CSV: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  
  onError(error: Error, node: XNode, context: PipelineContext): string | null {
    logger.error('XNode to CSV conversion failed', { error, nodeName: node?.name });
    return null;
  }
};

// ============================================================================
// CSV Processing Functions
// ============================================================================

/**
 * Collect CSV rows from a node during traversal
 */
function collectCsvRows(
  node: XNode, 
  traversalContext: TraversalContext, 
  rows: CsvRow[], 
  options: Required<CsvOptions>
): void {
  const ancestorPath = buildAncestorPath(traversalContext, options.pathSeparator);
  const leafIndex = calculateLeafIndex(node, traversalContext);
  
  // Handle attributes first
  if (node.attributes) {
    for (const [attrName, attrValue] of Object.entries(node.attributes)) {
      rows.push({
        ancestorPath,
        leafNodeName: attrName,
        leafIndex,
        value: String(attrValue),
        type: 'attribute',
        namespace: extractNamespaceFromName(attrName)
      });
    }
  }
  
  // Handle the node itself based on type
  switch (node.type) {
    case NodeType.ELEMENT_NODE:
      handleElementNode(node, ancestorPath, leafIndex, rows, options);
      break;
      
    case NodeType.TEXT_NODE:
      if (node.value !== undefined && node.value !== null) {
        const parentPath = ancestorPath.split(options.pathSeparator).slice(0, -1).join(options.pathSeparator);
        rows.push({
          ancestorPath: parentPath || '',
          leafNodeName: node.name,
          leafIndex: null, // Text nodes don't have array indices
          value: String(node.value),
          type: 'text',
          namespace: node.namespace || null
        });
      }
      break;
      
    case NodeType.CDATA_SECTION_NODE:
      if (node.value !== undefined && node.value !== null) {
        const parentPath = ancestorPath.split(options.pathSeparator).slice(0, -1).join(options.pathSeparator);
        rows.push({
          ancestorPath: parentPath || '',
          leafNodeName: node.name,
          leafIndex: null,
          value: String(node.value),
          type: 'cdata',
          namespace: node.namespace || null
        });
      }
      break;
      
    case NodeType.COMMENT_NODE:
      if (node.value !== undefined && node.value !== null) {
        const parentPath = ancestorPath.split(options.pathSeparator).slice(0, -1).join(options.pathSeparator);
        rows.push({
          ancestorPath: parentPath || '',
          leafNodeName: node.name,
          leafIndex: null,
          value: String(node.value),
          type: 'comment',
          namespace: node.namespace || null
        });
      }
      break;
      
    case NodeType.PROCESSING_INSTRUCTION_NODE:
      if (node.value !== undefined && node.value !== null) {
        const parentPath = ancestorPath.split(options.pathSeparator).slice(0, -1).join(options.pathSeparator);
        rows.push({
          ancestorPath: parentPath || '',
          leafNodeName: node.attributes?.target || node.name,
          leafIndex: null,
          value: String(node.value),
          type: 'processing_instruction',
          namespace: node.namespace || null
        });
      }
      break;
  }
}

/**
 * Calculate the leaf index for a node
 * Returns the array index only if the node is actually part of an array (has siblings with same name)
 * Returns null for non-array elements
 */
function calculateLeafIndex(node: XNode, traversalContext: TraversalContext): number | null {
  // If this is the root node, no index
  if (traversalContext.path.length === 0) {
    return null;
  }
  
  // Find the root node by walking up
  let rootNode = traversalContext.parent;
  while (rootNode?.parent) {
    rootNode = rootNode.parent;
  }
  
  if (!rootNode) {
    return null;
  }
  
  // Walk down the path and check each level for ACTUAL array membership
  let currentNode = rootNode;
  let mostRecentArrayIndex: number | null = null;
  
  for (let i = 0; i < traversalContext.path.length; i++) {
    const childIndex = traversalContext.path[i];
    
    if (currentNode.children && childIndex < currentNode.children.length) {
      const child = currentNode.children[childIndex];
      
      // Check if this child is part of a TRUE array (multiple siblings with same name)
      if (child.type === NodeType.ELEMENT_NODE) {
        const siblings = currentNode.children.filter(c => 
          c.name === child.name && c.type === NodeType.ELEMENT_NODE
        );
        
        // Only assign array index if there are actually multiple siblings
        if (siblings.length > 1) {
          // This child is part of a real array - find its position among same-named siblings
          let arrayIndex = 0;
          for (let j = 0; j < currentNode.children.length; j++) {
            const sibling = currentNode.children[j];
            if (sibling.name === child.name && sibling.type === NodeType.ELEMENT_NODE) {
              if (j === childIndex) {
                break; // Found our position
              }
              arrayIndex++;
            }
          }
          mostRecentArrayIndex = arrayIndex;
        }
        // For single elements, don't assign an index - they're not arrays
      }
      
      currentNode = child;
    }
  }
  
  // Return the most specific array index, or null if not part of any array
  return mostRecentArrayIndex;
}

/**
 * Handle element nodes - check for direct value or empty state
 */
function handleElementNode(
  node: XNode, 
  ancestorPath: string, 
  leafIndex: number | null,
  rows: CsvRow[], 
  options: Required<CsvOptions>
): void {
  // Check if element has direct value (text content)
  if (node.value !== undefined && node.value !== null) {
    rows.push({
      ancestorPath,
      leafNodeName: node.name,
      leafIndex,
      value: String(node.value),
      type: 'text',
      namespace: node.namespace || null
    });
  }
  // Check if element is empty AND has attributes (meaningful empty element)
  else if ((!node.children || node.children.length === 0) && 
           node.attributes && Object.keys(node.attributes).length > 0 && 
           options.includeEmptyElements) {
    rows.push({
      ancestorPath,
      leafNodeName: node.name,
      leafIndex,
      value: null,
      type: 'element',
      namespace: node.namespace || null
    });
  }
  // Skip purely structural elements (no value, no attributes)
  // These are just containers and don't carry data for ETL purposes
}

/**
 * Build ancestor path from traversal context (without final array index)
 */
function buildAncestorPath(traversalContext: TraversalContext, pathSeparator: string): string {
  // The ancestor path should include everything from root to parent of current node
  // WITHOUT array indices - those go in the leaf_index column
  
  if (traversalContext.path.length === 0) {
    // We're at the root, so no ancestor path
    return '';
  }
  
  // Find the root node by walking up to the top
  let rootNode = traversalContext.parent;
  while (rootNode?.parent) {
    rootNode = rootNode.parent;
  }
  
  if (!rootNode) {
    return '';
  }
  
  const segments: string[] = [rootNode.name];
  let currentNode = rootNode;
  
  // Walk down using path indices, but stop before the last one (which is current node)
  for (let i = 0; i < traversalContext.path.length - 1; i++) {
    const childIndex = traversalContext.path[i];
    
    if (currentNode.children && childIndex < currentNode.children.length) {
      const child = currentNode.children[childIndex];
      
      // Always add the node name WITHOUT array indices
      // Array indices will be captured in the leaf_index column
      if (child.type === NodeType.ELEMENT_NODE) {
        segments.push(child.name);
      } else {
        segments.push(child.name);
      }
      
      currentNode = child;
    }
  }
  
  return segments.join(pathSeparator);
}

/**
 * Extract namespace from an attribute or element name (if prefixed)
 */
function extractNamespaceFromName(name: string): string | null {
  if (name.includes(':')) {
    const [prefix] = name.split(':');
    return prefix; // Return prefix as a simple namespace indicator
  }
  return null;
}

/**
 * Format CSV rows into final CSV string
 */
function formatCsvRows(rows: CsvRow[], options: Required<CsvOptions>): string {
  const lines: string[] = [];
  
  // Add headers if requested
  if (options.includeHeaders) {
    lines.push('ancestor_path,leaf_node_name,leaf_index,value,type,namespace');
  }
  
  // Add data rows
  for (const row of rows) {
    const fields = [
      escapeCsvField(row.ancestorPath, options),
      escapeCsvField(row.leafNodeName, options),
      row.leafIndex !== null ? String(row.leafIndex) : '',
      row.value === null ? '' : escapeCsvField(row.value, options),
      escapeCsvField(row.type, options),
      row.namespace === null ? '' : escapeCsvField(row.namespace, options)
    ];
    
    lines.push(fields.join(options.separator));
  }
  
  return lines.join('\n');
}

/**
 * Escape a field for CSV format
 */
function escapeCsvField(value: string, options: Required<CsvOptions>): string {
  if (value.includes(options.separator) || value.includes(options.quote) || value.includes('\n')) {
    // Escape quotes by doubling them and wrap in quotes
    const escaped = value.replace(new RegExp(options.quote, 'g'), options.quote + options.quote);
    return options.quote + escaped + options.quote;
  }
  return value;
}

// ============================================================================
// Extension Method Implementation
// ============================================================================

/**
 * Implementation for converting to CSV using configuration system only
 * NO user options parameter - all configuration through withConfig()
 */
export function toCsv(this: TerminalExtensionContext, hooks?: OutputHooks<string>): string {
  try {
    this.validateSource();
    
    logger.debug('Starting CSV conversion using configuration system');
    
    // Use unified pipeline execution - converter gets options from config automatically
    const result = this.executeOutput(xnodeToCsvConverter, hooks);
    
    logger.debug('Successfully converted to CSV using configuration system', {
      csvLength: result.length
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to CSV: ${String(err)}`);
  }
}

// ============================================================================
// Extension Registration
// ============================================================================

// Register the extension with XJX including default configuration
XJX.registerTerminalExtension("toCsv", toCsv, {
  csv: CSV_DEFAULT_CONFIG
});