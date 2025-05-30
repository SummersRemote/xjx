<!-- components/configs/SourceConfig.vue -->
<template>
  <v-container>
    <!-- Before Callback Configuration -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">Before Callback</div>
        <TransformerConfig
          :value="localOptions.beforeCallback"
          context="callback"
          @update="updateBeforeCallback"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-4"></v-divider>
    
    <!-- After Callback Configuration -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">After Callback</div>
        <TransformerConfig
          :value="localOptions.afterCallback"
          context="callback"
          @update="updateAfterCallback"
        />
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
          <strong>Source Operations:</strong><br>
          - <em>fromXml</em>: Parse XML string into XNode structure<br>
          - <em>fromJson</em>: Parse JSON object into XNode structure<br>
          - <em>fromXnode</em>: Use existing XNode array as source<br>
          <br>
          <strong>Callback Functions:</strong><br>
          Optional transformer functions called during node processing. Same transformers work as both callbacks and in map() operations.
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-code-braces"
          class="text-caption mt-3"
        >
          <strong>Callback Processing:</strong><br>
          - <em>Before Callback</em>: Applied to each node before processing<br>
          - <em>After Callback</em>: Applied to each node after processing<br>
          - Both use the same transformer functions as map() operations<br>
          - Return new node or void/undefined to keep original
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
      beforeCallback: {
        transformType: null,
        transformOptions: {},
        customTransformer: ''
      },
      afterCallback: {
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
  beforeCallback: { 
    transformType: props.value.beforeCallback?.transformType || null,
    transformOptions: { ...props.value.beforeCallback?.transformOptions } || {},
    customTransformer: props.value.beforeCallback?.customTransformer || ''
  },
  afterCallback: { 
    transformType: props.value.afterCallback?.transformType || null,
    transformOptions: { ...props.value.afterCallback?.transformOptions } || {},
    customTransformer: props.value.afterCallback?.customTransformer || ''
  }
});

// Update before callback
const updateBeforeCallback = (options) => {
  localOptions.beforeCallback = { ...options };
  updateOptions();
};

// Update after callback
const updateAfterCallback = (options) => {
  localOptions.afterCallback = { ...options };
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
      beforeCallback: { 
        transformType: newValue.beforeCallback?.transformType || null,
        transformOptions: { ...newValue.beforeCallback?.transformOptions } || {},
        customTransformer: newValue.beforeCallback?.customTransformer || ''
      },
      afterCallback: { 
        transformType: newValue.afterCallback?.transformType || null,
        transformOptions: { ...newValue.afterCallback?.transformOptions } || {},
        customTransformer: newValue.afterCallback?.customTransformer || ''
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