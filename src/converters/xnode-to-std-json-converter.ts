/**
 * standard-json-converter.ts
 * 
 * Implements conversion from XNode to standard JavaScript objects and arrays.
 * This converter sacrifices round-trip fidelity for a more natural object structure.
 */
import { Converter } from './converter-interfaces';
import { Config, Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, validate, handleError, ErrorType } from '../core/error';
import { XNode } from '../core/xnode';

/**
 * XNode to Standard JSON converter interface
 */
export interface XNodeToStandardJsonConverter extends Converter<XNode, any> {}

/**
 * Converts XNode to standard JavaScript objects and arrays
 */
export class DefaultXNodeToStandardJsonConverter implements XNodeToStandardJsonConverter {
  private config: Configuration;

  /**
   * Create a new converter
   * @param config Configuration with standardJsonDefaults
   */
  constructor(config: Configuration) {
    // Initialize properties first to satisfy TypeScript
    this.config = config;
    
    try {
      // Then validate and potentially update
      if (!Config.isValid(config)) {
        this.config = Config.createOrUpdate({}, config);
      }
      
      // Access config properties to avoid unused variable warning
      logger.debug('StandardJsonToXNodeConverter initialized', { 
        hasStandardJsonDefaults: !!this.config.standardJsonDefaults 
      });
    } catch (err) {
      // If validation/update fails, use default config
      this.config = Config.getDefault();
      handleError(err, "initialize XNode to Standard JSON converter", {
        errorType: ErrorType.CONFIGURATION
      });
    }
  }

  /**
   * Convert XNode to standard JavaScript object/array
   * @param node XNode to convert
   * @returns Standard JavaScript object or primitive
   */
  public convert(node: XNode): any {
    try {
      validate(node instanceof XNode, "Node must be an XNode instance");
      
      logger.debug('Starting XNode to standard JSON conversion', {
        nodeName: node.name,
        nodeType: node.type
      });
      
      const result = this.processNode(node);
      
      logger.debug('Successfully converted XNode to standard JSON', {
        resultType: typeof result,
        isArray: Array.isArray(result)
      });
      
      return result;
    } catch (err) {
      return handleError(err, 'convert XNode to standard JSON', {
        data: { nodeName: node?.name, nodeType: node?.type },
        errorType: ErrorType.SERIALIZE
      });
    }
  }
  
  /**
   * Process a node based on its type
   * @param node XNode to process
   * @returns Standard JavaScript value
   * @private
   */
  private processNode(node: XNode): any {
    try {
      switch (node.type) {
        case NodeType.ELEMENT_NODE:
          return this.processElementNode(node);
          
        case NodeType.TEXT_NODE:
          return node.value;
          
        case NodeType.CDATA_SECTION_NODE:
          return node.value;
          
        case NodeType.COMMENT_NODE:
          // Comments are discarded in standard JSON output
          return undefined;
          
        case NodeType.PROCESSING_INSTRUCTION_NODE:
          // Processing instructions are discarded in standard JSON output
          return undefined;
          
        default:
          logger.warn('Unknown node type during conversion', {
            nodeName: node.name,
            nodeType: node.type
          });
          return undefined;
      }
    } catch (err) {
      return handleError(err, 'process node', {
        data: { nodeName: node?.name, nodeType: node?.type },
        fallback: null
      });
    }
  }
  
  /**
   * Process an element node
   * @param node Element node to process
   * @returns JavaScript object, array, or primitive
   * @private
   */
  private processElementNode(node: XNode): any {
    try {
      // Get standard JSON options with defaults
      const options = this.getStandardJsonOptions();
      
      // Handle special cases
      if (!node.children || node.children.length === 0) {
        // Element with no children but with a value
        if (node.value !== undefined) {
          return this.processElementWithValue(node, options);
        }
        
        // Empty element
        return options.emptyElementsAsNull ? null : {};
      }
      
      // Check if this is a text-only node
      const textOnlyChildren = node.children.filter(
        child => child.type === NodeType.TEXT_NODE || child.type === NodeType.CDATA_SECTION_NODE
      );
      
      if (textOnlyChildren.length === node.children.length) {
        // All children are text/CDATA nodes, combine them
        const combinedText = textOnlyChildren
          .map(child => child.value || '')
          .join('');
          
        if (combinedText.trim() === '' && options.emptyElementsAsNull) {
          return null;
        }
        
        return this.processElementWithValue(node, options, combinedText);
      }
      
      // Element with element children
      return this.processElementWithChildren(node, options);
    } catch (err) {
      return handleError(err, 'process element node', {
        data: { nodeName: node?.name, nodeType: node?.type },
        fallback: {}
      });
    }
  }
  
