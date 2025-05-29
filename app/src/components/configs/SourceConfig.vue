<!-- components/configs/SourceConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-switch
          v-model="enableCallbacks"
          label="Enable Callback Functions"
          hide-details
          density="compact"
          @update:model-value="updateCallbacks"
        ></v-switch>
      </v-col>
    </v-row>
    
    <div v-if="enableCallbacks">
      <v-row dense class="mt-2">
        <v-col cols="12">
          <v-textarea
            v-model="localOptions.beforeFn"
            label="Before Function (optional)"
            hint="Function called before processing each node"
            persistent-hint
            auto-grow
            rows="3"
            class="font-mono"
            @update:model-value="updateOptions"
          ></v-textarea>
        </v-col>
      </v-row>
      
      <v-row dense>
        <v-col cols="12">
          <v-textarea
            v-model="localOptions.afterFn"
            label="After Function (optional)"
            hint="Function called after processing each node"
            persistent-hint
            auto-grow
            rows="3"
            class="font-mono"
            @update:model-value="updateOptions"
          ></v-textarea>
        </v-col>
      </v-row>
    </div>
    
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
          Optional functions that are called during node processing for debugging or custom handling.
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense v-if="enableCallbacks">
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-code-braces"
          class="text-caption mt-3"
        >
          <strong>Example callback functions:</strong><br>
          - <code>node => console.log('Processing:', node.name)</code><br>
          - <code>node => { if (node.name === 'debug') debugger; }</code><br>
          - <code>node => node.metadata = { processed: new Date() }</code>
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      beforeFn: '',
      afterFn: ''
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  beforeFn: props.value.beforeFn || '',
  afterFn: props.value.afterFn || ''
});

// Separate toggle state for callbacks
const enableCallbacks = ref(!!(props.value.beforeFn || props.value.afterFn));

// Update callbacks state
const updateCallbacks = (enabled) => {
  enableCallbacks.value = enabled;
  if (!enabled) {
    // When disabling, clear both callback functions
    localOptions.beforeFn = '';
    localOptions.afterFn = '';
    updateOptions();
  } else {
    // When enabling, set a default example if both are empty
    if (!localOptions.beforeFn.trim() && !localOptions.afterFn.trim()) {
      localOptions.beforeFn = 'node => console.log("Processing:", node.name)';
    }
    updateOptions();
  }
};

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    Object.assign(localOptions, {
      beforeFn: newValue.beforeFn || '',
      afterFn: newValue.afterFn || ''
    });
    // Update toggle state based on whether any callbacks are present
    enableCallbacks.value = !!(newValue.beforeFn || newValue.afterFn);
  }
}, { deep: true });

// Watch for manual changes to callback functions
watch(localOptions, () => {
  // If both callbacks are manually cleared, disable the toggle
  if (!localOptions.beforeFn.trim() && !localOptions.afterFn.trim()) {
    enableCallbacks.value = false;
  }
}, { deep: true });
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>