/**
 * FilterChildrenTransformer
 * 
 * A custom transformer that filters child nodes based on element name.
 * This can be used to remove unwanted elements from the XML or JSON structure.
 */
class FilterChildrenTransformer {
    /**
     * Constructor for the transformer
     * @param {Object} options - Configuration options
     * @param {string[]} options.excludeNames - Array of element names to exclude
     * @param {boolean} options.ignoreCase - Whether to ignore case when matching names
     */
    constructor(options = {}) {
      this.excludeNames = options.excludeNames || [];
      this.ignoreCase = options.ignoreCase !== false;
    }
    
    /**
     * Transform method required by XJX
     * This will be called when processing node children
     * 
     * @param {Array} children - Array of child nodes
     * @param {Object} node - Parent node
     * @param {Object} context - Transformation context
     * @returns {Object} Result object with transformed children
     */
    transform(children, node, context) {
      // Skip if no excludeNames are defined
      if (!this.excludeNames || this.excludeNames.length === 0) {
        return { value: children, remove: false };
      }
      
      // Filter children based on element name
      const filteredChildren = children.filter(child => {
        // Get the element name
        const name = child.name;
        
        // Skip if not an element (text nodes, comments, etc.)
        if (!name || name.startsWith('#')) {
          return true;
        }
        
        // Check if the name should be excluded
        if (this.ignoreCase) {
          return !this.excludeNames.some(
            excludeName => excludeName.toLowerCase() === name.toLowerCase()
          );
        } else {
          return !this.excludeNames.includes(name);
        }
      });
      
      // Return the filtered children
      return {
        value: filteredChildren,
        remove: false
      };
    }
  }
  
  export default FilterChildrenTransformer;