<!-- App.vue - Added floating action button -->
<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar color="primary" app density="compact">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>
        <div class="d-flex align-center">
          <v-icon icon="mdi-xml" class="me-2"></v-icon>
          XJX Library Demo
        </div>
      </v-app-bar-title>
      
      <v-spacer></v-spacer>

      <v-btn
        color="white"
        variant="text"
        prepend-icon="mdi-file-document-multiple-outline"
        href="https://github.com/yourusername/xjx-demo"
        target="_blank"
        class="me-2"
        density="compact"
      >
        Docs
      </v-btn>

      <v-btn
        href="https://github.com/summersremote/xjx"
        target="_blank"
        icon
        density="compact"
      >
        <v-icon>mdi-github</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" width="420" class="config-drawer">
      <ConfigPanel @showConfig="showConfigDialog" @showApi="showApiDialog" />
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <!-- Source & Result Editors -->
        <v-row>
          <v-col cols="12">
            <UnifiedEditorPanel />
          </v-col>
        </v-row>
        
        <!-- Pipeline Manager -->
        <v-row>
          <v-col cols="12">
            <UnifiedPipelineManager />
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Floating Execute Button -->
    <v-btn
      color="success"
      size="large"
      icon="mdi-play"
      class="execute-fab"
      :disabled="!isValidPipeline || isProcessing"
      :loading="isProcessing"
      @click="executePipeline"
    >
    </v-btn>

    <!-- Hidden Dialogs -->
    <ConfigViewer ref="configViewer" />
    <APIViewer ref="apiViewer" />

    <v-footer app density="compact">
      <div class="w-100 text-center">
        &copy; {{ new Date().getFullYear() }} - XJX Library Demo
      </div>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { usePipelineStore } from '@/stores/pipelineStore';
import { storeToRefs } from 'pinia';
import UnifiedEditorPanel from '@/components/UnifiedEditorPanel.vue';
import UnifiedPipelineManager from '@/components/UnifiedPipelineManager.vue';
import ConfigPanel from '@/components/ConfigPanel.vue';
import ConfigViewer from '@/components/ConfigViewer.vue';
import APIViewer from '@/components/APIViewer.vue';

// Pipeline store for FAB
const pipelineStore = usePipelineStore();
const { isValidPipeline, isProcessing } = storeToRefs(pipelineStore);

// References for dialogs
const configViewer = ref(null);
const apiViewer = ref(null);

// Navigation drawer state
const drawer = ref(true);

// Methods
const showConfigDialog = () => {
  configViewer.value?.open();
};

const showApiDialog = () => {
  apiViewer.value?.open();
};

const executePipeline = async () => {
  try {
    await pipelineStore.executePipeline();
  } catch (err) {
    console.error('Failed to execute pipeline:', err);
  }
};
</script>

<style>
/* Global styles */
.v-application {
  font-family: 'Roboto', sans-serif;
}

/* Add scrolling to navigation drawer content */
.v-navigation-drawer {
  overflow-y: auto;
}

/* Config drawer specific styles */
.config-drawer {
  padding-bottom: 24px;
}

/* Style select components consistently */
.v-select.compact-select .v-field__input {
  min-height: 32px !important;
}

/* Floating Execute Button */
.execute-fab {
  position: fixed !important;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}
</style>