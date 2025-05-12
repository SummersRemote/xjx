<!-- App.vue -->
<template>
    <v-app>
      <v-app-bar
        color="primary"
        app
        density="comfortable"
      >
        <v-app-bar-title>
          <div class="d-flex align-center">
            <v-icon icon="mdi-xml" class="me-2"></v-icon>
            XJX Library Demo
          </div>
        </v-app-bar-title>
        
        <v-spacer></v-spacer>
        
        <v-btn
          href="https://github.com/yourusername/xjx-demo"
          target="_blank"
          icon
        >
          <v-icon>mdi-github</v-icon>
        </v-btn>
      </v-app-bar>
  
      <v-main>
        <v-container fluid>

          <v-row>
          <v-col cols="12" lg="6">
              <ConfigEditor />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <EditorPanel />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12" lg="6">
              <TransformManager />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12">
              <APIViewer />
            </v-col>
          </v-row>
        </v-container>
      </v-main>
  
      <v-footer app>
        <div class="w-100 text-center">
          &copy; {{ new Date().getFullYear() }} - XJX Library Demo
        </div>
      </v-footer>
    </v-app>
  </template>
  
  <script setup>
  import EditorPanel from '@/components/EditorPanel.vue';
  import ConfigEditor from '@/components/ConfigEditor.vue';
  import TransformManager from '@/components/TransformManager.vue';
  import APIViewer from '@/components/APIViewer.vue';
  </script>
  
  <style>
  /* Global styles */
  .v-application {
    font-family: 'Roboto', sans-serif;
  }
  
  /* Add scrolling to expansion panel content */
  .v-expansion-panel-text__wrapper {
    max-height: 400px;
    overflow-y: auto;
  }
  </style>