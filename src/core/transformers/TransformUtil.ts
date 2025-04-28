/**
 * Utilities for applying value transformations
 */
import { Configuration } from '../types/config-types';
import { TransformContext, TransformDirection } from './ValueTransformer';
import { DOMAdapter } from '../adapters/dom-adapter';

/**
 * Utility for applying value transformations
 */
export class TransformUtil {
  private config: Configuration;

  /**
   * Create a new TransformUtil
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }

  /**
   * Apply transforms to a value
   * @param value Value to transform
   * @param context Transformation context
   * @returns Transformed value
   */
  applyTransforms(value: any, context: TransformContext): any {
    // Skip transformation if no transformers are configured
    if (!this.config.valueTransforms || this.config.valueTransforms.length === 0) {
      return value;
    }

    // Apply each transformer in sequence
    let transformedValue = value;
    for (const transformer of this.config.valueTransforms) {
      transformedValue = transformer.process(transformedValue, context);
    }

    return transformedValue;
  }

  /**
   * Create a transform context
   * @param direction Direction of transformation
   * @param nodeName Name of the current node
   * @param nodeType DOM node type
   * @param options Additional context options
   * @returns Transform context
   */
  createContext(
    direction: TransformDirection,
    nodeName: string,
    nodeType: number,
    options: {
      path?: string;
      namespace?: string;
      prefix?: string;
      isAttribute?: boolean;
      attributeName?: string;
      parent?: TransformContext;
    } = {}
  ): TransformContext {
    return {
      direction,
      nodeName,
      nodeType,
      path: options.path || nodeName,
      namespace: options.namespace,
      prefix: options.prefix,
      isAttribute: options.isAttribute || false,
      attributeName: options.attributeName,
      parent: options.parent,
      config: this.config,
    };
  }

  /**
   * Get a user-friendly node type name for debugging
   * @param nodeType DOM node type
   * @returns String representation of node type
   */
  getNodeTypeName(nodeType: number): string {
    return DOMAdapter.getNodeTypeName(nodeType);
  }
}