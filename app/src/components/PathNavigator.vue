<template>
    <v-container fluid>
      <p class="text-body-2 mb-4">
        Use dot notation to navigate the JSON structure and extract specific values. 
        For example: <code>root.$children.0.item.$attr.0.id.$val</code>
      </p>
  
      <v-row align="center" class="mb-4">
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="store.pathInput"
            label="Path"
            placeholder="e.g. root.$children.0.item.$val"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-2 mb-sm-0"
            :disabled="store.isProcessing"
            @keyup.enter="store.getPath"
          >
            <template v-slot:prepend-inner>
              <v-icon size="small">mdi-magnify</v-icon>
            </template>
          </v-text-field>
        </v-col>
        <v-col cols="12" sm="6" class="d-flex">
          <v-btn
            color="primary"
            @click="store.getPath"
            :disabled="!store.pathInput || store.isProcessing"
            class="me-2"
          >
            Get Value
          </v-btn>
          <v-btn
            color="error"
            variant="plain"
            @click="store.clearPath"
            :disabled="!store.pathInput && !store.pathResult"
          >
            Clear
          </v-btn>
        </v-col>
      </v-row>
  
      <v-divider class="mb-4"></v-divider>
  
      <v-row>
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="bg-grey-lighten-3 text-subtitle-1">
              <v-icon start>mdi-text-box-search</v-icon>
              Result
            </v-card-title>
            <v-card-text>
              <v-textarea
                v-model="store.pathResult"
                readonly
                auto-grow
                rows="5"
                variant="outlined"
                hide-details
                style="font-family: monospace; font-size: 14px;"
              ></v-textarea>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
  
      <v-row class="mt-4">
        <v-col cols="12">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel title="Common Path Examples">
              <v-expansion-panel-text>
                <v-list lines="two" density="compact">
                  <v-list-item 
                    v-for="(example, index) in commonExamples" 
                    :key="index"
                    :title="example.label"
                    :subtitle="example.path"
                    @click="useExample(example.path)"
                  >
                    <template v-slot:prepend>
                      <v-avatar size="32" color="primary" class="white--text">
                        {{ index + 1 }}
                      </v-avatar>
                    </template>
                    <template v-slot:append>
                      <v-btn
                        icon
                        variant="text"
                        size="small"
                        @click.stop="useExample(example.path)"
                      >
                        <v-icon>mdi-arrow-right-circle</v-icon>
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useXjxStore } from '../stores/xjxStore';
  
  // Get the store
  const store = useXjxStore();
  
  // Common path examples
  const commonExamples = ref([
    {
      label: 'Get Root ID',
      path: 'root.$attr.0.id.$val'
    },
    {
      label: 'Get Item Title',
      path: 'root.$children.0.item.$children.0.title.$val'
    },
    {
      label: 'Get CDATA Content',
      path: 'root.$children.0.item.$children.1.description.$children.0.$cdata'
    },
    {
      label: 'Get XML Comment',
      path: 'root.$children.0.item.$children.2.$cmnt'
    },
    {
      label: 'Get All Tags',
      path: 'root.$children.0.item.$children.4.tags.$children.0.tag.$val'
    }
  ]);
  
  // Use an example path
  const useExample = (path) => {
    store.pathInput = path;
    store.getPath();
  };
  </script>