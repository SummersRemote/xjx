/**
 * ElementTransform - Transforms XML elements
 */
import { 
    Transform, 
    TransformContext, 
    TransformResult, 
    TransformTarget, 
    createTransformResult,
    XNode,
    NodeType
  } from '../../core/types/transform-interfaces';
  
  /**
   * Options for element transformer
   */
  export interface ElementTransformOptions {
    /**
     * Filter function to selectively process elements
     * If provided, the transform will only be applied to elements
     * where this function returns true
     */
    filter?: (node: XNode, context: TransformContext) => boolean;
    
    /**
     * Map of element names to rename
     * Original name -> new name
     */
    renameMap?: Record<string, string>;
    
    /**
     * Filter function to remove children
     * Return true to keep the child, false to remove it
     */
    filterChildren?: (node: XNode, context: TransformContext) => boolean;
    
    /**
     * Function to create new children
     * Return an array of new nodes to add as children
     */
    addChildren?: (parentNode: XNode, context: TransformContext) => XNode[];
  }
  
  /**
   * ElementTransform - Transforms XML elements
   * 
   * Example usage:
   * ```
   * // Filter out elements with name 'secret'
   * XJX.fromXml(xml)
   *    .withTransforms(new ElementTransform({
   *      filterChildren: node => node.name !== 'secret'
   *    }))
   *    .toXml();
   * 
   * // Add a timestamp child to each 'user' element
   * XJX.fromXml(xml)
   *    .withTransforms(new ElementTransform({
   *      filter: node => node.name === 'user',
   *      addChildren: (parent) => [{
   *        name: 'timestamp',
   *        type: NodeType.ELEMENT_NODE,
   *        value: new Date().toISOString(),
   *        parent: parent
   *      }]
   *    }))
   *    .toXml();
   * ```
   */
  export class ElementTransform implements Transform {
    // Target elements
    targets = [TransformTarget.Element];
    
    private filter?: (node: XNode, context: TransformContext) => boolean;
    private renameMap?: Record<string, string>;
    private filterChildren?: (node: XNode, context: TransformContext) => boolean;
    private addChildren?: (parentNode: XNode, context: TransformContext) => XNode[];
    
    /**
     * Create a new element transformer
     */
    constructor(options: ElementTransformOptions = {}) {
      this.filter = options.filter;
      this.renameMap = options.renameMap;
      this.filterChildren = options.filterChildren;
      this.addChildren = options.addChildren;
    }
    
    /**
     * Transform element
     * 
     * No need to check node type - the pipeline handles that
     */
    transform(node: XNode, context: TransformContext): TransformResult<XNode> {
      // Skip if filter is provided and returns false
      if (this.filter && !this.filter(node, context)) {
        return createTransformResult(node);
      }
      
      // Deep clone the node to avoid modifying the original
      const result = this.deepClone(node);
      
      // Rename element if needed
      if (this.renameMap && this.renameMap[result.name]) {
        result.name = this.renameMap[result.name];
      }
      
      // Filter children if a filter function is provided and children exist
      if (this.filterChildren && result.children && result.children.length > 0) {
        result.children = result.children.filter(child => {
          const childContext: TransformContext = {
            nodeName: child.name,
            nodeType: child.type,
            namespace: child.namespace,
            prefix: child.prefix,
            path: `${context.path}.${child.name}`,
            config: context.config,
            direction: context.direction,
            parent: context
          };
          
          return this.filterChildren!(child, childContext);
        });
      }
      
      // Add children if an add function is provided
      if (this.addChildren) {
        const newChildren = this.addChildren(result, context);
        
        if (newChildren && newChildren.length > 0) {
          // Ensure children array exists
          if (!result.children) {
            result.children = [];
          }
          
          // Set parent reference for each new child
          newChildren.forEach(child => {
            child.parent = result;
          });
          
          // Add the new children
          result.children.push(...newChildren);
        }
      }
      
      return createTransformResult(result);
    }
    
    /**
     * Deep clone an object
     * @private
     */
    private deepClone<T>(obj: T): T {
      return JSON.parse(JSON.stringify(obj));
    }
  }
  
  /**
   * Options for sorting children
   */
  export interface SortChildrenOptions {
    /**
     * Name of the parent element whose children should be sorted
     * If not provided, applies to all elements
     */
    targetParent?: string;
    
    /**
     * Type of children to sort
     * If not provided, sorts all children
     */
    childType?: string;
    
    /**
     * Function to extract sort value from node
     * Default sorts by node name
     */
    sortBy?: (node: XNode, context: TransformContext) => string | number;
    
    /**
     * Optional key path to sort by (alternative to sortBy function)
     * Example: 'name' or 'attributes.id'
     */
    sortKey?: string;
    
    /**
     * Sort direction
     * Default is ascending
     */
    direction?: 'asc' | 'desc';
  }
  
  /**
   * SortChildrenTransform - Sorts element children based on criteria
   * 
   * Example usage:
   * ```
   * // Sort user elements by name
   * XJX.fromXml(xml)
   *    .withTransforms(new SortChildrenTransform({
   *      targetParent: 'users',
   *      childType: 'user',
   *      sortKey: 'value'
   *    }))
   *    .toXml();
   * 
   * // Sort all children of all elements by name in descending order
   * XJX.fromXml(xml)
   *    .withTransforms(new SortChildrenTransform({
   *      direction: 'desc'
   *    }))
   *    .toXml();
   * ```
   */
  export class SortChildrenTransform implements Transform {
    // Target elements
    targets = [TransformTarget.Element];
    
    private targetParent?: string;
    private childType?: string;
    private sortBy: (node: XNode, context: TransformContext) => string | number;
    private direction: 'asc' | 'desc';
    
    /**
     * Create a new sort children transformer
     */
    constructor(options: SortChildrenOptions = {}) {
      this.targetParent = options.targetParent;
      this.childType = options.childType;
      this.direction = options.direction || 'asc';
      
      // If sortKey is provided, create a sort function based on it
      if (options.sortKey) {
        this.sortBy = (node: XNode) => {
          return this.getNestedValue(node, options.sortKey!);
        };
      } else if (options.sortBy) {
        // Use provided sort function
        this.sortBy = options.sortBy;
      } else {
        // Default sort by name
        this.sortBy = (node: XNode) => node.name;
      }
    }
    
    /**
     * Transform by sorting children
     */
    transform(node: XNode, context: TransformContext): TransformResult<XNode> {
      // Only process elements with children
      if (!node.children || node.children.length <= 1) {
        return createTransformResult(node);
      }
      
      // Check if this is the target parent (if specified)
      if (this.targetParent && node.name !== this.targetParent) {
        return createTransformResult(node);
      }
      
      // Deep clone the node to avoid modifying the original
      const result = this.deepClone(node);
      
      // At this point we know result.children exists and has elements
      // Because we checked node.children above and result is a clone of node
      if (!result.children) {
        return createTransformResult(result);
      }
      
      // Filter children if a specific child type is specified
      let childrenToSort: XNode[] = this.childType 
        ? result.children.filter(child => child.name === this.childType)
        : [...result.children]; // Create a new array to avoid mutating the original
      
      // Only proceed if we have children to sort
      if (childrenToSort.length > 1) {
        // Create child contexts
        const childContexts = childrenToSort.map(child => ({
          node: child,
          context: this.createChildContext(child, context)
        }));
        
        // Sort the children
        childrenToSort.sort((a, b) => {
          const contextA = childContexts.find(item => item.node === a)?.context || context;
          const contextB = childContexts.find(item => item.node === b)?.context || context;
          
          const valueA = this.sortBy(a, contextA);
          const valueB = this.sortBy(b, contextB);
          
          // Compare based on sort direction
          if (this.direction === 'asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
          } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
          }
        });
        
        // If we filtered by child type, rebuild the children array with sorted children
        if (this.childType) {
          const otherChildren = result.children.filter(child => child.name !== this.childType);
          result.children = [...otherChildren, ...childrenToSort];
        } else {
          result.children = childrenToSort;
        }
      }
      
      return createTransformResult(result);
    }
    
    /**
     * Create a context for a child node
     */
    private createChildContext(child: XNode, parentContext: TransformContext): TransformContext {
      return {
        nodeName: child.name,
        nodeType: child.type,
        namespace: child.namespace,
        prefix: child.prefix,
        path: `${parentContext.path}.${child.name}`,
        config: parentContext.config,
        direction: parentContext.direction,
        parent: parentContext
      };
    }
    
    /**
     * Get a nested value from an object using a key path
     * @private
     */
    private getNestedValue(obj: any, path: string): any {
      const parts = path.split('.');
      let current = obj;
      
      for (const part of parts) {
        if (current === null || current === undefined) {
          return undefined;
        }
        
        current = current[part];
      }
      
      return current;
    }
    
    /**
     * Deep clone an object
     * @private
     */
    private deepClone<T>(obj: T): T {
      return JSON.parse(JSON.stringify(obj));
    }
  }