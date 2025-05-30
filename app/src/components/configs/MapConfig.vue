<!-- components/configs/MapConfig.vue -->
<template>
  <v-container>
    <!-- Before Transform Hook Configuration -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">Before Transform Hook</div>
        <TransformerConfig
          :value="localOptions.beforeTransform"
          context="transformer"
          @update="updateBeforeTransform"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-4"></v-divider>
    
    <!-- Main Transform Hook Configuration -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">Main Transform Hook</div>
        <TransformerConfig
          :value="localOptions.transform"
          context="transformer"
          @update="updateTransform"
        />
      </v-col>
    </v-row>
    
    <v-divider class="my-4"></v-divider>
    
    <!-- After Transform Hook Configuration -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">After Transform Hook</div>
        <TransformerConfig
          :value="localOptions.afterTransform"
          context="transformer"
          @update="updateAfterTransform"
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
          <strong>Map Operation with Transform Hooks:</strong><br>
          Apply transformations to every node in the document using a three-phase lifecycle.
          Return <code>null</code> from any transformer to remove nodes.
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
          <strong>Transform Hook Processing Order:</strong><br>
          1. <em>Before Transform</em>: Applied to each node before main transformation<br>
          2. <em>Main Transform</em>: Primary transformation logic for each node<br>
          3. <em>After Transform</em>: Applied to each node after main transformation<br>
          <br>
          All hooks are optional and use the same transformer functions throughout the system.
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
      transform: {
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
  transform: { 
    transformType: props.value.transform?.transformType || null,
    transformOptions: { ...props.value.transform?.transformOptions } || {},
    customTransformer: props.value.transform?.customTransformer || ''
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

// Update main transform hook
const updateTransform = (options) => {
  localOptions.transform = { ...options };
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
      transform: { 
        transformType: newValue.transform?.transformType || null,
        transformOptions: { ...newValue.transform?.transformOptions } || {},
        customTransformer: newValue.transform?.customTransformer || ''
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