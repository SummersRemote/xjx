<!-- components/configs/MapConfig.vue -->
<template>
  <v-container>
    <TransformerConfig
      :value="localOptions"
      context="transformer"
      @update="updateOptions"
    />
    
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="text-caption mt-3"
        >
          <strong>Map Operation:</strong><br>
          Apply transformations to every node in the document. Same transformers work in both map() and callback contexts.
          Return <code>null</code> from transformer to remove nodes.
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
      transformType: null,
      transformOptions: {},
      customTransformer: ''
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  transformType: props.value.transformType || null,
  transformOptions: { ...props.value.transformOptions } || {},
  customTransformer: props.value.customTransformer || ''
});

// Emit changes to the parent
const updateOptions = (options) => {
  Object.assign(localOptions, options);
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    Object.assign(localOptions, {
      transformType: newValue.transformType || null,
      transformOptions: { ...newValue.transformOptions } || {},
      customTransformer: newValue.customTransformer || ''
    });
  }
}, { deep: true });
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>