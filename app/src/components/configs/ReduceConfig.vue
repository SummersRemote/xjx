<!-- components/configs/ReduceConfig.vue - Refactored with help at bottom -->
<template>
  <v-container>
    <!-- Initial Value Configuration -->
    <v-row dense>
      <v-col cols="12">
        <v-text-field
          v-model="localOptions.initialValue"
          label="Initial Value"
          hint="Starting value for the accumulator"
          persistent-hint
          density="compact"
          variant="outlined"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
    </v-row>
    
    <v-divider class="my-4"></v-divider>
    
    <!-- Reducer Function Configuration -->
    <v-row dense>
      <v-col cols="12">
        <v-textarea
          v-model="localOptions.reducer"
          label="Reducer Function"
          hint="Function that accumulates values from nodes: (accumulator, node) => newAccumulator"
          persistent-hint
          auto-grow
          rows="5"
          density="compact"
          variant="outlined"
          class="font-mono"
          @update:model-value="updateOptions"
        ></v-textarea>
      </v-col>
    </v-row>

    <!-- Help Section - Moved to bottom -->
    <v-expansion-panels variant="accordion" class="mt-4">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-help-circle" size="small" class="me-2"></v-icon>
          Help
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-alert type="info" variant="text" density="compact">
            <strong>Reduce Operation:</strong><br>
            The <code>reduce()</code> operation is a terminal operation and ends the processing chain.
            It returns the accumulated value directly instead of an XJX instance.<br>
            <br>
            <strong>Example reducer functions:</strong><br>
            - <code>(acc, node) => acc + 1</code> (Count nodes)<br>
            - <code>(acc, node) => node.name === 'price' ? acc + parseFloat(node.value || '0') : acc</code> (Sum prices)<br>
            - <code>(acc, node) => node.name === 'item' ? [...acc, node.attributes?.id] : acc</code> (Collect IDs in array)<br>
            <br>
            <strong>Initial Value Examples:</strong><br>
            - <code>0</code> for numeric accumulation<br>
            - <code>[]</code> for collecting values in an array<br>
            - <code>{}</code> for building an object<br>
            - <code>""</code> for string concatenation<br>
            <br>
            <strong>API:</strong> <code>reduce(initialValue, options?: TransformHooks)</code><br>
            The reducer function is passed via <code>options.transform</code> hook for consistency.
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      reducer: '(acc, node) => {\n  // Accumulate values\n  return acc + 1;\n}',
      initialValue: '0'
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  reducer: props.value.reducer || '(acc, node) => {\n  // Accumulate values\n  return acc + 1;\n}',
  initialValue: props.value.initialValue || '0'
});

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    localOptions.reducer = newValue.reducer || '(acc, node) => {\n  // Accumulate values\n  return acc + 1;\n}';
    localOptions.initialValue = newValue.initialValue || '0';
  }
}, { deep: true });
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>