<!-- components/configs/SelectConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-textarea
          v-model="localOptions.predicate"
          label="Select Predicate"
          hint="Function that determines which nodes to collect"
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
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="text-caption mt-3"
        >
          <strong>Example predicates:</strong><br>
          - <code>node => node.name === 'price'</code><br>
          - <code>node => node.attributes?.id?.startsWith('user')</code><br>
          - <code>node => node.value && parseInt(node.value) > 100</code>
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
          The <code>select()</code> operation collects matching nodes into a flat list, without preserving
          hierarchy. This is useful for extracting specific nodes for processing. The results are 
          placed in a container element.
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
          Unlike <code>filter()</code>, <code>select()</code> doesn't maintain document hierarchy. It 
          collects only the matching nodes directly, removing their context in the document.
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
      predicate: 'node => node.name === "example"'
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  predicate: props.value.predicate || 'node => node.name === "example"'
});

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    localOptions.predicate = newValue.predicate || 'node => node.name === "example"';
  }
}, { deep: true });
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>