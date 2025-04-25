<template>
    <v-card height="100%">
      <v-card-title class="bg-primary text-white d-flex align-center">
        <v-icon color="white" class="me-2">mdi-xml</v-icon>
        XML
        <v-spacer></v-spacer>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              color="white"
              size="small"
              @click="validateXml"
            >
              <v-icon>mdi-check-circle</v-icon>
            </v-btn>
          </template>
          <span>Validate XML</span>
        </v-tooltip>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              color="white"
              size="small"
              @click="prettyPrintXml"
            >
              <v-icon>mdi-format-align-left</v-icon>
            </v-btn>
          </template>
          <span>Pretty Print XML</span>
        </v-tooltip>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              color="white"
              size="small"
              @click="copyXml"
            >
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
          </template>
          <span>Copy XML</span>
        </v-tooltip>
      </v-card-title>
      <v-card-text class="pa-0">
        <v-textarea
          v-model="store.xmlContent"
          auto-grow
          variant="plain"
          hide-details
          class="xml-editor"
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
  
  // Methods for XML operations
  const validateXml = () => {
    try {
      const result = XjxService.validateXml(store.xmlContent, store.config);
      
      if (result.isValid) {
        store.showNotification('XML is valid', 'success', 2000);
      } else {
        store.showNotification(`XML is invalid: ${result.message || 'Unknown error'}`, 'error', 3000);
      }
    } catch (error) {
      store.showNotification(`Validation error: ${error.message}`, 'error', 3000);
    }
  };
  
  const prettyPrintXml = () => {
    try {
      store.xmlContent = XjxService.prettyPrintXml(store.xmlContent, store.config);
      store.showNotification('XML pretty printed successfully', 'success', 2000);
    } catch (error) {
      store.showNotification(`Pretty print error: ${error.message}`, 'error', 3000);
    }
  };
  
  const copyXml = () => {
    navigator.clipboard.writeText(store.xmlContent)
      .then(() => {
        store.showNotification('XML copied to clipboard', 'info', 2000);
      })
      .catch(err => {
        store.showNotification(`Failed to copy: ${err.message}`, 'error', 3000);
      });
  };
  </script>
  
  <style scoped>
  .xml-editor :deep(textarea) {
    padding: 12px !important;
  }
  </style>