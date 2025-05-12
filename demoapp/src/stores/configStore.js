// stores/configStore.js
import { defineStore } from 'pinia';
import XJXService from '../services/XJXService';

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
    },
    
    /**
     * Reset configuration to default
     */
    resetToDefault() {
      this.config = XJXService.getDefaultConfig();
    }
  }
});