/**
 * Output extensions for semantic XNode system
 * Direct configuration property access - ConfigurationHelper removed
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { XNode } from "../core/xnode";
import { 
  xnodeToXmlConverter,
  xnodeToXmlStringConverter 
} from "../converters/xnode-to-xml-converter";
import { 
  xnodeToJsonConverter,
  xnodeToJsonHiFiConverter 
} from "../converters/xnode-to-json-converter";
import { OutputHooks } from "../core/hooks";
import { TerminalExtensionContext } from "../core/extension";
import { ClonePolicies } from "../core/context";

/**
 * toXml extension using semantic XNode to XML converter
 * Direct configuration property access
 */
export function toXml(this: TerminalExtensionContext, hooks?: OutputHooks<Document>): Document {
  try {
    logger.debug('Converting semantic XNode to XML DOM', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Use unified pipeline with semantic XML converter
    const result = this.executeOutput(xnodeToXmlConverter, hooks);
    
    logger.debug('Successfully converted semantic XNode to DOM', {
      documentElement: result.documentElement?.nodeName
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XML: ${String(err)}`);
  }
}

/**
 * toXmlString extension using semantic XNode to XML string converter
 * Direct configuration property access
 */
export function toXmlString(this: TerminalExtensionContext, hooks?: OutputHooks<string>): string {
  try {
    logger.debug('Converting semantic XNode to XML string', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Use unified pipeline with semantic XML string converter
    const result = this.executeOutput(xnodeToXmlStringConverter, hooks);
    
    logger.debug('Successfully converted to XML string', {
      xmlLength: result.length
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XML string: ${String(err)}`);
  }
}

/**
 * toJson extension using semantic XNode to JSON converter
 * Direct configuration property access instead of ConfigurationHelper
 */
export function toJson(this: TerminalExtensionContext, hooks?: OutputHooks<any>): any {
  try {
    // Direct configuration property access instead of helper
    const config = this.pipeline.config.get();
    const useHighFidelity = config.highFidelity;
    
    logger.debug('Converting semantic XNode to JSON', {
      highFidelity: useHighFidelity,
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Choose converter based on direct configuration access
    const converter = useHighFidelity ? xnodeToJsonHiFiConverter : xnodeToJsonConverter;
    const result = this.executeOutput(converter, hooks);
    
    logger.debug('Successfully converted semantic XNode to JSON', {
      resultType: typeof result,
      isArray: Array.isArray(result),
      usedHighFidelity: useHighFidelity
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to JSON: ${String(err)}`);
  }
}

/**
 * toJsonString extension using semantic XNode to JSON converter
 * Direct configuration property access instead of ConfigurationHelper
 */
export function toJsonString(this: TerminalExtensionContext, hooks?: OutputHooks<string>): string {
  try {
    // Direct configuration property access instead of helper
    const config = this.pipeline.config.get();
    const useHighFidelity = config.highFidelity;
    
    logger.debug('Converting semantic XNode to JSON string', {
      highFidelity: useHighFidelity,
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Source validation handled by validateSource()
    this.validateSource();
    
    // Start with current XNode
    let nodeToConvert = this.xnode as XNode;
    
    // Apply beforeTransform hook to XNode (if hooks are provided)
    if (hooks?.beforeTransform) {
      try {
        const beforeResult = hooks.beforeTransform(nodeToConvert);
        if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
          nodeToConvert = beforeResult;
        }
      } catch (err) {
        logger.warn(`Error in JSON string beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    // Get JSON value using the converter directly (no hooks for intermediate step)
    const converter = useHighFidelity ? xnodeToJsonHiFiConverter : xnodeToJsonConverter;
    const jsonValue = this.executeOutput(converter); // No hooks passed here
    
    // Use direct configuration property access for formatting
    let result = JSON.stringify(jsonValue, null, config.formatting.indent);
    
    // Apply afterTransform hook to final string result
    if (hooks?.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(result);
        if (afterResult !== undefined && afterResult !== null) {
          result = afterResult;
        }
      } catch (err) {
        logger.warn(`Error in JSON string afterTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    logger.debug('Successfully converted to JSON string', {
      jsonLength: result.length,
      usedHighFidelity: useHighFidelity
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to JSON string: ${String(err)}`);
  }
}

/**
 * toJsonHiFi extension using semantic high-fidelity converter
 * Direct high-fidelity converter usage
 */
export function toJsonHiFi(this: TerminalExtensionContext, hooks?: OutputHooks<any>): any {
  try {
    logger.debug('Converting semantic XNode to high-fidelity JSON', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Always use high-fidelity converter regardless of base config
    const result = this.executeOutput(xnodeToJsonHiFiConverter, hooks);
    
    logger.debug('Successfully converted semantic XNode to high-fidelity JSON', {
      resultType: typeof result
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to high-fidelity JSON: ${String(err)}`);
  }
}

/**
 * toXnode extension for semantic XNode arrays
 * Direct configuration property access
 */
export function toXnode(this: TerminalExtensionContext, hooks?: OutputHooks<XNode[]>): XNode[] {
  try {
    // Source validation handled by validateSource()
    this.validateSource();
    
    logger.debug('Converting to semantic XNode array', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Start with current XNode
    let nodeToConvert = this.xnode as XNode;
    
    // Apply output hooks using pipeline context
    let processedXNode = nodeToConvert;
    
    // Apply beforeTransform hook to XNode
    if (hooks?.beforeTransform) {
      try {
        const beforeResult = hooks.beforeTransform(processedXNode);
        if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
          processedXNode = beforeResult;
        }
      } catch (err) {
        logger.warn(`Error in XNode output beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    // Clone the node using standardized pipeline cloning for output
    const clonedNode = this.pipeline.cloneNode(processedXNode, ClonePolicies.OUTPUT);
    
    // Always return an array - this enables consistent query processing
    let result = [clonedNode];
    
    // Apply afterTransform hook to final array
    if (hooks?.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(result);
        if (afterResult !== undefined && afterResult !== null) {
          result = afterResult;
        }
      } catch (err) {
        logger.warn(`Error in XNode output afterTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    logger.debug('Successfully converted to semantic XNode array', {
      nodeCount: result.length,
      rootNodeName: result[0]?.name,
      rootNodeType: result[0]?.type
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XNode array: ${String(err)}`);
  }
}

// Register the extensions with XJX
XJX.registerTerminalExtension("toXml", toXml);
XJX.registerTerminalExtension("toXmlString", toXmlString);
XJX.registerTerminalExtension("toJson", toJson);
XJX.registerTerminalExtension("toJsonString", toJsonString);
XJX.registerTerminalExtension("toJsonHiFi", toJsonHiFi);
XJX.registerTerminalExtension("toXnode", toXnode);