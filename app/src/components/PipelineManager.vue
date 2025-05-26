<!-- components/PipelineManager.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Operation Pipeline
      <v-spacer></v-spacer>
      <v-btn 
        color="error" 
        variant="text" 
        density="comfortable" 
        :disabled="steps.length === 0"
        @click="clearPipeline"
      >
        Clear All
      </v-btn>
    </v-card-title>
    
    <v-card-text>
      <!-- Add Operation Controls -->
      <v-row>
        <v-col cols="12" sm="8">
          <v-select
            v-model="selectedOperation"
            :items="operationItems"
            label="Add Operation"
            density="comfortable"
            variant="outlined"
            item-title="text"
            item-value="value"
            return-object
          >
            <template v-slot:item="{ item, props }">
              <v-list-subheader v-if="item.raw.header">{{ item.raw.header }}</v-list-subheader>
              <v-divider v-else-if="item.raw.divider" class="my-2"></v-divider>
              <v-list-item v-else v-bind="props"></v-list-item>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" sm="4">
          <v-btn
            color="primary"
            block
            @click="addOperation"
            :disabled="!isValidOperation"
          >
            Add Operation
          </v-btn>
        </v-col>
      </v-row>
      
      <!-- Empty State -->
      <v-row v-if="steps.length === 0">
        <v-col cols="12" class="text-center">
          <v-alert
            type="info"
            variant="tonal"
            class="mb-0"
          >
            <div class="text-center">
              No operations added. Add an operation to start building your pipeline.
            </div>
          </v-alert>
        </v-col>
      </v-row>
      
      <!-- Pipeline Steps -->
      <div v-else>
        <v-list 
          lines="three"
          class="pipeline-list bg-grey-lighten-5 rounded mt-2"
        >
          <v-list-item v-for="(step, index) in steps" :key="step.id">
            <PipelineStep 
              :step="step"
              :index="index"
              :is-first="index === 0"
              :is-last="index === steps.length - 1"
              @update="updateOperation"
              @remove="removeOperation"
              @move="moveOperation"
            />
            <v-divider v-if="index < steps.length - 1"></v-divider>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePipelineStore } from '../stores/pipelineStore';
import { useAPIStore } from '../stores/apiStore';
import { storeToRefs } from 'pinia';
import PipelineStep from './PipelineStep.vue';

const pipelineStore = usePipelineStore();
const apiStore = useAPIStore();
const { steps } = storeToRefs(pipelineStore);

const selectedOperation = ref(null);

// Check if the selected operation is valid (not a header or divider)
const isValidOperation = computed(() => {
  if (!selectedOperation.value) return false;
  return typeof selectedOperation.value === 'object' && 
         selectedOperation.value.value && 
         !selectedOperation.value.header && 
         !selectedOperation.value.divider;
});

// Create operation items for dropdown grouped by category
const operationItems = computed(() => {
  const items = [];
  
  // Functional operations group
  items.push({ header: 'Functional Operations' });
  
  // Add regular items for functional operations
  Object.entries(pipelineStore.availableOperations)
    .filter(([_, op]) => op.category === 'functional')
    .forEach(([value, op]) => {
      items.push({ 
        text: op.name, 
        value: value 
      });
    });
  
  // Axis operations group
  items.push({ divider: true });
  items.push({ header: 'Axis Navigation' });
  
  // Add regular items for axis operations
  Object.entries(pipelineStore.availableOperations)
    .filter(([_, op]) => op.category === 'axis')
    .forEach(([value, op]) => {
      items.push({ 
        text: op.name, 
        value: value 
      });
    });
  
  // Transform operations group
  items.push({ divider: true });
  items.push({ header: 'Value Transformations' });
  
  // Add regular items for transform operations
  Object.entries(pipelineStore.availableOperations)
    .filter(([_, op]) => op.category === 'transform')
    .forEach(([value, op]) => {
      items.push({ 
        text: op.name, 
        value: value 
      });
    });
  
  return items;
});

// Add a new operation
const addOperation = () => {
  if (!isValidOperation.value) return;
  
  const operationType = selectedOperation.value.value;
  const defaultOptions = pipelineStore.getDefaultOptions(operationType);
  
  pipelineStore.addStep(operationType, defaultOptions);
  apiStore.updateFluentAPI();
  selectedOperation.value = null;
};

// Remove an operation
const removeOperation = (id) => {
  pipelineStore.removeStep(id);
  apiStore.updateFluentAPI();
};

// Update an operation
const updateOperation = (id, options) => {
  pipelineStore.updateStep(id, options);
  apiStore.updateFluentAPI();
};

// Move an operation
const moveOperation = (id, direction) => {
  pipelineStore.moveStep(id, direction);
  apiStore.updateFluentAPI();
};

// Clear all operations
const clearPipeline = () => {
  pipelineStore.clearSteps();
  apiStore.updateFluentAPI();
};
</script>

<style scoped>
.pipeline-list {
  border: 1px solid #e0e0e0;
}
</style>