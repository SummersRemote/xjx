<!-- components/configs/MapConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-textarea
          v-model="localOptions.transformer"
          label="Transformer Function"
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
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="text-caption mt-3"
        >
          <strong>Example transformers:</strong><br>
          - <code>node => node.name === 'price' ? {...node, value: parseFloat(node.value)} : node</code><br>
          - <code>node => node.name === 'available' ? {...node, value: node.value === 'true'} : node</code><br>
          - <code>node => node.name === 'comment' ? null : node</code> (remove comments)
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
          The <code>map()</code> operation transforms every node in the document. Return the modified node,
          or return <code>null</code> to remove the node from the document.
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-function"
          class="text-caption mt-3"
        >
          <strong>Using compose:</strong><br>
          You can use <code>compose()</code> to combine multiple transformations:<br>
          <code>compose(</code><br>
          <code>&nbsp;&nbsp;node => node.name === 'price' ? node : null,</code><br>
          <code>&nbsp;&nbsp;toNumber({precision: 2})</code><br>
          <code>)</code>
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
      transformer: 'node => {\n  // Transform the node\n  return node;\n}'
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  transformer: props.value.transformer || 'node => {\n  // Transform the node\n  return node;\n}'
});

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    localOptions.transformer = newValue.transformer || 'node => {\n  // Transform the node\n  return node;\n}';
  }
}, { deep: true });
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>