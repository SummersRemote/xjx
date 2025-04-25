<template>
    <v-dialog
      v-model="dialog"
      width="800"
      scrollable
      persistent
    >
      <v-card>
        <v-card-title class="bg-primary text-white">
          <span>JSON Schema Based on Current Configuration</span>
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
            This JSON schema represents the structure of JSON objects produced by the XJX library with your current configuration.
            It can be used for validation and to understand the structure of converted XML.
          </p>
          
          <v-card variant="outlined" class="schema-display">
            <v-card-text class="pa-0">
              <pre class="schema-code">{{ formattedSchema }}</pre>
            </v-card-text>
          </v-card>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="copySchema"
            prepend-icon="mdi-content-copy"
          >
            Copy to Clipboard
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
  import { ref, computed } from 'vue';
  import { useXjxStore } from '../stores/xjxStore';
  import XjxService from '../services/xjxService';
  
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
  
  // Get schema from the service
  const formattedSchema = computed(() => {
    try {
      console.log("Generating schema with config:", store.config);
      const schema = XjxService.generateJsonSchema(store.config);
      console.log("Schema generated:", schema);
      return JSON.stringify(schema, null, 2);
    } catch (error) {
      console.error("Error generating schema:", error);
      return `Error generating schema: ${error.message}`;
    }
  });
  
  // Copy schema to clipboard
  const copySchema = () => {
    navigator.clipboard.writeText(formattedSchema.value)
      .then(() => {
        store.showNotification('Schema copied to clipboard', 'success', 2000);
      })
      .catch(error => {
        store.showNotification(`Failed to copy: ${error.message}`, 'error', 3000);
      });
  };
  </script>
  
  <style scoped>
  .schema-display {
    max-height: 60vh;
    overflow-y: auto;
    background-color: #f5f5f5;
  }
  
  .schema-code {
    font-family: monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 16px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  </style>