<!-- components/ConfigViewer.vue -->
<template>
    <v-dialog
      v-model="dialog"
      max-width="800px"
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          Current Configuration
          <v-spacer></v-spacer>
          <v-btn 
            icon="mdi-content-copy" 
            size="small"
            variant="text"
            @click="copyConfig"
          ></v-btn>
          <v-btn 
            icon="mdi-close" 
            size="small"
            variant="text"
            @click="dialog = false"
          ></v-btn>
        </v-card-title>
        
        <v-card-text>
          <div class="config-code overflow-auto">
            <pre>{{ formattedConfig }}</pre>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <v-snackbar
      v-model="copySuccess"
      :timeout="2000"
      color="success"
    >
      Copied to clipboard!
    </v-snackbar>
  </template>
  
  <script setup>
  import { ref, computed, defineExpose } from 'vue';
  import { useConfigStore } from '../stores/configStore';
  import { storeToRefs } from 'pinia';
  
  const dialog = ref(false);
  const copySuccess = ref(false);
  
  const configStore = useConfigStore();
  const { config } = storeToRefs(configStore);
  
  // Format the configuration for display
  const formattedConfig = computed(() => {
    return JSON.stringify(config.value, null, 2);
  });
  
  const copyConfig = () => {
    navigator.clipboard.writeText(formattedConfig.value);
    copySuccess.value = true;
  };
  
  const open = () => {
    dialog.value = true;
  };
  
  // Expose methods for external components to call
  defineExpose({
    open
  });
  </script>
  
  <style scoped>
  .config-code {
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    white-space: pre-wrap;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    max-height: 500px;
    overflow-y: auto;
    line-height: 1.4;
    border: 1px solid #e0e0e0;
  }
  </style>