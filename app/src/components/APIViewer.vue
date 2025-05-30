<!-- components/APIViewer.vue - Updated for new hook system -->
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
        
        <!-- Hook System Notice -->
        <v-alert
          type="info"
          variant="tonal"
          class="mb-4"
          icon="mdi-information"
        >
          <div class="font-weight-bold">New Hook System</div>
          <div class="text-caption">
            Generated code uses the new hook system with proper timing. Transform functions now receive fully populated nodes.
          </div>
        </v-alert>
        
        <!-- Generated Code -->
        <div class="api-code">
          <pre>{{ fluentApiCode }}</pre>
        </div>
        
        <!-- Usage Instructions -->
        <v-card variant="outlined" class="mt-4">
          <v-card-title class="text-subtitle-1">
            New Hook System Usage
          </v-card-title>
          <v-card-text class="text-body-2">
            <ol class="pl-4">
              <li>Install the XJX library: <code>npm install xjx</code></li>
              <li>Import the new hook system: <code>import { XJX, toNumber, toBoolean, regex } from 'xjx';</code></li>
              <li>Use the updated API signatures:
                <ul class="mt-2">
                  <li><strong>Source operations:</strong> <code>fromXml(source, hooks?)</code></li>
                  <li><strong>Map operations:</strong> <code>map(transform, hooks?)</code></li>
                  <li><strong>Output operations:</strong> <code>toJson(hooks?)</code></li>
                </ul>
              </li>
              <li>Pipeline hooks are configured in the constructor: <code>new XJX(config, pipelineHooks)</code></li>
              <li>Replace the placeholder variables with your actual data</li>
            </ol>
          </v-card-text>
        </v-card>
        
        <!-- Hook Types Reference -->
        <v-card variant="outlined" class="mt-4">
          <v-card-title class="text-subtitle-1">
            Hook Types Reference
          </v-card-title>
          <v-card-text class="text-body-2">
            <div class="mb-3">
              <strong>SourceHooks&lt;TInput&gt;</strong> - for fromXml, fromJson, fromXnode<br>
              <code class="text-caption">{ beforeTransform?: (source) => source, afterTransform?: (xnode) => xnode }</code>
            </div>
            <div class="mb-3">
              <strong>NodeHooks</strong> - for map operations<br>
              <code class="text-caption">{ beforeTransform?: (node) => node, afterTransform?: (node) => node }</code>
            </div>
            <div class="mb-3">
              <strong>OutputHooks&lt;TOutput&gt;</strong> - for toXml, toJson, etc.<br>
              <code class="text-caption">{ beforeTransform?: (xnode) => xnode, afterTransform?: (output) => output }</code>
            </div>
            <div class="mb-3">
              <strong>PipelineHooks</strong> - for cross-cutting concerns<br>
              <code class="text-caption">{ beforeStep?: (stepName, input) => void, afterStep?: (stepName, output) => void }</code>
            </div>
          </v-card-text>
        </v-card>
        
        <!-- Transform Examples -->
        <v-card variant="outlined" class="mt-4">
          <v-card-title class="text-subtitle-1">
            Transform Examples (Fixed Timing)
          </v-card-title>
          <v-card-text class="text-body-2">
            <div class="mb-2">
              <strong>Number transforms now work correctly:</strong><br>
              <code class="text-caption">map(toNumber({ nodeNames: ['price', 'total'] }))</code>
            </div>
            <div class="mb-2">
              <strong>Boolean transforms with proper timing:</strong><br>
              <code class="text-caption">map(toBoolean({ trueValues: ['yes', '1'] }))</code>
            </div>
            <div class="mb-2">
              <strong>Custom transforms receive populated nodes:</strong><br>
              <code class="text-caption">map(node => node.value ? {...node, value: parseFloat(node.value)} : node)</code>
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>
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