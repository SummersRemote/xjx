/**
 * FilterChildrenTransformer
 * 
 * A custom transformer that filters child nodes based on element name.
 * This transformer implements the Transform interface from the XJX library.
 */
import { TransformTarget, createTransformResult } from '../../../../dist/esm';

class FilterChildrenTransformer {
  /**
   * Constructor for the transformer
   * @param {Object} options - Configuration options
   * @param {string[]} options.excludeNames - Array of element names to exclude
   * @param {boolean} options.ignoreCase - Whether to ignore case when matching names
   */
  constructor(options = {}) {
    this.options = options;
    this.excludeNames = options.excludeNames || [];
    this.ignoreCase = options.ignoreCase !== false;

    // Define the targets - this transformer only works on element children
    this.targets = [TransformTarget.Element];
  }
  
  /**
   * Transform method required by XJX
   * This will be called when processing element nodes
   * 
   * @param {Object} node - The node to transform
   * @param {Object} context - Transformation context
   * @returns {Object} Result object with transformed value and remove flag
   */
  transform(node, context) {
    // Skip if no excludeNames are defined
    if (!this.excludeNames || this.excludeNames.length === 0) {
      return createTransformResult(node);
    }
    
    // Skip if the node doesn't have children
    if (!node.children || node.children.length === 0) {
      return createTransformResult(node);
    }
    
    // Clone the node to avoid modifying the original
    const clonedNode = JSON.parse(JSON.stringify(node));
    
    // Filter children based on element name
    clonedNode.children = clonedNode.children.filter(child => {
      // Skip if not an element
      if (child.type !== 1) { // 1 is Element node
        return true;
      }
      
      // Get the element name
      const name = child.name;
      
      // Check if the name should be excluded
      if (this.ignoreCase) {
        return !this.excludeNames.some(
          excludeName => excludeName.toLowerCase() === name.toLowerCase()
        );
      } else {
        return !this.excludeNames.includes(name);
      }
    });
    
    // Return the filtered node
    return createTransformResult(clonedNode);
  }
}

export default FilterChildrenTransformer;