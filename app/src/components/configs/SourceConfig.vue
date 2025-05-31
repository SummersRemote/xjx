<!-- components/configs/SourceConfig.vue - Simplified for source/output context -->
<template>
  <v-container>
    <!-- Before Transform Hook Configuration -->
    <v-expansion-panels variant="accordion" class="mb-3">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-play" size="small" class="me-2"></v-icon>
          Before Transform Hook
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="text-caption text-medium-emphasis mb-2">
            Applied to raw source before parsing - only custom functions available
          </div>
          <TransformerConfig
            :value="localOptions.beforeTransform"
            context="source"
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
          After Transform Hook
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="text-caption text-medium-emphasis mb-2">
            Applied to parsed XNode structure - only custom functions available
          </div>
          <TransformerConfig
            :value="localOptions.afterTransform"
            context="source"
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
            <strong>Source Operations with Custom Hooks:</strong><br>
            - <em>fromXml</em>: Parse XML string into XNode structure<br>
            - <em>fromJson</em>: Parse JSON object into XNode structure<br>
            - <em>fromXnode</em>: Use existing XNode array as source<br>
            <br>
            <strong>Hook Timing:</strong><br>
            <span class="text-primary">Before Transform</span>: Applied to raw source (string/object) before parsing<br>
            <span class="text-success">After Transform</span>: Applied to parsed XNode after conversion<br>
            <br>
            <strong>Custom Function Examples:</strong><br>
            - <em>Before Transform</em>: XML preprocessing (source validation, cleanup)<br>
            - <em>After Transform</em>: XNode enrichment (add metadata, modify structure)<br>
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
        customTransformer: 'source => source'
      },
      afterTransform: {
        customTransformer: 'xnode => xnode'
      }
    })
  }
});

const emit = defineEmits(['update']);

// Get default transform config structure for source context
function getDefaultSourceTransformConfig() {
  return {
    customTransformer: 'source => source'
  };
}

function getDefaultXNodeTransformConfig() {
  return {
    customTransformer: 'xnode => xnode'
  };
}

// Create a local reactive copy of the props
const localOptions = reactive({
  beforeTransform: { 
    ...getDefaultSourceTransformConfig(),
    ...(props.value.beforeTransform || {})
  },
  afterTransform: { 
    ...getDefaultXNodeTransformConfig(),
    ...(props.value.afterTransform || {})
  }
});

// Update before transform hook
const updateBeforeTransform = (options) => {
  localOptions.beforeTransform = { ...getDefaultSourceTransformConfig(), ...options };
  updateOptions();
};

// Update after transform hook
const updateAfterTransform = (options) => {
  localOptions.afterTransform = { ...getDefaultXNodeTransformConfig(), ...options };
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
        ...getDefaultSourceTransformConfig(),
        ...(newValue.beforeTransform || {})
      },
      afterTransform: { 
        ...getDefaultXNodeTransformConfig(),
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