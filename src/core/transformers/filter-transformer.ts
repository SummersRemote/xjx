/**
 * Filter transformer implementation
 *
 * Filters nodes based on custom predicates or simple value comparisons
 */
import { BaseNodeTransformer } from "./transformer-base";
import { XNode, TransformContext } from "../types/transform-types";

/**
 * Type for predicate function
 */
export type FilterPredicate = (
  node: XNode,
  context: TransformContext
) => boolean;

/**
 * Filter operation for simple value comparison
 */
export enum FilterOp {
  EQUALS = "eq",
  NOT_EQUALS = "ne",
  GREATER_THAN = "gt",
  GREATER_THAN_OR_EQUALS = "gte",
  LESS_THAN = "lt",
  LESS_THAN_OR_EQUALS = "lte",
  CONTAINS = "contains",
  STARTS_WITH = "startsWith",
  ENDS_WITH = "endsWith",
  MATCHES = "matches", // RegExp match
  EXISTS = "exists", // Property exists
  NOT_EXISTS = "notExists", // Property doesn't exist
}

/**
 * Simple filter condition
 */
export interface FilterCondition {
  /**
   * Property path to check (relative to the current node)
   * e.g., "value", "attributes.id", etc.
   */
  property: string;

  /**
   * Operation to perform
   */
  op: FilterOp;

  /**
   * Value to compare against (not needed for EXISTS/NOT_EXISTS)
   */
  value?: any;

  /**
   * Whether to ignore case for string comparisons (default: false)
   */
  ignoreCase?: boolean;
}

/**
 * Options for filter transformer
 */
export interface FilterTransformerOptions {
  /**
   * Paths to apply this transformer to
   * Uses path matching syntax (e.g., "root.items.*")
   */
  paths?: string | string[];

  /**
   * Custom predicate function to determine if a node should be kept
   * Return true to keep the node, false to remove it
   */
  predicate?: FilterPredicate;

  /**
   * List of conditions to check
   * All conditions must pass for the node to be kept (AND logic)
   */
  conditions?: FilterCondition[];

  /**
   * Whether to include matching nodes (default: true)
   * If false, matching nodes will be excluded (inverts the filter)
   */
  include?: boolean;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Partial<FilterTransformerOptions> = {
  include: true,
};

/**
 * Filter transformer for removing nodes based on conditions
 *
 * Example usage:
 * ```
 * // Filter out empty items
 * const nonEmptyFilter = new FilterTransformer({
 *   paths: ['root.items.*'],
 *   conditions: [
 *     { property: 'value', op: FilterOp.EXISTS }
 *   ]
 * });
 *
 * // Filter with custom predicate
 * const customFilter = new FilterTransformer({
 *   paths: ['root.items.*'],
 *   predicate: (node, context) => {
 *     // Keep only nodes where name starts with 'a'
 *     return node.name.startsWith('a');
 *   }
 * });
 *
 * xjx.transform(TransformDirection.XML_TO_JSON, nonEmptyFilter);
 * ```
 */
export class FilterTransformer extends BaseNodeTransformer {
  private options: FilterTransformerOptions;

  /**
   * Create a new filter transformer
   * @param options Filter options
   */
  constructor(options: FilterTransformerOptions) {
    super(options.paths);
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Validate options
    if (
      !this.options.predicate &&
      (!this.options.conditions || this.options.conditions.length === 0)
    ) {
      throw new Error(
        "FilterTransformer requires either a predicate function or conditions"
      );
    }
  }

  /**
   * Transform a node by filtering it
   * @param node Node to transform
   * @param context Transformation context
   * @returns The node if it passes the filter, null otherwise
   */
  protected transformNode(node: XNode, context: TransformContext): XNode {
    let matches = false;

    // Use predicate if provided
    if (this.options.predicate) {
      matches = this.options.predicate(node, context);
    }
    // Otherwise use conditions
    else if (this.options.conditions && this.options.conditions.length > 0) {
      matches = this.checkConditions(node, context, this.options.conditions);
    }

    // Invert result if include is false
    if (!this.options.include) {
      matches = !matches;
    }

    // Return node if it matches, we can't return null directly as the base class expects XNode
    // Instead, the caller will need to check if the node should be removed
    if (!matches) {
      // Set a special property to indicate this node should be removed
      // We'll handle this in the XJX.applyTransformers method
      (node as any)._remove = true;
    }

    return node;
  }

  /**
   * Check if a node passes all conditions
   * @param node Node to check
   * @param context Transformation context
   * @param conditions Conditions to check
   * @returns Whether all conditions pass
   */
  private checkConditions(
    node: XNode,
    context: TransformContext,
    conditions: FilterCondition[]
  ): boolean {
    // All conditions must pass (AND logic)
    return conditions.every((condition) =>
      this.checkCondition(node, context, condition)
    );
  }

