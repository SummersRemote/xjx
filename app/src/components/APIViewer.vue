<!-- components/APIViewer.vue -->
<template>
  <v-dialog
    v-model="dialog"
    max-width="900px"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-code-tags" class="me-2"></v-icon>
        Generated Fluent API Code
        <v-spacer></v-spacer>
        <v-btn 
          icon="mdi-content-copy" 
          size="small"
          variant="text"
          @click="copyAPI"
        ></v-btn>
        <v-btn 
          icon="mdi-close" 
          size="small"
          variant="text"
          @click="dialog = false"
        ></v-btn>
      </v-card-title>
      
      <v-card-text>
        <!-- Pipeline Status -->
        <v-alert
          v-if="!isValidPipeline"
          type="warning"
          variant="tonal"
          class="mb-4"
          icon="mdi-alert"
        >
          <div class="font-weight-bold">Invalid Pipeline</div>
          <div class="text-caption">
            Pipeline must start with a source operation and end with an output operation to generate valid code.
          </div>
        </v-alert>
        
        <!-- Generated Code -->
        <div class="api-code">
          <pre>{{ fluentApiCode }}</pre>
        </div>
        
        <!-- Pipeline Summary -->
        <!-- <v-card variant="outlined" class="mt-4">
          <v-card-title class="text-subtitle-1">
            Pipeline Summary
          </v-card-title>
          <v-card-text>
            <v-chip-group>
              <v-chip
                v-for="(step, index) in steps"
                :key="step.id"
                :color="getStepColor(step.type)"
                size="small"
                class="me-1 mb-1"
              >
                {{ index + 1 }}. {{ getOperationName(step.type) }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
        </v-card> -->
        
        <!-- Usage Instructions -->
        <!-- <v-card variant="outlined" class="mt-4">
          <v-card-title class="text-subtitle-1">
            Usage Instructions
          </v-card-title>
          <v-card-text class="text-body-2">
            <ol class="pl-4">
              <li>Install the XJX library: <code>npm install xjx</code></li>
              <li>Copy the generated code above into your JavaScript/TypeScript file</li>
              <li>Replace the placeholder variables with your actual data:
                <ul class="mt-2">
                  <li><code>config</code> - Your XJX configuration object</li>
                  <li><code>source</code> - Your source XML/JSON content</li>
                </ul>
              </li>
              <li>Execute the code to get your transformed result</li>
            </ol>
          </v-card-text>
        </v-card> -->
      </v-card-text>
      
      <!-- <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-content-copy"
          @click="copyAPI"
        >
          Copy Code
        </v-btn>
        <v-btn
          variant="text"
          @click="dialog = false"
        >
          Close
        </v-btn>
      </v-card-actions> -->
    </v-card>
  </v-dialog>
  
  <v-snackbar
    v-model="copySuccess"
    :timeout="2000"
    color="success"
  >
    Code copied to clipboard!
  </v-snackbar>
</template>

<script setup>
import { ref, computed, defineExpose } from 'vue';
import { usePipelineStore } from '../stores/pipelineStore';
import { storeToRefs } from 'pinia';

const dialog = ref(false);
const copySuccess = ref(false);

const pipelineStore = usePipelineStore();
const { steps, availableOperations, isValidPipeline } = storeToRefs(pipelineStore);

// Generated fluent API code
const fluentApiCode = computed(() => {
  return pipelineStore.generateFluentAPI();
});

// Helper functions
const getOperationName = (type) => {
  return availableOperations.value[type]?.name || type;
};

const getStepColor = (type) => {
  const category = availableOperations.value[type]?.category;
  switch (category) {
    case 'source': return 'blue';
    case 'functional': return 'purple';  
    case 'output': return 'green';
    default: return 'grey';
  }
};

const copyAPI = () => {
  navigator.clipboard.writeText(fluentApiCode.value);
  copySuccess.value = true;
};

const open = () => {
  dialog.value = true;
};

// Expose methods for external components to call
defineExpose({
  open
});
</script>

<style scoped>
.api-code {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.4;
  border: 1px solid #e0e0e0;
  max-height: 400px;
  overflow-y: auto;
}

code {
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
}
</style>