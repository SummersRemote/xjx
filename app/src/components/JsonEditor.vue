<template>
    <v-card height="100%">
      <v-card-title class="bg-secondary text-white d-flex align-center">
        <v-icon color="white" class="me-2">mdi-code-json</v-icon>
        JSON
        <v-spacer></v-spacer>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              color="white"
              size="small"
              @click="validateJson"
            >
              <v-icon>mdi-check-circle</v-icon>
            </v-btn>
          </template>
          <span>Validate JSON</span>
        </v-tooltip>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              color="white"
              size="small"
              @click="formatJson"
            >
              <v-icon>mdi-format-align-left</v-icon>
            </v-btn>
          </template>
          <span>Format JSON</span>
        </v-tooltip>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              color="white"
              size="small"
              @click="copyJson"
            >
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
          </template>
          <span>Copy JSON</span>
        </v-tooltip>
      </v-card-title>
      <v-card-text class="pa-0">
        <v-textarea
          v-model="store.jsonContent"
          auto-grow
          variant="plain"
          hide-details
          class="json-editor"
          :rows="20"
          :readonly="store.isProcessing"
          :loading="store.isProcessing"
          bg-color="grey-lighten-4"
          style="font-family: monospace; font-size: 14px; line-height: 1.5;"
        ></v-textarea>
      </v-card-text>
    </v-card>
  </template>
  
  <script setup>
  import { useXjxStore } from '../stores/xjxStore';
  import XjxService from '../services/xjxService';
  
  // Get the store
  const store = useXjxStore();
  
  // Methods for JSON operations
  const validateJson = () => {
    if (!store.jsonContent) {
      store.showNotification('JSON content is empty', 'warning', 2000);
      return;
    }
    
    try {
      const result = XjxService.validateJson(store.jsonContent);
      if (result.isValid) {
        store.showNotification('JSON is valid', 'success', 2000);
      } else {
        store.showNotification(`JSON is invalid: ${result.message}`, 'error', 3000);
      }
    } catch (error) {
      store.showNotification(`JSON is invalid: ${error.message}`, 'error', 3000);
    }
  };
  
  const formatJson = () => {
    if (!store.jsonContent) {
      store.showNotification('JSON content is empty', 'warning', 2000);
      return;
    }
    
    try {
      store.jsonContent = XjxService.formatJson(store.jsonContent, 2);
      store.showNotification('JSON formatted successfully', 'success', 2000);
    } catch (error) {
      store.showNotification(`Format error: ${error.message}`, 'error', 3000);
    }
  };
  
  const copyJson = () => {
    navigator.clipboard.writeText(store.jsonContent)
      .then(() => {
        store.showNotification('JSON copied to clipboard', 'info', 2000);
      })
      .catch(err => {
        store.showNotification(`Failed to copy: ${err.message}`, 'error', 3000);
      });
  };
  </script>
  
  <style scoped>
  .json-editor :deep(textarea) {
    padding: 12px !important;
  }
  </style>