<!-- components/configs/BranchConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-textarea
          v-model="localOptions.predicate"
          label="Branch Predicate"
          hint="Function that determines which nodes to include in branch scope"
          persistent-hint
          auto-grow
          rows="3"
          density="compact"
          variant="outlined"
          class="font-mono"
          @update:model-value="updateOptions"
        ></v-textarea>
      </v-col>
    </v-row>

    <!-- Help Section -->
    <v-expansion-panels variant="accordion" class="mt-4">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-help-circle" size="small" class="me-2"></v-icon>
          Help
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-alert type="info" variant="text" density="compact">
            <strong>Branch Operation:</strong><br>
            The <code>branch()</code> operation creates an isolated scope containing nodes that match
            the predicate. Operations within the branch only affect the selected subset.<br>
            <br>
            <strong>Example predicates:</strong><br>
            - <code>node => node.name === 'price'</code> (branch price nodes)<br>
            - <code>node => node.attributes?.type === 'currency'</code> (branch by attribute)<br>
            - <code>node => node.value && parseFloat(node.value) > 100</code> (branch by value)<br>
            <br>
            <strong>Usage Pattern:</strong><br>
            1. Use <code>branch(predicate)</code> to create isolated scope<br>
            2. Apply operations (map, filter, select) within the branch<br>
            3. Use <code>merge()</code> to integrate changes back to parent document<br>
            <br>
            <strong>Note:</strong> Terminal operations within a branch return only the branch scope.
            Use <code>merge()</code> first to get the full document with changes.
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