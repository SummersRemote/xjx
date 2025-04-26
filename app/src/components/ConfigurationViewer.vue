<template>
    <v-dialog
      v-model="dialog"
      width="800"
      scrollable
      persistent
    >
      <v-card>
        <v-card-title class="bg-primary text-white">
          <span>XJX Configuration</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            variant="text"
            color="white"
            @click="dialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <p class="text-body-2 mb-4">
            This is the complete configuration for your XJX converter, including all transformers and settings.
            You can copy this configuration to save it or share with others.
          </p>
          
          <v-card variant="outlined" class="config-display">
            <v-card-text class="pa-0">
              <pre class="config-code">{{ formattedConfig }}</pre>
            </v-card-text>
          </v-card>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="copyConfig"
            prepend-icon="mdi-content-copy"
          >
            Copy to Clipboard
          </v-btn>
          <v-btn
            color="secondary"
            @click="downloadConfig"
            prepend-icon="mdi-download"
          >
            Download JSON
          </v-btn>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="dialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  import { useXjxStore } from '../stores/xjxStore';
  
  // Props
  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false
    }
  });
  
  // Emits
  const emit = defineEmits(['update:modelValue']);
  
  // State
  const store = useXjxStore();
  const dialog = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });
  
  // Format the configuration for display
  const formattedConfig = computed(() => {
    try {
      // Create a clean copy of the config without any Vue reactivity
      const configCopy = JSON.parse(JSON.stringify(store.config));
      
      // Format transformers to be more readable if they exist
      if (configCopy.valueTransforms && configCopy.valueTransforms.length > 0) {
        configCopy.valueTransforms = configCopy.valueTransforms.map((transformer, index) => {
          return {
            ...transformer,
            _index: index + 1, // Add index for readability
          };
        });
      }
      
      return JSON.stringify(configCopy, null, 2);
    } catch (error) {
      console.error("Error formatting configuration:", error);
      return `Error formatting configuration: ${error.message}`;
    }
  });
  
  // Copy configuration to clipboard
  const copyConfig = () => {
    navigator.clipboard.writeText(formattedConfig.value)
      .then(() => {
        store.showNotification('Configuration copied to clipboard', 'success', 2000);
      })
      .catch(error => {
        store.showNotification(`Failed to copy: ${error.message}`, 'error', 3000);
      });
  };
  
  // Download configuration as JSON file
  const downloadConfig = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(formattedConfig.value);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "xjx-config.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      store.showNotification('Configuration downloaded as JSON', 'success', 2000);
    } catch (error) {
      store.showNotification(`Failed to download: ${error.message}`, 'error', 3000);
    }
  };
  </script>
  
  <style scoped>
  .config-display {
    max-height: 60vh;
    overflow-y: auto;
    background-color: #f5f5f5;
  }
  
  .config-code {
    font-family: monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 16px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  </style>