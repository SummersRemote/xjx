<!-- components/configs/GetConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-text-field
          v-model.number="localOptions.index"
          label="Index"
          type="number"
          min="0"
          hint="Index of the node to select (0-based)"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-switch
          v-model="localOptions.unwrap"
          label="Unwrap Node"
          hint="Remove the node from its container"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-switch>
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
          <strong>Get Operation:</strong><br>
          Retrieves a specific node by index from the current selection's children.<br>
          - <code>index</code>: Position of the node to retrieve (0-based)<br>
          - <code>unwrap</code>: If true, returns the node directly; otherwise, keeps it in a container
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-lightbulb-outline"
          class="text-caption mt-3"
        >
          <strong>Tip:</strong> Use <code>select()</code> before <code>get()</code> to collect nodes matching
          a criteria, then pick a specific one:<br>
          <code>select(node => node.name === 'user').get(0, true)</code>
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
      index: 0,
      unwrap: false
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  index: props.value.index !== undefined ? props.value.index : 0,
  unwrap: props.value.unwrap !== undefined ? props.value.unwrap : false
});

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    localOptions.index = newValue.index !== undefined ? newValue.index : 0;
    localOptions.unwrap = newValue.unwrap !== undefined ? newValue.unwrap : false;
  }
}, { deep: true });
</script>