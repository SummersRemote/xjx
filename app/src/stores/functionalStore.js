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
     */
    async executeSelect(xml, predicateString) {
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
        const xjx = new XJX()
          .withConfig(configStore.config)
          .fromXml(xml)
          .select(predicate);
        
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
     */
    async executeFilter(predicateString) {
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
        
        // Apply filter to current selection
        const filteredXJX = this.currentXJX.filter(predicate);
        
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