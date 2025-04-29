<template>
  <main-layout>
    <v-card class="mb-4">
      <v-card-title>
        <v-icon start>mdi-cog</v-icon>
        Configuration
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="outlined"
          @click="toggleConfig"
          size="small"
        >
          {{ showConfig ? 'Hide' : 'Show' }} Configuration
        </v-btn>
      </v-card-title>
      <v-expand-transition>
        <div v-show="showConfig">
          <v-divider></v-divider>
          <config-panel />
        </div>
      </v-expand-transition>
    </v-card>

    <v-row>
      <v-col cols="12" class="text-center">
        <v-btn
          color="primary"
          class="mx-2"
          :loading="store.isProcessing"
          @click="store.convertXmlToJson"
        >
          Convert XML to JSON
        </v-btn>
        <v-btn
          color="secondary"
          class="mx-2"
          :loading="store.isProcessing"
          @click="store.convertJsonToXml"
        >
          Convert JSON to XML
        </v-btn>
        <v-btn
          color="warning"
          class="mx-2"
          @click="store.resetToDefault"
        >
          Reset
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <xml-editor />
      </v-col>
      <v-col cols="12" md="6">
        <json-editor />
      </v-col>
    </v-row>

    <v-card class="my-4">
      <v-card-title>
        <v-icon start>mdi-navigation</v-icon>
        Path Navigation
      </v-card-title>
      <v-card-text>
        <path-navigator />
      </v-card-text>
    </v-card>
  </main-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useXjxStore } from './stores/xjxStore';
import MainLayout from './layouts/MainLayout.vue';
import ConfigPanel from './components/ConfigPanel.vue';
import XmlEditor from './components/XmlEditor.vue';
import JsonEditor from './components/JsonEditor.vue';
import PathNavigator from './components/PathNavigator.vue';

// Get the store
const store = useXjxStore();

// State
const showConfig = ref(false);

// Methods
const toggleConfig = () => {
  showConfig.value = !showConfig.value;
};

// Initialize the application
onMounted(() => {
  // Convert the default XML to JSON
  store.convertXmlToJson();
});
</script>