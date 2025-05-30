<!-- components/configs/SourceConfig.vue - Updated for new hook system -->
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
            Applied to raw source before parsing
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
            Applied to parsed XNode structure
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
          <strong>Source Operations with Hooks:</strong><br>
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
          <strong>Common Use Cases:</strong><br>
          - <em>Before Transform</em>: Source validation, preprocessing, format conversion<br>
          - <em>After Transform</em>: Add metadata, inject timestamps, modify structure<br>
          <br>
          <strong>Example:</strong> beforeTransform validates XML, afterTransform adds processing timestamp
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
        transformType: null,
        transformOptions: {},
        customTransformer: ''
      },
      afterTransform: {
        transformType: null,
        transformOptions: {},
        customTransformer: ''
      }
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  beforeTransform: { 
    transformType: props.value.beforeTransform?.transformType || null,
    transformOptions: { ...props.value.beforeTransform?.transformOptions } || {},
    customTransformer: props.value.beforeTransform?.customTransformer || ''
  },
  afterTransform: { 
    transformType: props.value.afterTransform?.transformType || null,
    transformOptions: { ...props.value.afterTransform?.transformOptions } || {},
    customTransformer: props.value.afterTransform?.customTransformer || ''
  }
});

// Update before transform hook
const updateBeforeTransform = (options) => {
  localOptions.beforeTransform = { ...options };
  updateOptions();
};

// Update after transform hook
const updateAfterTransform = (options) => {
  localOptions.afterTransform = { ...options };
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
        transformType: newValue.beforeTransform?.transformType || null,
        transformOptions: { ...newValue.beforeTransform?.transformOptions } || {},
        customTransformer: newValue.beforeTransform?.customTransformer || ''
      },
      afterTransform: { 
        transformType: newValue.afterTransform?.transformType || null,
        transformOptions: { ...newValue.afterTransform?.transformOptions } || {},
        customTransformer: newValue.afterTransform?.customTransformer || ''
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