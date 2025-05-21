// stores/editorStore.js
import { defineStore } from 'pinia';
import XJXService from '../services/xjxService';
import { useConfigStore } from './configStore';
import { useTransformStore } from './transformStore';

export const useEditorStore = defineStore('editor', {
  state: () => ({
    xml: '<root>\n  <example>Hello World</example>\n  <count>42</count>\n  <active>true</active>\n</root>',
    json: {},
    activeEditor: 'xml', // 'xml' or 'json'
    isProcessing: false,
    error: null,
    jsonFormat: null // 'xjx' or 'standard'
  }),
  actions: {
    /**
     * Convert XML to JSON using XJX format
     */
    async convertXmlToJson() {
      const configStore = useConfigStore();
      const transformStore = useTransformStore();
      
      this.isProcessing = true;
      this.error = null;
      
      try {
        // Make a copy of the config and set highFidelity to false for standard JSON
        const config = JSON.parse(JSON.stringify(configStore.config));
        
        const result = XJXService.convertXmlToJson(
          this.xml, 
          config, 
          transformStore.transforms
        );
        
        this.json = result;
        this.activeEditor = 'json';
        this.jsonFormat = 'xjx';
      } catch (err) {
        this.error = err.message;
        console.error('XML to JSON conversion error:', err);
      } finally {
        this.isProcessing = false;
      }
    },
    
    /**
     * Convert XML to standard JSON
     */
    async convertXmlToStandardJson() {
      const configStore = useConfigStore();
      const transformStore = useTransformStore();
      
      this.isProcessing = true;
      this.error = null;
      
      try {
        // Make a copy of the config and set highFidelity to false for standard JSON
        const config = JSON.parse(JSON.stringify(configStore.config));
        config.strategies.highFidelity = false;
        
        const result = XJXService.convertXmlToJson(
          this.xml, 
          config,
          transformStore.transforms
        );
        
        this.json = result;
        this.activeEditor = 'json';
        this.jsonFormat = 'standard';
      } catch (err) {
        this.error = err.message;
        console.error('XML to standard JSON conversion error:', err);
      } finally {
        this.isProcessing = false;
      }
    },
    
    /**
     * Convert JSON to XML
     * This method uses autodetection to handle both XJX and standard JSON formats
     */
    async convertJsonToXml() {
      const configStore = useConfigStore();
      const transformStore = useTransformStore();
      
      this.isProcessing = true;
      this.error = null;
      
      try {
        // Ensure we have a proper JSON object
        let jsonObj;
        if (typeof this.json === 'string' && this.json.trim()) {
          jsonObj = JSON.parse(this.json);
        } else {
          jsonObj = this.json;
        }
        
        const result = XJXService.convertJsonToXml(
          jsonObj, 
          configStore.config, 
          transformStore.transforms
        );
        
        this.xml = result;
        this.activeEditor = 'xml';
        this.jsonFormat = null; // Clear format when converting to XML
      } catch (err) {
        this.error = err.message;
        console.error('JSON to XML conversion error:', err);
      } finally {
        this.isProcessing = false;
      }
    },
    
    /**
     * Reset editor content to defaults
     */
    reset() {
      this.xml = '<root>\n  <example>Hello World</example>\n  <count>42</count>\n  <active>true</active>\n</root>';
      this.json = {};
      this.activeEditor = 'xml';
      this.error = null;
      this.jsonFormat = null;
    },
    
    /**
     * Update XML content
     * @param {string} value - New XML content
     */
    updateXml(value) {
      this.xml = value;
    },
    
    /**
     * Update JSON content
     * @param {Object|string} value - New JSON content
     */
    updateJson(value) {
      this.json = value;
      // When user updates JSON manually, we don't know the format
      this.jsonFormat = null;
    }
  }
});