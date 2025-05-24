// stores/functionalStore.js
import { defineStore } from 'pinia';
import XJXService from '../services/xjxService';
import { useConfigStore } from './configStore';

export const useFunctionalStore = defineStore('functional', {
  state: () => ({
    // Predicates
    selectPredicate: "node => node.name === 'user'",
    filterPredicate: "node => node.attributes && node.attributes.active === 'true'",
    
    // Results
    selectResults: null,
    filterResults: null,
    functionalResults: null,
    
    // State
    isProcessing: false,
    functionalError: null,
    
    // Current XJX instance for chaining operations
    currentXJX: null
  }),
  
  actions: {
    /**
     * Execute select operation on XML content
     * @param {string} xml - XML content to operate on
     * @param {string} predicateString - JavaScript predicate function as string
     * @param {string} fragmentRoot - Optional container element name
     */
    async executeSelect(xml, predicateString, fragmentRoot) {
      const configStore = useConfigStore();
      
      this.isProcessing = true;
      this.functionalError = null;
      
      try {
        // Validate inputs
        if (!xml || !xml.trim()) {
          throw new Error('No XML content available for select operation');
        }
        
        if (!predicateString || !predicateString.trim()) {
          throw new Error('Select predicate cannot be empty');
        }
        
        // Create predicate function from string
        const predicate = this.createPredicateFunction(predicateString);
        
        // Import XJX dynamically to access the library
        const { XJX } = await import("../../../dist/esm/index.js");
        
        // Create XJX instance and perform select operation
        let xjx = new XJX().withConfig(configStore.config).fromXml(xml);
        
        // Call select with optional fragmentRoot parameter
        if (fragmentRoot) {
          xjx = xjx.select(predicate, fragmentRoot);
        } else {
          xjx = xjx.select(predicate);
        }
        
        // Store the XJX instance for potential chaining
        this.currentXJX = xjx;
        
        // Get the XNode results
        const xnodeResults = xjx.toXnode();
        this.selectResults = xnodeResults;
        
        // Convert to XML for display
        const xmlResults = xjx.toXmlString({ prettyPrint: true });
        this.functionalResults = xmlResults;
        
        console.log(`Select operation completed. Found ${xnodeResults.length} result(s).`);
        
      } catch (err) {
        this.functionalError = `Select operation failed: ${err.message}`;
        console.error('Select operation error:', err);
        this.selectResults = null;
        this.functionalResults = null;
        this.currentXJX = null;
      } finally {
        this.isProcessing = false;
      }
    },
    
    /**
     * Execute filter operation on current selection
     * @param {string} predicateString - JavaScript predicate function as string
     * @param {string} fragmentRoot - Optional container element name
     */
    async executeFilter(predicateString, fragmentRoot) {
      this.isProcessing = true;
      this.functionalError = null;
      
      try {
        // Validate inputs
        if (!this.currentXJX) {
          throw new Error('No current selection available. Run a select operation first.');
        }
        
        if (!predicateString || !predicateString.trim()) {
          throw new Error('Filter predicate cannot be empty');
        }
        
        // Create predicate function from string
        const predicate = this.createPredicateFunction(predicateString);
        
        // Apply filter to current selection with optional fragmentRoot
        let filteredXJX;
        if (fragmentRoot) {
          filteredXJX = this.currentXJX.filter(predicate, fragmentRoot);
        } else {
          filteredXJX = this.currentXJX.filter(predicate);
        }
        
        // Update current XJX instance
        this.currentXJX = filteredXJX;
        
        // Get the XNode results
        const xnodeResults = filteredXJX.toXnode();
        this.filterResults = xnodeResults;
        
        // Convert to XML for display
        const xmlResults = filteredXJX.toXmlString({ prettyPrint: true });
        this.functionalResults = xmlResults;
        
        console.log(`Filter operation completed. ${xnodeResults.length} result(s) remaining.`);
        
      } catch (err) {
        this.functionalError = `Filter operation failed: ${err.message}`;
        console.error('Filter operation error:', err);
        this.filterResults = null;
      } finally {
        this.isProcessing = false;
      }
    },
    
    /**
     * Execute axis navigation operation on current selection
     * @param {string} axisName - Navigation axis ('children', 'descendants', 'parent', 'ancestors', 'siblings')
     * @param {string} predicateString - Optional JavaScript predicate function as string
     * @param {string} fragmentRoot - Optional container element name
     */
    async executeAxisNavigation(axisName, predicateString, fragmentRoot) {
      this.isProcessing = true;
      this.functionalError = null;
      
      try {
        // Validate inputs
        if (!this.currentXJX) {
          throw new Error('No current selection available. Run a select operation first.');
        }
        
        // Validate axis name
        const validAxes = ['children', 'descendants', 'parent', 'ancestors', 'siblings'];
        if (!validAxes.includes(axisName)) {
          throw new Error(`Invalid axis name: ${axisName}`);
        }
        
        // For 'parent' axis, predicate isn't applicable
        if (axisName === 'parent' && predicateString) {
          console.warn('Predicate is ignored for parent axis');
          predicateString = null;
        }
        
        // Create predicate function from string if provided
        let predicate;
        if (predicateString) {
          predicate = this.createPredicateFunction(predicateString);
        }
        
        // Apply axis navigation to current selection
        let navigationXJX;
        
        // Handle different parameter combinations
        if (predicateString && fragmentRoot) {
          // Both predicate and fragmentRoot
          navigationXJX = this.currentXJX[axisName](predicate, fragmentRoot);
        } else if (predicateString) {
          // Only predicate
          navigationXJX = this.currentXJX[axisName](predicate);
        } else if (fragmentRoot) {
          // Only fragmentRoot
          navigationXJX = this.currentXJX[axisName](undefined, fragmentRoot);
        } else {
          // No parameters
          navigationXJX = this.currentXJX[axisName]();
        }
        
        // Update current XJX instance
        this.currentXJX = navigationXJX;
        
        // Get the XNode results
        const xnodeResults = navigationXJX.toXnode();
        this.filterResults = xnodeResults; // Reuse filter results state
        
        // Convert to XML for display
        const xmlResults = navigationXJX.toXmlString({ prettyPrint: true });
        this.functionalResults = xmlResults;
        
        console.log(`${axisName} navigation completed. ${xnodeResults.length} result(s).`);
        
      } catch (err) {
        this.functionalError = `${axisName} navigation failed: ${err.message}`;
        console.error(`${axisName} navigation error:`, err);
        this.filterResults = null;
      } finally {
        this.isProcessing = false;
      }
    },
    
    /**
     * Create a predicate function from a string
     * @param {string} predicateString - JavaScript function string
     * @returns {Function} Predicate function
     */
    createPredicateFunction(predicateString) {
      try {
        // Clean up the predicate string
        let cleanPredicate = predicateString.trim();
        
        // If it doesn't start with 'node =>', add it
        if (!cleanPredicate.startsWith('node =>') && !cleanPredicate.startsWith('(node)') && !cleanPredicate.startsWith('function')) {
          cleanPredicate = `node => ${cleanPredicate}`;
        }
        
        // Create and return the function
        // Using Function constructor to create the predicate safely
        const predicateFunction = new Function('return ' + cleanPredicate)();
        
        // Test the function with a dummy node to make sure it's valid
        const testNode = { name: 'test', type: 1, attributes: {}, children: [], value: 'test' };
        predicateFunction(testNode);
        
        return predicateFunction;
      } catch (err) {
        throw new Error(`Invalid predicate function: ${err.message}. Expected format: 'node => condition'`);
      }
    },
    
    /**
     * Reset all functional operation state
     */
    reset() {
      this.selectResults = null;
      this.filterResults = null;
      this.functionalResults = null;
      this.functionalError = null;
      this.currentXJX = null;
      this.isProcessing = false;
      
      // Reset to default predicates
      this.selectPredicate = "node => node.name === 'user'";
      this.filterPredicate = "node => node.attributes && node.attributes.active === 'true'";
    },
    
    /**
     * Update select predicate
     * @param {string} predicate - New predicate string
     */
    updateSelectPredicate(predicate) {
      this.selectPredicate = predicate;
    },
    
    /**
     * Update filter predicate
     * @param {string} predicate - New predicate string
     */
    updateFilterPredicate(predicate) {
      this.filterPredicate = predicate;
    }
  }
});