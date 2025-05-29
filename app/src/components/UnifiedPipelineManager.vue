<!-- components/UnifiedPipelineManager.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-pipe" class="me-2"></v-icon>
      Fluent API Pipeline
      <v-spacer></v-spacer>
      <v-btn 
        color="error" 
        variant="text" 
        density="comfortable" 
        @click="resetPipeline"
      >
        Reset
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
            :disabled="!isValidOperationSelection"
          >
            Add Operation
          </v-btn>
        </v-col>
      </v-row>
      
      <!-- Pipeline Validation Alert -->
      <v-alert
        v-if="!isValidPipeline"
        type="warning"
        variant="tonal"
        class="mt-4"
        icon="mdi-alert"
      >
        <div class="font-weight-bold">Invalid Pipeline</div>
        <div class="text-caption">
          Pipeline must start with a source operation (fromXml, fromJson) and end with an output operation (toXml, toJson, etc.)
        </div>
      </v-alert>
      
      <!-- Pipeline Steps -->
      <div class="mt-4">
        <v-list 
          lines="three"
          class="pipeline-list bg-grey-lighten-5 rounded"
        >
          <v-list-item 
            v-for="(step, index) in steps" 
            :key="step.id"
            class="pipeline-step"
          >
            <template v-slot:prepend>
              <v-avatar
                :color="getStepColor(step.type)"
                size="small"
                class="me-3"
              >
                <span class="text-caption font-weight-bold">{{ index + 1 }}</span>
              </v-avatar>
            </template>

            <v-list-item-title class="d-flex align-center">
              <v-chip
                :color="getCategoryColor(step.type)"
                size="small"
                class="me-2"
              >
                {{ getCategoryLabel(step.type) }}
              </v-chip>
              <strong>{{ getOperationName(step.type) }}</strong>
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ getOperationDescription(step.type) }}
            </v-list-item-subtitle>

            <!-- Step Configuration -->
            <div v-if="hasConfiguration(step.type)" class="mt-2">
              <v-expansion-panels variant="accordion">
                <v-expansion-panel>
                  <v-expansion-panel-title class="text-caption">
                    Configuration
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <component 
                      :is="getConfigComponent(step.type)"
                      :value="step.options"
                      @update="updateStepOptions(step.id, $event)"
                    />
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>

            <template v-slot:append>
              <div class="d-flex align-center">
                <v-btn 
                  icon="mdi-arrow-up" 
                  size="small"
                  variant="text"
                  class="me-1"
                  :disabled="index === 0"
                  @click.stop="moveStep(step.id, 'up')" 
                ></v-btn>
                <v-btn 
                  icon="mdi-arrow-down" 
                  size="small"
                  variant="text"
                  class="me-1"
                  :disabled="index === steps.length - 1"
                  @click.stop="moveStep(step.id, 'down')" 
                ></v-btn>
                <v-btn 
                  icon="mdi-delete" 
                  size="small"
                  color="error"
                  variant="text"
                  @click.stop="removeStep(step.id)"
                ></v-btn>
              </div>
            </template>
            
            <v-divider v-if="index < steps.length - 1" class="mt-2"></v-divider>
          </v-list-item>
        </v-list>
      </div>

    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePipelineStore } from '../stores/pipelineStore';
import { storeToRefs } from 'pinia';

// Import configuration components
import FilterConfig from './configs/FilterConfig.vue';
import MapConfig from './configs/MapConfig.vue';
import SelectConfig from './configs/SelectConfig.vue';
import ReduceConfig from './configs/ReduceConfig.vue';
import SourceConfig from './configs/SourceConfig.vue';

const pipelineStore = usePipelineStore();
const { 
  steps, 
  availableOperations,
  isValidPipeline,
  sourceOperations,
  functionalOperations,
  outputOperations
} = storeToRefs(pipelineStore);

const selectedOperation = ref(null);

// Check if the selected operation is valid
const isValidOperationSelection = computed(() => {
  return selectedOperation.value && 
         selectedOperation.value.value &&
         !selectedOperation.value.header && 
         !selectedOperation.value.divider;
});

// Create operation items for dropdown grouped by category
const operationItems = computed(() => {
  const items = [];
  
  // Source operations
  items.push({ header: 'Source Operations' });
  sourceOperations.value.forEach(op => {
    items.push({
      text: op.name,
      value: op.value,
      title: op.name,
      subtitle: op.description
    });
  });
  
  // Functional operations
  items.push({ divider: true });
  items.push({ header: 'Functional Operations' });
  functionalOperations.value.forEach(op => {
    items.push({
      text: op.name,
      value: op.value,
      title: op.name,
      subtitle: op.description
    });
  });
  
  // Output operations
  items.push({ divider: true });
  items.push({ header: 'Output Operations' });
  outputOperations.value.forEach(op => {
    items.push({
      text: op.name,
      value: op.value,
      title: op.name,
      subtitle: op.description
    });
  });
  
  return items;
});

// Helper functions
const getOperationName = (type) => {
  return availableOperations.value[type]?.name || type;
};

const getOperationDescription = (type) => {
  return availableOperations.value[type]?.description || '';
};

const getCategoryColor = (type) => {
  const category = availableOperations.value[type]?.category;
  switch (category) {
    case 'source': return 'blue';
    case 'functional': return 'purple';
    case 'output': return 'green';
    default: return 'grey';
  }
};

const getCategoryLabel = (type) => {
  const category = availableOperations.value[type]?.category;
  switch (category) {
    case 'source': return 'SRC';
    case 'functional': return 'FUNC';
    case 'output': return 'OUT';
    default: return 'OP';
  }
};

const getStepColor = (type) => {
  const category = availableOperations.value[type]?.category;
  switch (category) {
    case 'source': return 'blue';
    case 'functional': return 'purple';  
    case 'output': return 'green';
    default: return 'grey';
  }
};

const hasConfiguration = (type) => {
  return ['fromXml', 'fromJson', 'fromXnode', 'filter', 'map', 'select', 'reduce'].includes(type);
};

const getConfigComponent = (type) => {
  switch (type) {
    case 'fromXml':
    case 'fromJson':
    case 'fromXnode':
      return SourceConfig;
    case 'filter': return FilterConfig;
    case 'map': return MapConfig;
    case 'select': return SelectConfig;
    case 'reduce': return ReduceConfig;
    default: return null;
  }
};

// Actions
const addOperation = () => {
  if (!isValidOperationSelection.value) return;
  
  const operationType = selectedOperation.value.value;
  pipelineStore.addStep(operationType);
  selectedOperation.value = null;
};

const removeStep = (id) => {
  pipelineStore.removeStep(id);
};

const updateStepOptions = (id, options) => {
  pipelineStore.updateStep(id, options);
};

const moveStep = (id, direction) => {
  pipelineStore.moveStep(id, direction);
};

const resetPipeline = () => {
  pipelineStore.clearSteps();
};
</script>

<style scoped>
.pipeline-list {
  border: 1px solid #e0e0e0;
}

.pipeline-step {
  border-left: 4px solid transparent;
}

.pipeline-step:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.api-code {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.4;
  border: 1px solid #e0e0e0;
  max-height: 400px;
  overflow-y: auto;
}
</style>