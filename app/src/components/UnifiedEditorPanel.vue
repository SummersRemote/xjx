<!-- components/UnifiedEditorPanel.vue - Execute button removed -->
<template>
  <!-- Error Alert -->
  <v-alert v-if="error" type="error" variant="tonal" closable class="mt-4">
    {{ error }}
  </v-alert>

  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-swap-horizontal" class="me-2"></v-icon>
      Source & Result
      <v-spacer></v-spacer>
      
      <!-- Swap Button -->
      <v-btn
        color="primary"
        variant="outlined"
        prepend-icon="mdi-swap-horizontal"
        @click="swapContent"
        :disabled="isProcessing"
        density="compact"
      >
        Swap
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- Source Editor -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="editor-card">
            <v-toolbar flat color="primary" dark density="compact">
              <v-toolbar-title>Source</v-toolbar-title>
              
              <v-spacer></v-spacer>

              <!-- Source Sample Selector -->
              <v-select
                v-model="selectedSourceSample"
                :items="sourceSampleItems"
                :item-props="itemProps"
                item-value="index"
                label="Load Sample"
                density="compact"
                variant="outlined"
                hide-details
                style="max-width: 200px"
                @update:model-value="loadSourceSample"
                class="me-2"
              >
              </v-select>

              <v-btn
                icon="mdi-content-copy"
                size="small"
                variant="text"
                @click="copyToClipboard(sourceContent)"
              ></v-btn>
            </v-toolbar>

            <v-card-text class="pa-0">
              <v-textarea
                v-model="sourceContent"
                auto-grow
                variant="plain"
                hide-details
                rows="15"
                density="compact"
                class="font-mono pa-2"
                :readonly="isProcessing"
                placeholder="Enter your source content here..."
              ></v-textarea>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Result Editor -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="editor-card">
            <v-toolbar flat color="success" dark density="compact">
              <v-toolbar-title>Result</v-toolbar-title>
              
              <v-spacer></v-spacer>
              
              <!-- Pipeline Status -->
              <v-chip 
                v-if="!isValidPipeline"
                color="warning" 
                size="small"
                class="me-2"
              >
                Invalid Pipeline
              </v-chip>
              
              <v-chip 
                v-else
                color="success" 
                size="small"
                class="me-2"
              >
                Ready
              </v-chip>

              <v-btn
                icon="mdi-content-copy"
                size="small"
                variant="text"
                @click="copyToClipboard(resultContent)"
              ></v-btn>
            </v-toolbar>

            <v-card-text class="pa-0">
              <v-textarea
                v-model="resultContent"
                auto-grow
                variant="plain"
                hide-details
                rows="15"
                density="compact"
                class="font-mono pa-2"
                readonly
                placeholder="Result will appear here after pipeline execution..."
              ></v-textarea>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Copy Success Snackbar -->
      <v-snackbar v-model="copySuccess" :timeout="2000" color="success">
        Copied to clipboard!
      </v-snackbar>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePipelineStore } from '../stores/pipelineStore';
import { storeToRefs } from 'pinia';
import { xmlSamples, jsonSamples } from '../services/sampleData';

const pipelineStore = usePipelineStore();
const { 
  sourceContent, 
  resultContent, 
  isProcessing, 
  error,
  isValidPipeline
} = storeToRefs(pipelineStore);

// Sample data
const selectedSourceSample = ref(null);
const copySuccess = ref(false);

// Create combined sample items (XML and JSON)
const sourceSampleItems = computed(() => {
  const items = [];
  
  // Add XML samples
  xmlSamples.forEach((sample, index) => {
    items.push({
      ...sample,
      index: `xml-${index}`,
      type: 'xml'
    });
  });
  
  // Add JSON samples  
  jsonSamples.forEach((sample, index) => {
    items.push({
      name: sample.name,
      description: sample.description,
      content: JSON.stringify(sample.content, null, 2),
      index: `json-${index}`,
      type: 'json'
    });
  });
  
  return items;
});

function itemProps(item) {
  return {
    title: `${item.name} (${item.type?.toUpperCase()})`,
    subtitle: item.description,
  };
}

// Load source sample
const loadSourceSample = (index) => {
  if (index !== null && index !== undefined) {
    const sample = sourceSampleItems.value.find(s => s.index === index);
    if (sample) {
      pipelineStore.updateSourceContent(sample.content);
    }
  }
  selectedSourceSample.value = null;
};

// Copy content to clipboard
const copyToClipboard = (content) => {
  navigator.clipboard.writeText(content);
  copySuccess.value = true;
};

// Swap source and result content
const swapContent = () => {
  pipelineStore.swapSourceResult();
};
</script>

<style scoped>
.font-mono {
  font-family: "Courier New", Courier, monospace;
  font-size: 14px;
  line-height: 1.4;
}

.editor-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-card :deep(.v-textarea) {
  flex-grow: 1;
}
</style>