  /**
   * Check if a node passes a single condition
   * @param node Node to check
   * @param context Transformation context
   * @param condition Condition to check
   * @returns Whether the condition passes
   */
  private checkCondition(
    node: XNode,
    context: TransformContext,
    condition: FilterCondition
  ): boolean {
    // Get property value from node using path
    const propertyValue = this.getPropertyValue(node, condition.property);

    // Handle different operations
    switch (condition.op) {
      case FilterOp.EXISTS:
        return propertyValue !== undefined;

      case FilterOp.NOT_EXISTS:
        return propertyValue === undefined;

      case FilterOp.EQUALS:
        return this.compare(
          propertyValue,
          condition.value,
          (a, b) => a === b,
          condition.ignoreCase
        );

      case FilterOp.NOT_EQUALS:
        return this.compare(
          propertyValue,
          condition.value,
          (a, b) => a !== b,
          condition.ignoreCase
        );

      case FilterOp.GREATER_THAN:
        return this.compare(
          propertyValue,
          condition.value,
          (a, b) => a > b,
          condition.ignoreCase
        );

      case FilterOp.GREATER_THAN_OR_EQUALS:
        return this.compare(
          propertyValue,
          condition.value,
          (a, b) => a >= b,
          condition.ignoreCase
        );

      case FilterOp.LESS_THAN:
        return this.compare(
          propertyValue,
          condition.value,
          (a, b) => a < b,
          condition.ignoreCase
        );

      case FilterOp.LESS_THAN_OR_EQUALS:
        return this.compare(
          propertyValue,
          condition.value,
          (a, b) => a <= b,
          condition.ignoreCase
        );

      case FilterOp.CONTAINS:
        return this.stringCompare(
          propertyValue,
          condition.value,
          (a, b) => a.includes(b),
          condition.ignoreCase
        );

      case FilterOp.STARTS_WITH:
        return this.stringCompare(
          propertyValue,
          condition.value,
          (a, b) => a.startsWith(b),
          condition.ignoreCase
        );

      case FilterOp.ENDS_WITH:
        return this.stringCompare(
          propertyValue,
          condition.value,
          (a, b) => a.endsWith(b),
          condition.ignoreCase
        );

      case FilterOp.MATCHES:
        if (typeof propertyValue !== "string") {
          return false;
        }

        // Create regex from value if it's a string
        const regex =
          condition.value instanceof RegExp
            ? condition.value
            : new RegExp(condition.value, condition.ignoreCase ? "i" : "");

        return regex.test(propertyValue);

      default:
        return false;
    }
  }

  /**
   * Get a property value from a node using a path
   * @param node Node to get property from
   * @param property Property path (e.g., "value", "attributes.id")
   * @returns Property value or undefined if not found
   */
  private getPropertyValue(node: XNode, property: string): any {
    // Handle special root properties
    if (property === "name") return node.name;
    if (property === "type") return node.type;
    if (property === "value") return node.value;
    if (property === "namespace") return node.namespace;
    if (property === "prefix") return node.prefix;

    // Handle attributes
    if (property.startsWith("attributes.")) {
      const attrName = property.substring("attributes.".length);
      return node.attributes?.[attrName];
    }

    // Handle children count
    if (property === "children.length") {
      return node.children?.length;
    }

    // For more complex paths, we would need a more robust implementation
    // This is a simplified version
    return undefined;
  }

  /**
   * Compare two values with an operation
   * @param a First value
   * @param b Second value
   * @param op Operation function
   * @param ignoreCase Whether to ignore case for strings
   * @returns Comparison result
   */
  private compare(
    a: any,
    b: any,
    op: (a: any, b: any) => boolean,
    ignoreCase?: boolean
  ): boolean {
    if (typeof a === "string" && typeof b === "string" && ignoreCase) {
      return op(a.toLowerCase(), b.toLowerCase());
    }
    return op(a, b);
  }

  /**
   * Compare two values as strings
   * @param a First value
   * @param b Second value
   * @param op String operation function
   * @param ignoreCase Whether to ignore case
   * @returns Comparison result
   */
  private stringCompare(
    a: any,
    b: any,
    op: (a: string, b: string) => boolean,
    ignoreCase?: boolean
  ): boolean {
    if (typeof a !== "string") {
      return false;
    }

    const strA = a;
    const strB = String(b);

    if (ignoreCase) {
      return op(strA.toLowerCase(), strB.toLowerCase());
    }

    return op(strA, strB);
  }
}
