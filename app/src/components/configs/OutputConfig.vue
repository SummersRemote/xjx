<!-- components/configs/OutputConfig.vue - Correctly labeled for output operations -->
<template>
  <v-container>
    <!-- Before Transform Hook Configuration -->
    <v-expansion-panels variant="accordion" class="mb-3">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-play" size="small" class="me-2"></v-icon>
          Before Transform Hook (Optional)
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="text-caption text-medium-emphasis mb-2">
            Applied to XNode before conversion to output format - XNode → XNode
          </div>
          <TransformerConfig
            :value="localOptions.beforeTransform"
            context="output"
            @update="updateBeforeTransform"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    
    <!-- After Transform Hook Configuration -->
    <v-expansion-panels variant="accordion" class="mb-4">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-check" size="small" class="me-2"></v-icon>
          After Transform Hook (Optional)
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="text-caption text-medium-emphasis mb-2">
            Applied to final output after conversion - Output → Output
          </div>
          <TransformerConfig
            :value="localOptions.afterTransform"
            context="output"
            @update="updateAfterTransform"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Help Section -->
    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-help-circle" size="small" class="me-2"></v-icon>
          Help
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-alert type="info" variant="text" density="compact">
            <strong>Output Operations with Custom Hooks:</strong><br>
            - <em>toXml</em>: Convert XNode structure to XML DOM Document<br>
            - <em>toXmlString</em>: Convert XNode structure to XML string<br>
            - <em>toJson</em>: Convert XNode structure to JSON object<br>
            - <em>toJsonString</em>: Convert XNode structure to JSON string<br>
            - <em>toXnode</em>: Convert to XNode array (for chaining)<br>
            <br>
            <strong>Hook Timing:</strong><br>
            <span class="text-primary">Before Transform</span>: Applied to XNode before conversion (XNode → XNode)<br>
            <span class="text-success">After Transform</span>: Applied to final output after conversion (Output → Output)<br>
            <br>
            <strong>Custom Function Examples:</strong><br>
            - <em>Before Transform</em>: XNode enrichment (<code>xnode => ({ ...xnode, version: '1.0' })</code>)<br>
            - <em>After Transform</em>: Output post-processing (<code>output => output.replace(/\n\s*\n/g, '\n')</code>)<br>
            <br>
            <strong>For Built-in Transforms:</strong><br>
            Use <code>map()</code> operations for boolean, number, and regex transforms that work with individual nodes.
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup>
import { reactive, watch } from 'vue';
import TransformerConfig from './TransformerConfig.vue';

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      beforeTransform: {
        customTransformer: 'xnode => xnode'
      },
      afterTransform: {
        customTransformer: 'output => output'
      }
    })
  }
});

const emit = defineEmits(['update']);

// Get default transform config structure for output context
function getDefaultXNodeTransformConfig() {
  return {
    customTransformer: 'xnode => xnode'
  };
}

function getDefaultOutputTransformConfig() {
  return {
    customTransformer: 'output => output'
  };
}

// Create a local reactive copy of the props
const localOptions = reactive({
  beforeTransform: { 
    ...getDefaultXNodeTransformConfig(),
    ...(props.value.beforeTransform || {})
  },
  afterTransform: { 
    ...getDefaultOutputTransformConfig(),
    ...(props.value.afterTransform || {})
  }
});

// Update before transform hook
const updateBeforeTransform = (options) => {
  localOptions.beforeTransform = { ...getDefaultXNodeTransformConfig(), ...options };
  updateOptions();
};

// Update after transform hook
const updateAfterTransform = (options) => {
  localOptions.afterTransform = { ...getDefaultOutputTransformConfig(), ...options };
  updateOptions();
};

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    Object.assign(localOptions, {
      beforeTransform: { 
        ...getDefaultXNodeTransformConfig(),
        ...(newValue.beforeTransform || {})
      },
      afterTransform: { 
        ...getDefaultOutputTransformConfig(),
        ...(newValue.afterTransform || {})
      }
    });
  }
}, { deep: true });
</script>

<style scoped>
.text-subtitle-2 {
  font-weight: 600;
  color: #1976D2;
}
</style>