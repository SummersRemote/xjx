// stores/apiStore.js
import { defineStore } from 'pinia';
import XJXService from '../services/XJXService';
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
      
      this.fluent = XJXService.generateFluentAPI(
        fromType,
        content,
        configStore.config,
        transformStore.transforms,
        editorStore.jsonFormat // Pass the JSON format from the editor store
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