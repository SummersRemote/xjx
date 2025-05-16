// stores/configStore.js
import { defineStore } from 'pinia';
import XJXService from '../services/XJXService';
import { useAPIStore } from './apiStore';

export const useConfigStore = defineStore('config', {
  state: () => ({
    config: XJXService.getDefaultConfig()
  }),
  actions: {
    /**
     * Update configuration
     * @param {Object} config - New configuration
     */
    updateConfig(config) {
      this.config = config;
      
      // Update the API store to generate new fluent API code
      const apiStore = useAPIStore();
      apiStore.updateFluentAPI();
    },
    
    /**
     * Reset configuration to default
     */
    resetToDefault() {
      // Make sure we get a fresh copy of the default config
      this.config = XJXService.getDefaultConfig();
      
      // Update the API store to generate new fluent API code
      const apiStore = useAPIStore();
      apiStore.updateFluentAPI();
    }
  }
});