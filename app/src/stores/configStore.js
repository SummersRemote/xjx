// stores/configStore.js
import { defineStore } from 'pinia';
import XJXService from '../services/xjxService';
import { useAPIStore } from './apiStore';

export const useConfigStore = defineStore('config', {
  state: () => ({
    config: XJXService.getDefaultConfig(),
    logLevel: 'error' // Default log level
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
    },

    /**
     * Update log level
     * @param {string} level - New log level ('debug', 'info', 'warn', 'error', 'none')
     */
    updateLogLevel(level) {
      this.logLevel = level;
      
      // Apply the log level to the XJX library
      XJXService.setLogLevel(level);
      
      // Update the API store to generate new fluent API code
      const apiStore = useAPIStore();
      apiStore.updateFluentAPI();
    }
  }
});