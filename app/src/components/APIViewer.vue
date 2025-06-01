<!-- components/APIViewer.vue - Updated for minimal transform system -->
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
            Pipeline must have both source and output operations to generate valid code.
          </div>
        </v-alert>
        
        <!-- Minimal Transform System Notice -->
        <v-alert
          type="info"
          variant="tonal"
          class="mb-4"
          icon="mdi-information"
        >
          <div class="font-weight-bold">Minimal Transform System</div>
          <div class="text-caption">
            Transforms are now pure functions: <code>(node: XNode) => XNode</code>. Use explicit filtering for node targeting.
          </div>
        </v-alert>
        
        <!-- Generated Code -->
        <div class="api-code">
          <pre>{{ fluentApiCode }}</pre>
        </div>
        
        <!-- Usage Instructions -->
        <v-card variant="outlined" class="mt-4">
          <v-card-title class="text-subtitle-1">
            Usage Instructions
          </v-card-title>
          <v-card-text class="text-body-2">
            <ol class="pl-4">
              <li>Install the XJX library: <code>npm install xjx</code></li>
              <li>Import the minimal transform system: <code>import { XJX, toNumber, toBoolean, regex, compose } from 'xjx';</code></li>
              <li>Use the simplified pipeline structure:
                <ul class="mt-2">
                  <li><strong>Source operations:</strong> <code>fromXml(source, hooks?)</code></li>
                  <li><strong>Explicit filtering:</strong> <code>filter(node => condition)</code>, <code>select(node => condition)</code></li>
                  <li><strong>Pure transforms:</strong> <code>map(transform)</code>, <code>map(compose(transform1, transform2))</code></li>
                  <li><strong>Output operations:</strong> <code>toJson(hooks?)</code></li>
                </ul>
              </li>
              <li>Pipeline hooks are configured in the constructor: <code>new XJX(config, pipelineHooks)</code></li>
              <li>Replace the placeholder variables with your actual data</li>
            </ol>
          </v-card-text>
        </v-card>
        
        <!-- Minimal Transform System Reference -->
        <v-card variant="outlined" class="mt-4">
          <v-card-title class="text-subtitle-1">
            Minimal Transform System
          </v-card-title>
          <v-card-text class="text-body-2">
            <div class="mb-3">
              <strong>Pure Transform Functions</strong><br>
              <code class="text-caption">type Transform = (node: XNode) => XNode</code><br>
              All transforms are pure functions with no side effects.
            </div>
            <div class="mb-3">
              <strong>Explicit Node Targeting</strong><br>
              <code class="text-caption">filter(node => node.name === 'price')</code><br>
              <code class="text-caption">select(node => ['price', 'total'].includes(node.name))</code><br>
              Use filtering operations before transforms instead of built-in targeting.
            </div>
            <div class="mb-3">
              <strong>Transform Composition</strong><br>
              <code class="text-caption">compose(regex(/[^\d.]/g, ''), toNumber({ precision: 2 }))</code><br>
              Chain multiple transforms using the compose function.
            </div>
            <div class="mb-3">
              <strong>Hook System</strong><br>
              Source, Output, Node, and Pipeline hooks work with the minimal transform system.
            </div>
          </v-card-text>
        </v-card>
        
        <!-- Transform Examples -->
        <v-card variant="outlined" class="mt-4">
          <v-card-title class="text-subtitle-1">
            Transform Examples (Minimal System)
          </v-card-title>
          <v-card-text class="text-body-2">
            <div class="mb-2">
              <strong>Explicit filtering with transforms:</strong><br>
              <code class="text-caption">filter(node => node.name === 'price').map(toNumber({ precision: 2 }))</code>
            </div>
            <div class="mb-2">
              <strong>Composed transforms:</strong><br>
              <code class="text-caption">map(compose(regex(/[$,]/g, ''), toNumber()))</code>
            </div>
            <div class="mb-2">
              <strong>Inline custom transforms:</strong><br>
              <code class="text-caption">map(node => ({ ...node, processed: true }))</code>
            </div>
            <div class="mb-2">
              <strong>Multiple operation pipeline:</strong><br>
              <code class="text-caption">filter(node => node.name === 'active').map(toBoolean()).select(node => node.value === true)</code>
            </div>
          </v-card-text>
        </v-card>
        
        <!-- Migration Guide -->
        <v-card variant="outlined" class="mt-4">
          <v-card-title class="text-subtitle-1">
            Migration from Node Targeting
          </v-card-title>
          <v-card-text class="text-body-2">
            <div class="mb-2">
              <strong>Before (with built-in targeting):</strong><br>
              <code class="text-caption">map(toBoolean({ nodeNames: ['active', 'enabled'] }))</code>
            </div>
            <div class="mb-2">
              <strong>After (explicit filtering):</strong><br>
              <code class="text-caption">filter(node => ['active', 'enabled'].includes(node.name)).map(toBoolean())</code>
            </div>
            <div class="mb-2">
              <strong>Benefits:</strong><br>
              - Pure functions: predictable, testable transforms<br>
              - Explicit intent: clear separation of filtering and transforming<br>
              - Composable: easily chain operations<br>
              - Simpler: no complex option handling within transforms
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
const { isValidPipeline } = storeToRefs(pipelineStore);

// Generated fluent API code
const fluentApiCode = computed(() => {
  return pipelineStore.generateFluentAPI();
});

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