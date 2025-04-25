<template>
    <v-app>
      <v-app-bar color="primary" app>
        <v-app-bar-title>XJX - XML/JSON Converter</v-app-bar-title>
        <v-spacer></v-spacer>
        <v-btn 
          href="https://github.com/yourusername/xjx" 
          target="_blank"
          icon
        >
          <v-icon>mdi-github</v-icon>
        </v-btn>
      </v-app-bar>
  
      <v-main>
        <v-container fluid>
          <v-alert
            v-if="store.error"
            type="error"
            closable
            class="mb-4"
          >
            {{ store.error }}
          </v-alert>
          
          <slot></slot>
        </v-container>
      </v-main>
      
      <!-- Global notification system -->
      <v-snackbar
        v-model="store.notification.show"
        :color="store.notification.color"
        :timeout="store.notification.timeout"
      >
        {{ store.notification.text }}
        
        <template v-slot:actions>
          <v-btn
            variant="text"
            icon="mdi-close"
            @click="store.hideNotification"
          ></v-btn>
        </template>
      </v-snackbar>
  
      <v-footer app class="bg-grey-lighten-4">
        <v-row class="ma-0" justify="center">
          <span class="text-caption">
            &copy; {{ new Date().getFullYear() }} - XJX Library - Built with Vue 3 and Vuetify
          </span>
        </v-row>
      </v-footer>
    </v-app>
  </template>
  
  <script setup>
  import { useXjxStore } from '../stores/xjxStore';
  
  // Get the store
  const store = useXjxStore();
  </script>