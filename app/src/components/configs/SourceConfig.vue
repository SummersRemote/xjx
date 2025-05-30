<!-- components/configs/SourceConfig.vue - Updated for multi-transform support -->
<template>
  <v-container>
    <!-- Before Transform Hook Configuration -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">
          <v-icon icon="mdi-play" size="small" class="me-1"></v-icon>
          Before Transform Hook
        </div>
        <v-card variant="outlined" class="pa-3">
          <div class="text-caption text-medium-emphasis mb-2">
            Applied to raw source before parsing - supports multi-transform pipelines
          </div>
          <TransformerConfig
            :value="localOptions.beforeTransform"
            context="source"
            @update="updateBeforeTransform"
          />
        </v-card>
      </v-col>
    </v-row>
    
    <v-divider class="my-4"></v-divider>
    
    <!-- After Transform Hook Configuration -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">
          <v-icon icon="mdi-check" size="small" class="me-1"></v-icon>
          After Transform Hook
        </div>
        <v-card variant="outlined" class="pa-3">
          <div class="text-caption text-medium-emphasis mb-2">
            Applied to parsed XNode structure - supports multi-transform pipelines
          </div>
          <TransformerConfig
            :value="localOptions.afterTransform"
            context="xnode"
            @update="updateAfterTransform"
          />
        </v-card>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="text-caption mt-3"
        >
          <strong>Source Operations with Multi-Transform Hooks:</strong><br>
          - <em>fromXml</em>: Parse XML string into XNode structure<br>
          - <em>fromJson</em>: Parse JSON object into XNode structure<br>
          - <em>fromXnode</em>: Use existing XNode array as source<br>
          <br>
          <strong>Hook Timing:</strong><br>
          <span class="text-primary">Before Transform</span>: Applied to raw source (string/object) before parsing<br>
          <span class="text-success">After Transform</span>: Applied to parsed XNode after conversion
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="success"
          variant="tonal"
          density="compact"
          icon="mdi-lightbulb-outline"
          class="text-caption mt-3"
        >
          <strong>Multi-Transform Hook Examples:</strong><br>
          - <em>Before Transform</em>: XML preprocessing pipeline (regex cleanup → custom validation)<br>
          - <em>After Transform</em>: XNode enrichment pipeline (add metadata → boolean flags → custom processing)<br>
          <br>
          <strong>Example:</strong> beforeTransform validates XML format, afterTransform adds processing timestamps and converts flags
        </v-alert>
      </v-col>
    </v-row>
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