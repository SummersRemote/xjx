/**
 * Source extensions for semantic XNode system
 * Direct configuration property access - ConfigurationHelper removed
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { XNode, XNodeType, createCollection, addChild } from "../core/xnode";
import { xmlToXNodeConverter } from "../converters/xml-to-xnode-converter";
import { 
  jsonToXNodeConverter,
  jsonHiFiToXNodeConverter 
} from "../converters/json-to-xnode-converter";
import { NonTerminalExtensionContext } from "../core/extension";
import { SourceHooks } from "../core/hooks";
import { ClonePolicies } from "../core/context";

/**
 * fromXml extension using semantic XNode converter
 * Direct configuration property access
 */
export function fromXml(
  this: NonTerminalExtensionContext, 
  xml: string,
  hooks?: SourceHooks<string>
): void {
  try {
    logger.debug('Setting XML source with semantic XNode converter', {
      sourceLength: xml.length,
      hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Use unified pipeline with semantic XML converter
    this.executeSource(xmlToXNodeConverter, xml, hooks);
    
    logger.debug('Successfully set XML source', {
      rootNodeName: this.xnode?.name,
      rootNodeType: this.xnode?.type
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to parse XML source: ${String(err)}`);
  }
}

/**
 * fromJson extension using semantic XNode converter
 * Direct configuration property access instead of ConfigurationHelper
 */
export function fromJson(
  this: NonTerminalExtensionContext, 
  json: any,
  hooks?: SourceHooks<any>
): void {
  try {
    // Direct configuration property access instead of helper
    const config = this.pipeline.config.get();
    const useHighFidelity = config.highFidelity;
    
    logger.debug('Setting JSON source with semantic XNode converter', {
      sourceType: Array.isArray(json) ? 'array' : typeof json,
      highFidelity: useHighFidelity,
      hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Choose converter based on direct configuration access
    const converter = useHighFidelity ? jsonHiFiToXNodeConverter : jsonToXNodeConverter;
    this.executeSource(converter, json, hooks);
    
    logger.debug('Successfully set JSON source', {
      rootNodeName: this.xnode?.name,
      rootNodeType: this.xnode?.type,
      usedHighFidelity: useHighFidelity
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to parse JSON source: ${String(err)}`);
  }
}

/**
 * fromXnode extension for semantic XNode arrays
 * Uses semantic createCollection instead of createElement
 */
export function fromXnode(
  this: NonTerminalExtensionContext, 
  input: XNode | XNode[],
  hooks?: SourceHooks<XNode | XNode[]>
): void {
  try {
    // API boundary validation using pipeline context
    this.pipeline.validateInput(input !== null && input !== undefined, "XNode input cannot be null or undefined");
    
    let processedInput = input;
    
    // Apply beforeTransform hook to raw input
    if (hooks?.beforeTransform) {
      try {
        const beforeResult = hooks.beforeTransform(processedInput);
        if (beforeResult !== undefined && beforeResult !== null) {
          processedInput = beforeResult;
        }
      } catch (err) {
        logger.warn(`Error in XNode source beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    // Handle both single XNode and XNode array cases
    let resultXNode: XNode;
    
    if (Array.isArray(processedInput)) {
      this.pipeline.validateInput(processedInput.length > 0, "XNode array cannot be empty");
      
      logger.debug('Setting XNode array source for transformation', {
        nodeCount: processedInput.length,
        hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
      });
      
      // Create a collection to contain all nodes (semantic approach)
      resultXNode = createCollection('xnodes');
      
      // Add each input node as a child (clone to avoid mutation)
      processedInput.forEach((node, index) => {
        this.pipeline.validateInput(
          node && typeof node === 'object' && typeof node.name === 'string' && 
          Object.values(XNodeType).includes(node.type),
          `XNode at index ${index} must be a valid semantic XNode object`
        );
        
        // Clone the node using standardized pipeline cloning
        const clonedNode = this.pipeline.cloneNode(node, ClonePolicies.BRANCH);
        addChild(resultXNode, clonedNode);
      });
      
      logger.debug('Successfully processed XNode array source', {
        nodeCount: processedInput.length,
        wrapperName: resultXNode.name,
        wrapperType: resultXNode.type
      });
    } else {
      // Single XNode case
      this.pipeline.validateInput(
        processedInput && typeof processedInput === 'object' && 
        typeof processedInput.name === 'string' &&
        Object.values(XNodeType).includes(processedInput.type),
        "XNode input must be a valid semantic XNode object"
      );
      
      logger.debug('Setting single XNode source for transformation', {
        nodeName: processedInput.name,
        nodeType: processedInput.type,
        hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
      });
      
      // Clone the node using standardized pipeline cloning
      resultXNode = this.pipeline.cloneNode(processedInput, ClonePolicies.BRANCH);
      
      logger.debug('Successfully processed single XNode source', {
        rootNodeName: resultXNode.name,
        rootNodeType: resultXNode.type
      });
    }
    
    // Apply afterTransform hook to fully populated XNode
    if (hooks?.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(resultXNode);
        if (afterResult && typeof afterResult === 'object' && 
            typeof afterResult.name === 'string' && 
            Object.values(XNodeType).includes(afterResult.type)) {
          resultXNode = afterResult;
        }
      } catch (err) {
        logger.warn(`Error in XNode source afterTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    this.xnode = resultXNode;
    
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to set XNode source: ${String(err)}`);
  }
}

// Register extensions with XJX using semantic configuration defaults
XJX.registerNonTerminalExtension("fromXml", fromXml, {
  xml: {
    preserveNamespaces: true,
    preserveCDATA: true,
    preserveMixedContent: true,
    preserveTextNodes: true,
    preserveAttributes: true,
    preservePrefixedNames: true,
    attributeHandling: 'attributes',
    namespacePrefixHandling: 'preserve',
    prettyPrint: true,
    declaration: true,
    encoding: 'UTF-8'
  }
});

XJX.registerNonTerminalExtension("fromJson", fromJson, {
  json: {
    arrayItemNames: {},
    defaultItemName: "item",
    fieldVsValue: 'auto',
    emptyValueHandling: 'null',
    prettyPrint: true
  }
});

XJX.registerNonTerminalExtension("fromXnode", fromXnode);