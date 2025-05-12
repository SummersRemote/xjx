<!-- components/APIViewer.vue -->
<template>
    <v-card>
      <v-card-title class="d-flex align-center">
        Fluent API
        <v-spacer></v-spacer>
        <v-btn 
          icon="mdi-content-copy" 
          size="small"
          variant="text"
          @click="copyAPI"
        ></v-btn>
      </v-card-title>
      
      <v-card-text>
        <div class="api-code overflow-auto">
          <pre>{{ fluent }}</pre>
        </div>
      </v-card-text>
      
      <v-snackbar
        v-model="copySuccess"
        :timeout="2000"
        color="success"
      >
        Copied to clipboard!
      </v-snackbar>
    </v-card>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useAPIStore } from '../stores/apiStore';
  import { storeToRefs } from 'pinia';
  
  const apiStore = useAPIStore();
  const { fluent } = storeToRefs(apiStore);
  
  const copySuccess = ref(false);
  
  const copyAPI = () => {
    navigator.clipboard.writeText(fluent.value);
    copySuccess.value = true;
  };
  </script>
  
  <style scoped>
  .api-code {
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    white-space: pre-wrap;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    max-height: 200px;
    overflow-y: auto;
    line-height: 1.4;
    border: 1px solid #e0e0e0;
  }
  </style>