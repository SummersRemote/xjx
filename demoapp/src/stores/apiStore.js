// stores/apiStore.js
import { defineStore } from 'pinia';
import XJXService from '../services/XJXService';
import { useConfigStore } from './configStore';
import { useTransformStore } from './transformStore';
import { useEditorStore } from './editorStore';

export const useAPIStore = defineStore('api', {
  state: () => ({
    fluent: ''
  }),
  actions: {
    /**
     * Update fluent API code based on current state
     */
    updateFluentAPI() {
      const configStore = useConfigStore();
      const transformStore = useTransformStore();
      const editorStore = useEditorStore();
      
      const fromType = editorStore.activeEditor;
      const content = fromType === 'xml' ? editorStore.xml : editorStore.json;
      
      this.fluent = XJXService.generateFluentAPI(
        fromType,
        content,
        configStore.config,
        transformStore.transforms
      );
    }
  }
});