<!-- components/configs/ReduceConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-textarea
          v-model="localOptions.reducer"
          label="Reducer Function"
          hint="Function that accumulates values from nodes"
          persistent-hint
          auto-grow
          rows="5"
          class="font-mono"
          @update:model-value="updateOptions"
        ></v-textarea>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-text-field
          v-model="localOptions.initialValue"
          label="Initial Value"
          hint="Starting value for the accumulator"
          persistent-hint
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-text-field
          v-model="localOptions.fragmentRoot"
          label="Fragment Root (Optional)"
          hint="Container element name for results"
          persistent-hint
          @update:model-value="updateOptions"
        ></v-text-field>
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
          <strong>Example reducer functions:</strong><br>
          - <code>(acc, node) => acc + 1</code> (Count nodes)<br>
          - <code>(acc, node) => acc + (parseFloat(node.value) || 0)</code> (Sum values)<br>
          - <code>(acc, node) => [...acc, node.name]</code> (Collect names in array)
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="warning"
          variant="tonal"
          density="compact"
          icon="mdi-alert"
          class="text-caption mt-3"
        >
          <strong>Note:</strong> The <code>reduce()</code> operation is a terminal operation and ends the processing chain.
          Make sure to use it as the last operation in your pipeline.
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
          <strong>Initial Value Examples:</strong><br>
          - <code>0</code> for numeric accumulation<br>
          - <code>[]</code> for collecting values in an array<br>
          - <code>{}</code> for building an object<br>
          - <code>""</code> for string concatenation
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      reducer: '(acc, node) => {\n  // Accumulate values\n  return acc + 1;\n}',
      initialValue: '0',
      fragmentRoot: ''
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  reducer: props.value.reducer || '(acc, node) => {\n  // Accumulate values\n  return acc + 1;\n}',
  initialValue: props.value.initialValue || '0',
  fragmentRoot: props.value.fragmentRoot || ''
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
    localOptions.fragmentRoot = newValue.fragmentRoot || '';
  }
}, { deep: true });
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>