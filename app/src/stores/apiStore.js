// stores/apiStore.js
import { defineStore } from 'pinia';
import XJXService from '../services/xjxService';
import { useConfigStore } from './configStore';
import { useTransformStore } from './transformStore';
import { useEditorStore } from './editorStore';

export const useAPIStore = defineStore('api', {
  state: () => ({
    fluent: '',
    lastDirection: 'xml', // Default direction (xml to json)
    jsonFormat: 'xjx'     // Default JSON format (xjx or standard)
  }),
  actions: {
    /**
     * Update fluent API code based on current state
     */
    updateFluentAPI() {
      const configStore = useConfigStore();
      const transformStore = useTransformStore();
      const editorStore = useEditorStore();
      
      // Use the last direction for API generation
      const fromType = this.lastDirection;
      const content = fromType === 'xml' ? editorStore.xml : editorStore.json;
      
      // Make a copy of the config to manipulate for API generation
      const configForApi = JSON.parse(JSON.stringify(configStore.config));
      
      // If this is XML to JSON, set the highFidelity property based on jsonFormat
      if (fromType === 'xml' && this.jsonFormat) {
        configForApi.strategies.highFidelity = (this.jsonFormat === 'xjx');
      }
      
      this.fluent = XJXService.generateFluentAPI(
        fromType,
        content,
        configForApi,
        transformStore.transforms,
        this.jsonFormat
      );
    },
    
    /**
     * Update the last direction used (xml or json)
     * @param {string} direction - Direction ('xml' or 'json')
     */
    updateLastDirection(direction) {
      this.lastDirection = direction;
    },
    
    /**
     * Update the JSON format used (xjx or standard)
     * @param {string} format - Format ('xjx' or 'standard')
     */
    updateJsonFormat(format) {
      this.jsonFormat = format;
    }
  }
});