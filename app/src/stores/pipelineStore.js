// stores/pipelineStore.js
import { defineStore } from 'pinia';
import XJXService from '../services/xjxService';

export const usePipelineStore = defineStore('pipeline', {
  state: () => ({
    steps: [], // Array of operation steps
    availableOperations: {
      // Functional operations
      'select': { type: 'select', name: 'Select Nodes', category: 'functional', description: 'Find nodes matching a predicate while preserving hierarchy' },
      'filter': { type: 'filter', name: 'Filter Selection', category: 'functional', description: 'Remove nodes matching a predicate while maintaining hierarchy' },
      'map': { type: 'map', name: 'Map Nodes', category: 'functional', description: 'Transform each node in the selection' },
      'reduce': { type: 'reduce', name: 'Reduce Nodes', category: 'functional', description: 'Aggregate nodes into a single value' },
      'get': { type: 'get', name: 'Get Node by Index', category: 'functional', description: 'Select a specific node by index from the current selection' },
      
      // Transform operations
      'transform': { type: 'transform', name: 'Transform Values', category: 'transform', description: 'Apply value transformations (boolean, number, regex)' }
    }
  }),
  actions: {
    /**
     * Add a new step to the pipeline
     * @param {string} type - Operation type
     * @param {Object} options - Operation options
     */
    addStep(type, options = {}) {
      this.steps.push({
        id: Date.now(),
        type: type,
        options: options
      });
    },
    
    /**
     * Remove a step from the pipeline
     * @param {number} id - Step ID
     */
    removeStep(id) {
      const index = this.steps.findIndex(s => s.id === id);
      if (index >= 0) {
        this.steps.splice(index, 1);
      }
    },
    
    /**
     * Update a step's options
     * @param {number} id - Step ID
     * @param {Object} options - New options
     */
    updateStep(id, options) {
      const index = this.steps.findIndex(s => s.id === id);
      if (index >= 0) {
        this.steps[index].options = options;
      }
    },
    
    /**
     * Move a step up or down in the pipeline
     * @param {number} id - Step ID
     * @param {string} direction - 'up' or 'down'
     */
    moveStep(id, direction) {
      const index = this.steps.findIndex(s => s.id === id);
      if (index < 0) return;
      
      if (direction === 'up' && index > 0) {
        const temp = this.steps[index];
        this.steps[index] = this.steps[index - 1];
        this.steps[index - 1] = temp;
      } else if (direction === 'down' && index < this.steps.length - 1) {
        const temp = this.steps[index];
        this.steps[index] = this.steps[index + 1];
        this.steps[index + 1] = temp;
      }
    },
    
    /**
     * Clear all steps from the pipeline
     */
    clearSteps() {
      this.steps = [];
    },
    
    /**
     * Get default options for a specific operation type
     * @param {string} type - Operation type
     * @returns {Object} Default options
     */
    getDefaultOptions(type) {
      // Return default options based on operation type
      switch (type) {
        case 'select':
          return { 
            predicate: 'node => node.name === "example"', 
            fragmentRoot: '' 
          };
        case 'filter':
          return { 
            predicate: 'node => node.name === "example"', 
            fragmentRoot: '' 
          };
        case 'map':
          return { 
            mapper: 'node => {\n  // Transform the node\n  return node;\n}', 
            fragmentRoot: '' 
          };
        case 'reduce':
          return { 
            reducer: '(acc, node) => {\n  // Accumulate values\n  return acc + 1;\n}', 
            initialValue: '0', 
            fragmentRoot: '' 
          };
        case 'get':
          return { 
            index: 0,
            unwrap: true 
          };
        case 'transform':
          // For transforms, reuse the existing structure from transformStore
          return { 
            type: 'BooleanTransform', 
            options: XJXService.getAvailableTransformers().BooleanTransform 
          };
        default:
          return {};
      }
    }
  }
});