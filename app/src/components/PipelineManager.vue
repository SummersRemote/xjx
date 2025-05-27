<!-- components/PipelineManager.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Functional Pipeline
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
              <v-list-item v-else v-bind="props">
                <template v-slot:subtitle>
                  {{ item.raw.subtitle }}
                </template>
              </v-list-item>
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
      
      <!-- Pipeline Help Section -->
      <v-expansion-panels class="mt-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon icon="mdi-help-circle-outline" class="me-2"></v-icon>
              <span>Pipeline Operations Help</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-tabs v-model="activeHelpTab">
              <v-tab value="functional">Functional Operations</v-tab>
              <v-tab value="transform">Transformations</v-tab>
              <v-tab value="composition">Function Composition</v-tab>
            </v-tabs>
            
            <v-window v-model="activeHelpTab" class="mt-2">
              <!-- Functional Operations Help -->
              <v-window-item value="functional">
                <div class="text-subtitle-1 mb-2">Functional Operations</div>
                <v-list density="compact" lines="two" class="bg-grey-lighten-5 rounded">
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-chip color="primary" size="small">select()</v-chip>
                    </template>
                    <v-list-item-title>Select Nodes</v-list-item-title>
                    <v-list-item-subtitle>Collect nodes matching predicate into a flat list (without hierarchy)</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-chip color="primary" size="small">filter()</v-chip>
                    </template>
                    <v-list-item-title>Filter Nodes</v-list-item-title>
                    <v-list-item-subtitle>Keep nodes matching predicate (maintains document hierarchy)</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-chip color="primary" size="small">map()</v-chip>
                    </template>
                    <v-list-item-title>Transform Nodes</v-list-item-title>
                    <v-list-item-subtitle>Apply transformation to every node (return null to remove)</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-chip color="primary" size="small">reduce()</v-chip>
                    </template>
                    <v-list-item-title>Reduce/Aggregate Nodes</v-list-item-title>
                    <v-list-item-subtitle>Calculate a single value from all nodes (terminal operation)</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-chip color="primary" size="small">slice()</v-chip>
                    </template>
                    <v-list-item-title>Slice Nodes</v-list-item-title>
                    <v-list-item-subtitle>Select nodes by position using Python-like array slicing</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-chip color="primary" size="small">unwrap()</v-chip>
                    </template>
                    <v-list-item-title>Unwrap Container</v-list-item-title>
                    <v-list-item-subtitle>Remove container element and promote its children</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-window-item>
              
              <!-- Transformations Help -->
              <v-window-item value="transform">
                <div class="text-subtitle-1 mb-2">Value Transformations</div>
                <v-list density="compact" lines="two" class="bg-grey-lighten-5 rounded">
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-chip color="success" size="small">Boolean</v-chip>
                    </template>
                    <v-list-item-title>Boolean Transform</v-list-item-title>
                    <v-list-item-subtitle>Convert between string values and booleans (e.g., "true" ↔ true)</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-chip color="success" size="small">Number</v-chip>
                    </template>
                    <v-list-item-title>Number Transform</v-list-item-title>
                    <v-list-item-subtitle>Convert between string values and numbers (e.g., "123.45" ↔ 123.45)</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-chip color="success" size="small">Regex</v-chip>
                    </template>
                    <v-list-item-title>Regex Transform</v-list-item-title>
                    <v-list-item-subtitle>Apply regular expression replacements to string values</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
                
                <div class="text-caption mt-3">
                  <strong>Tip:</strong> Transforms can be targeted to specific nodes by using <code>select()</code> or <code>filter()</code> operations first.
                  Each transform can also be configured to apply to node values, attributes, or both.
                </div>
              </v-window-item>
              
              <!-- Function Composition Help -->
              <v-window-item value="composition">
                <div class="text-subtitle-1 mb-2">Function Composition Examples</div>
                
                <p class="text-body-2 mb-1"><strong>Combining operations with map():</strong></p>
                <pre class="code-example">map(compose(
  // Select only price nodes
  node => node.name === 'price' ? node : null,
  // Convert to number with 2 decimal places
  toNumber({ precision: 2 }),
  // Apply discount
  node => {
    if (!node) return null;
    node.value = node.value * 0.9; // 10% discount
    return node;
  }
))</pre>

                <p class="text-body-2 mb-1 mt-3"><strong>Boolean conversion with targeting:</strong></p>
                <pre class="code-example">map(compose(
  // Select only boolean fields
  node => node.name === 'active' || node.name === 'available' ? node : null,
  // Convert to boolean
  toBoolean()
))</pre>

                <p class="text-body-2 mb-1 mt-3"><strong>Filtering and transformation:</strong></p>
                <pre class="code-example">select(node => node.name === 'price')
  .filter(node => node.attributes?.currency === 'USD')
  .map(node => {
    node.value = parseFloat(node.value) * 0.9; // 10% discount
    return node;
  })</pre>
              </v-window-item>
            </v-window>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
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
const activeHelpTab = ref('functional');

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
  items.push({ header: 'Core Operations' });
  
  // Add regular items for functional operations
  Object.entries(pipelineStore.availableOperations)
    .filter(([_, op]) => op.category === 'functional')
    .forEach(([value, op]) => {
      items.push({ 
        text: op.name, 
        value: value,
        title: op.name,
        subtitle: op.description
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
        value: value,
        title: op.name,
        subtitle: op.description
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

.code-example {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  margin-bottom: 8px;
}
</style>