<!-- components/configs/MapConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-textarea
          v-model="localOptions.mapper"
          label="Mapper Function"
          hint="Function that transforms each node"
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
          <strong>Example mapper functions:</strong><br>
          - <code>node => { node.value = node.value.toUpperCase(); return node; }</code><br>
          - <code>node => { node.attributes = { ...node.attributes, processed: 'true' }; return node; }</code><br>
          - <code>node => { node.name = 'mapped-' + node.name; return node; }</code>
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
          The <code>map()</code> operation transforms each node in the current selection using the mapper function.
          Your function should return the transformed node.
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
      mapper: 'node => {\n  // Transform the node\n  return node;\n}',
      fragmentRoot: ''
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  mapper: props.value.mapper || 'node => {\n  // Transform the node\n  return node;\n}',
  fragmentRoot: props.value.fragmentRoot || ''
});

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    localOptions.mapper = newValue.mapper || 'node => {\n  // Transform the node\n  return node;\n}';
    localOptions.fragmentRoot = newValue.fragmentRoot || '';
  }
}, { deep: true });
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>