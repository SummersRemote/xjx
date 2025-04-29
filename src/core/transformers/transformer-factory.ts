/**
 * Transformer Factory Functions
 * 
 * Provides convenient factory functions to create common transformers
 */
import { BooleanTransformer, BooleanTransformerOptions } from './boolean-transformer';
import { NumberTransformer, NumberTransformerOptions } from './number-transformer';
import { CaseTransformer, CaseTransformerOptions, CaseConvention } from './case-transformer';
import { AttributeFilterTransformer, NodeFilterTransformer } from './filter-transformer';
import { GroupTransformer, GroupTransformerOptions } from './group-transformer';
import { XNode, TransformContext, ValueTransformer } from '../types/transform-types';

/**
 * Create a boolean transformer that converts string values to boolean types
 * @param options Configuration options
 * @returns A BooleanTransformer instance
 */
export function createBooleanTransformer(options: BooleanTransformerOptions = {}): BooleanTransformer {
  return new BooleanTransformer(options);
}

/**
 * Create a number transformer that converts string values to numeric types
 * @param options Configuration options
 * @returns A NumberTransformer instance
 */
export function createNumberTransformer(options: NumberTransformerOptions = {}): NumberTransformer {
  return new NumberTransformer(options);
}

/**
 * Create a transformer that converts attribute names between camelCase and kebab-case
 * @param options Configuration options
 * @returns A CaseTransformer instance
 */
export function createCaseTransformer(options: CaseTransformerOptions): CaseTransformer {
  return new CaseTransformer(options);
}

/**
 * Create a common camelCase/kebab-case transformer
 * @param paths Optional paths to restrict the transformer to
 * @returns A CaseTransformer for camelCase/kebab-case conversion
 */
export function createCamelKebabTransformer(paths?: string | string[]): CaseTransformer {
  return new CaseTransformer({
    xmlToJsonCase: CaseConvention.CAMEL, // kebab-case in XML to camelCase in JSON
    jsonToXmlCase: CaseConvention.KEBAB, // camelCase in JSON to kebab-case in XML
    paths
  });
}

/**
 * Create an attribute filter transformer
 * @param predicate Function to determine if an attribute should be kept
 * @param paths Optional paths to restrict the transformer to
 * @returns An AttributeFilterTransformer instance
 */
export function createAttributeFilter(
  predicate: (name: string, value: any, node: XNode, context: TransformContext) => boolean,
  paths?: string | string[]
): AttributeFilterTransformer {
  return new AttributeFilterTransformer({
    predicate,
    paths
  });
}

/**
 * Create a node filter transformer
 * @param predicate Function to determine if a node should be kept
 * @param paths Optional paths to restrict the transformer to
 * @returns A NodeFilterTransformer instance
 */
export function createNodeFilter(
  predicate: (node: XNode, context: TransformContext) => boolean,
  paths?: string | string[]
): NodeFilterTransformer {
  return new NodeFilterTransformer({
    predicate,
    paths
  });
}

/**
 * Create a group transformer
 * @param options Configuration options
 * @returns A GroupTransformer instance
 */
export function createGroupTransformer(options: GroupTransformerOptions): GroupTransformer {
  return new GroupTransformer(options);
}

/**
 * Create a simple group transformer that groups specific node types
 * @param groupName Name of the group node to create
 * @param nodeNames Names of nodes to group
 * @param paths Optional paths to restrict the transformer to
 * @param direction Direction to apply grouping in
 * @returns A GroupTransformer instance
 */
export function createSimpleGroupTransformer(
  groupName: string,
  nodeNames: string[],
  paths?: string | string[],
  direction: 'xml-to-json' | 'json-to-xml' | 'both' = 'xml-to-json'
): GroupTransformer {
  return new GroupTransformer({
    groups: [
      {
        name: groupName,
        selector: (child) => nodeNames.includes(child.name)
      }
    ],
    paths,
    direction
  });
}

/**
 * Create a simple value transformer from a function
 * @param transformFn Function to transform values
 * @param paths Optional paths to restrict the transformer to
 * @returns A ValueTransformer instance
 */
export function createValueTransformer(
  transformFn: (value: any, node: XNode, context: TransformContext) => any,
  paths?: string | string[]
): ValueTransformer {
  return {
    transform(value: any, node: XNode, context: TransformContext): any {
      // Skip if paths don't match
      if (paths) {
        const transformUtil = new (require('../utils/transform-utils').TransformUtil)(context.config);
        const pathMatcher = transformUtil.createPathMatcher(paths);
        
        if (!pathMatcher(context.path)) {
          return value;
        }
      }
      
      // Apply transformation
      return transformFn(value, node, context);
    }
  };
}

// Export everything
export {
  BooleanTransformer,
  NumberTransformer,
  AttributeFilterTransformer,
  NodeFilterTransformer,
};