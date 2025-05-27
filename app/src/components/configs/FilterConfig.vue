<!-- components/configs/FilterConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-textarea
          v-model="localOptions.predicate"
          label="Filter Predicate"
          hint="Function that determines if a node should be kept"
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
          - <code>node => node.name === 'user'</code> (keep users)<br>
          - <code>node => node.attributes?.active !== 'false'</code> (keep active elements)<br>
          - <code>node => node.name !== 'comment'</code> (remove comments)
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
          The <code>filter()</code> operation keeps nodes matching the predicate and preserves
          document hierarchy. Ancestors of matching nodes are kept to maintain structure.
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