  /**
   * Process an element with only a value
   * @param node Element node
   * @param options Standard JSON options
   * @param textValue Optional explicit text value
   * @returns JavaScript value
   * @private
   */
  private processElementWithValue(node: XNode, options: any, textValue?: string): any {
    try {
      const value = textValue !== undefined ? textValue : node.value;
      const hasAttributes = node.attributes && Object.keys(node.attributes).length > 0;
      
      // Simple case - no attributes
      if (!hasAttributes || options.attributeHandling === 'ignore') {
        return value;
      }
      
      // Complex case - has attributes
      const textProperty = options.textPropertyName || '_text';
      
      switch (options.attributeHandling) {
        case 'merge':
          // Create object with attributes and value
          const result: Record<string, any> = { ...this.processAttributes(node, options) };
          result[textProperty] = value;
          return result;
          
        case 'prefix':
          // Create object with prefixed attributes and direct value
          return { 
            ...this.processAttributes(node, options), 
            [textProperty]: value 
          };
          
        case 'property':
          // Create object with attributes property and direct value
          const attrProperty = options.attributePropertyName || '_attrs';
          return {
            [attrProperty]: this.processAttributes(node, options),
            [textProperty]: value
          };
          
        default:
          return value;
      }
    } catch (err) {
      return handleError(err, 'process element with value', {
        data: { nodeName: node?.name, value: node?.value },
        fallback: node.value
      });
    }
  }
  
  /**
   * Process element with child elements
   * @param node Element node with children
   * @param options Standard JSON options
   * @returns JavaScript object
   * @private
   */
  private processElementWithChildren(node: XNode, options: any): any {
    try {
      const result: Record<string, any> = {};
      
      // Add attributes if needed
      if (node.attributes && Object.keys(node.attributes).length > 0) {
        const attrProperty = options.attributePropertyName || '_attrs';
        
        switch (options.attributeHandling) {
          case 'merge':
            Object.assign(result, this.processAttributes(node, options));
            break;
            
          case 'prefix':
            Object.assign(result, this.processAttributes(node, options));
            break;
            
          case 'property':
            result[attrProperty] = this.processAttributes(node, options);
            break;
        }
      }
      
      // Track text content for mixed content handling
      let textContent = '';
      let hasMixedContent = false;
      
      // Group children by name for array detection
      const childrenByName: Record<string, XNode[]> = {};
      
      // Process each child
      if (node.children) {
        node.children.forEach(child => {
          if (child.type === NodeType.TEXT_NODE || child.type === NodeType.CDATA_SECTION_NODE) {
            // Collect text content
            const text = child.value || '';
            if (text.trim() !== '') {
              textContent += text;
              hasMixedContent = true;
            }
          } else if (child.type === NodeType.ELEMENT_NODE) {
            // Group element children by name
            if (!childrenByName[child.name]) {
              childrenByName[child.name] = [];
            }
            childrenByName[child.name].push(child);
          }
          // Ignore comments and processing instructions
        });
      }
      
      // Add mixed content if present and configured to preserve
      if (hasMixedContent && options.preserveMixedContent) {
        const textProperty = options.textPropertyName || '_text';
        result[textProperty] = textContent;
      }
      
      // Process grouped children
      Object.entries(childrenByName).forEach(([name, children]) => {
        const shouldBeArray = options.alwaysCreateArrays || children.length > 1;
        
        if (shouldBeArray) {
          // Process as array
          result[name] = children.map(child => this.processNode(child));
        } else {
          // Process as single value
          result[name] = this.processNode(children[0]);
        }
      });
      
      return result;
    } catch (err) {
      return handleError(err, 'process element with children', {
        data: { nodeName: node?.name, childCount: node?.children?.length },
        fallback: {}
      });
    }
  }
  
  /**
   * Process element attributes based on configuration
   * @param node Element node with attributes
   * @param options Standard JSON options
   * @returns Object with processed attributes
   * @private
   */
  private processAttributes(node: XNode, options: any): Record<string, any> {
    try {
      const result: Record<string, any> = {};
      
      if (!node.attributes) {
        return result;
      }
      
      const attrPrefix = options.attributePrefix || '@';
      
      Object.entries(node.attributes).forEach(([name, value]) => {
        // Apply attribute handling based on configuration
        switch (options.attributeHandling) {
          case 'prefix':
            // Add prefix to attribute names
            result[attrPrefix + name] = value;
            break;
            
          default:
            // Default to direct property
            result[name] = value;
            break;
        }
      });
      
      return result;
    } catch (err) {
      return handleError(err, 'process attributes', {
        data: { nodeName: node?.name, attributeCount: Object.keys(node?.attributes || {}).length },
        fallback: {}
      });
    }
  }
  
  /**
   * Get standard JSON options with defaults
   * @returns StandardJSON options with all defaults applied
   * @private
   */
  private getStandardJsonOptions(): Record<string, any> {
    // Default options
    const defaultOptions = {
      attributeHandling: 'ignore',
      attributePrefix: '@',
      attributePropertyName: '_attrs',
      textPropertyName: '_text',
      alwaysCreateArrays: false,
      preserveMixedContent: true,
      emptyElementsAsNull: false
    };
    
    // Get options from config
    const configOptions = this.config.standardJsonDefaults || {};
    
    // Merge defaults with config options
    return { ...defaultOptions, ...configOptions };
  }
}