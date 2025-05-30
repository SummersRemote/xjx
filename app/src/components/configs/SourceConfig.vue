<!-- components/configs/SourceConfig.vue - Updated with collapsible hooks and help at bottom -->
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
            Applied to raw source before parsing - supports multi-transform pipelines
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
    <v-expansion-panels variant="accordion" class="mb-3">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-check" size="small" class="me-2"></v-icon>
          After Transform Hook
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="text-caption text-medium-emphasis mb-2">
            Applied to parsed XNode structure - supports multi-transform pipelines
          </div>
          <TransformerConfig
            :value="localOptions.afterTransform"
            context="xnode"
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
            <strong>Source Operations with Multi-Transform Hooks:</strong><br>
            - <em>fromXml</em>: Parse XML string into XNode structure<br>
            - <em>fromJson</em>: Parse JSON object into XNode structure<br>
            - <em>fromXnode</em>: Use existing XNode array as source<br>
            <br>
            <strong>Hook Timing:</strong><br>
            <span class="text-primary">Before Transform</span>: Applied to raw source (string/object) before parsing<br>
            <span class="text-success">After Transform</span>: Applied to parsed XNode after conversion<br>
            <br>
            <strong>Multi-Transform Hook Examples:</strong><br>
            - <em>Before Transform</em>: XML preprocessing pipeline (regex cleanup → custom validation)<br>
            - <em>After Transform</em>: XNode enrichment pipeline (add metadata → boolean flags → custom processing)
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
        selectedTransforms: [],
        transformOrder: [],
        globalNodeNames: [],
        globalSkipNodes: [],
        transforms: {}
      },
      afterTransform: {
        selectedTransforms: [],
        transformOrder: [],
        globalNodeNames: [],
        globalSkipNodes: [],
        transforms: {}
      }
    })
  }
});

const emit = defineEmits(['update']);

// Get default transform config structure
function getDefaultTransformConfig() {
  return {
    selectedTransforms: [],
    transformOrder: [],
    globalNodeNames: [],
    globalSkipNodes: [],
    transforms: {
      toBoolean: {
        trueValues: ['true', 'yes', '1', 'on'],
        falseValues: ['false', 'no', '0', 'off'],
        ignoreCase: true
      },
      toNumber: {
        precision: undefined,
        decimalSeparator: '.',
        thousandsSeparator: ',',
        integers: true,
        decimals: true,
        scientific: true
      },
      regex: {
        pattern: '',
        replacement: ''
      },
      custom: {
        customTransformer: ''
      }
    }
  };
}

// Create a local reactive copy of the props
const localOptions = reactive({
  beforeTransform: { 
    ...getDefaultTransformConfig(),
    ...(props.value.beforeTransform || {})
  },
  afterTransform: { 
    ...getDefaultTransformConfig(),
    ...(props.value.afterTransform || {})
  }
});

// Update before transform hook
const updateBeforeTransform = (options) => {
  localOptions.beforeTransform = { ...getDefaultTransformConfig(), ...options };
  updateOptions();
};

// Update after transform hook
const updateAfterTransform = (options) => {
  localOptions.afterTransform = { ...getDefaultTransformConfig(), ...options };
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
        ...getDefaultTransformConfig(),
        ...(newValue.beforeTransform || {})
      },
      afterTransform: { 
        ...getDefaultTransformConfig(),
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