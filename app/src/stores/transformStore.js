// stores/transformStore.js
import { defineStore } from 'pinia';
import XJXService from '../services/xjxService';

export const useTransformStore = defineStore('transform', {
  state: () => ({
    transforms: [],
    availableTransformers: XJXService.getAvailableTransformers()
  }),
  actions: {
    /**
     * Add a transform to the pipeline
     * @param {string} transformType - Type of transform
     * @param {Object} options - Transform options
     */
    addTransform(transformType, options = {}) {
      this.transforms.push({
        id: Date.now(), // Unique ID for tracking
        type: transformType,
        options: options
      });
    },
    
    /**
     * Update a transform's options
     * @param {number} id - Transform ID
     * @param {Object} options - New options
     */
    updateTransform(id, options) {
      const index = this.transforms.findIndex(t => t.id === id);
      if (index >= 0) {
        this.transforms[index].options = options;
      }
    },
    
    /**
     * Remove a transform from the pipeline
     * @param {number} id - Transform ID
     */
    removeTransform(id) {
      const index = this.transforms.findIndex(t => t.id === id);
      if (index >= 0) {
        this.transforms.splice(index, 1);
      }
    },
    
    /**
     * Move a transform up or down in the pipeline
     * @param {number} id - Transform ID
     * @param {string} direction - 'up' or 'down'
     */
    moveTransform(id, direction) {
      const index = this.transforms.findIndex(t => t.id === id);
      if (index < 0) return;
      
      if (direction === 'up' && index > 0) {
        const temp = this.transforms[index];
        this.transforms[index] = this.transforms[index - 1];
        this.transforms[index - 1] = temp;
      } else if (direction === 'down' && index < this.transforms.length - 1) {
        const temp = this.transforms[index];
        this.transforms[index] = this.transforms[index + 1];
        this.transforms[index + 1] = temp;
      }
    },
    
    /**
     * Clear all transforms
     */
    clearTransforms() {
      this.transforms = [];
    },
    
    /**
     * Get default options for a transform type
     * @param {string} type - Transform type
     * @returns {Object} Default options
     */
    getDefaultOptions(type) {
      switch (type) {
        case 'BooleanTransform':
          return {
            trueValues: ['true', 'yes', '1', 'on'],
            falseValues: ['false', 'no', '0', 'off'],
            ignoreCase: true,
            format: undefined
          };
        case 'NumberTransform':
          return {
            integers: true,
            decimals: true,
            scientific: true,
            strictParsing: true,
            decimalSeparator: '.',
            thousandsSeparator: ',',
            format: undefined
          };
        case 'RegexTransform':
          return {
            pattern: '',
            replacement: '',
            format: undefined
          };
        default:
          return {};
      }
    }
  }
});