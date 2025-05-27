<!-- components/configs/SliceConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12" sm="4">
        <v-text-field
          v-model.number="localOptions.start"
          label="Start Index"
          type="number"
          hint="Starting index (inclusive)"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="4">
        <v-text-field
          v-model.number="localOptions.end"
          label="End Index"
          type="number"
          hint="Ending index (exclusive)"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="4">
        <v-text-field
          v-model.number="localOptions.step"
          label="Step"
          type="number"
          :rules="[v => v !== 0 || 'Step cannot be zero']"
          hint="Step value (cannot be zero)"
          persistent-hint
          density="compact"
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
          <strong>Python-like Slicing:</strong><br>
          - <code>start</code>: Starting index (inclusive, default: 0)<br>
          - <code>end</code>: Ending index (exclusive, default: length)<br>
          - <code>step</code>: Step value (default: 1, can be negative for reverse direction)<br>
          - Negative indices count from the end (-1 is the last element)
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
          The <code>slice()</code> operation selects nodes based on their position in the current selection,
          similar to array slicing in many programming languages.
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
      start: 0,
      end: undefined,
      step: 1
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  start: props.value.start !== undefined ? props.value.start : 0,
  end: props.value.end,
  step: props.value.step !== undefined ? props.value.step : 1
});

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    localOptions.start = newValue.start !== undefined ? newValue.start : 0;
    localOptions.end = newValue.end;
    localOptions.step = newValue.step !== undefined ? newValue.step : 1;
  }
}, { deep: true });
</script>