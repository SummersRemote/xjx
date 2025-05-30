<!-- components/UnifiedPipelineManager.vue - Refactored with simplified controls -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-pipe" class="me-2"></v-icon>
      Fluent API Pipeline
      <v-spacer></v-spacer>
      
      <!-- Execute Button -->
      <v-btn
        color="success"
        variant="elevated"
        prepend-icon="mdi-play"
        :disabled="!isValidPipeline || isProcessing"
        :loading="isProcessing"
        @click="executePipeline"
        class="me-2"
      >
        Execute
      </v-btn>
      
      <!-- Pipeline Hooks Toggle -->
      <v-btn
        :color="enablePipelineHooks ? 'primary' : 'grey'"
        variant="outlined"
        density="compact"
        @click="togglePipelineHooks"
        class="me-2"
      >
        <v-icon :icon="enablePipelineHooks ? 'mdi-hook' : 'mdi-hook-off'" class="me-1"></v-icon>
        Pipeline Hooks
      </v-btn>
      
      <v-btn 
        color="error" 
        variant="text" 
        density="compact" 
        @click="resetPipeline"
      >
        Reset
      </v-btn>
    </v-card-title>
    
    <!-- Pipeline Hooks Configuration -->
    <v-expand-transition>
      <v-card-text v-show="enablePipelineHooks" class="pt-0">
        <v-card variant="outlined" color="primary" class="mb-4">
          <v-card-title class="text-subtitle-1">
            <v-icon icon="mdi-cog" class="me-1"></v-icon>
            Pipeline Hooks Configuration
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="pipelineHookOptions.logSteps"
                  label="Log Steps"
                  density="compact"
                  hide-details
                  @update:model-value="updatePipelineHooks"
                ></v-switch>
              </v-col>
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="pipelineHookOptions.logTiming"
                  label="Log Timing"
                  density="compact"
                  hide-details
                  @update:model-value="updatePipelineHooks"
                ></v-switch>
              </v-col>
            </v-row>
            <v-alert
              type="info"
              variant="text"
              density="compact"
              class="mt-2"
            >
              Pipeline hooks provide logging and timing across all operations.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-expand-transition>
    
    <v-card-text>
      <!-- Pipeline Validation Alert -->
      <v-alert
        v-if="!isValidPipeline"
        type="warning"
        variant="tonal"
        class="mb-4"
        icon="mdi-alert"
      >
        <div class="font-weight-bold">Incomplete Pipeline</div>
        <div class="text-caption">
          Select both source and output operations to create a valid pipeline.
        </div>
      </v-alert>
      
      <!-- Fixed Source Row -->
      <v-card variant="outlined" class="mb-3" color="blue">
        <v-card-title class="text-subtitle-1 pa-3 d-flex align-center">
          <v-chip color="blue" size="small" class="me-2">SOURCE</v-chip>
          
          <!-- Source Selection (replaces title text) -->
          <v-select
            :model-value="sourceOperation.type"
            :items="sourceOperations"
            item-title="name"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 200px"
            @update:model-value="updateSourceOperation"
          ></v-select>
          
          <v-spacer></v-spacer>
          
          <!-- Add Below Button -->
          <v-btn
            color="primary"
            variant="outlined"
            size="small"
            prepend-icon="mdi-plus"
            @click="addFunctionalStep('filter', 0)"
          >
            Add Below
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pt-0">
          <v-expand-transition>
            <div v-if="sourceOperation.type">
              <SourceConfig
                :value="sourceOperation.options"
                @update="updateSourceOptions"
              />
            </div>
          </v-expand-transition>
        </v-card-text>
      </v-card>
      
      <!-- Dynamic Functional Steps -->
      <div v-for="(step, index) in functionalSteps" :key="step.id" class="mb-3">
        <v-card variant="outlined" color="purple">
          <v-card-title class="text-subtitle-1 pa-3 d-flex align-center">
            <v-chip color="purple" size="small" class="me-2">{{ index + 1 }}</v-chip>
            
            <!-- Operation Type Selector -->
            <v-select
              :model-value="step.type"
              :items="functionalOperationItems"
              item-title="name"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 200px"
              @update:model-value="changeStepType(step.id, $event)"
            ></v-select>
            
            <v-spacer></v-spacer>
            
            <!-- Step Controls -->
            <div class="d-flex align-center gap-2">
              <!-- Add Above Button -->
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                prepend-icon="mdi-plus"
                @click="addFunctionalStep('filter', index)"
              >
                Add Above
              </v-btn>
              
              <!-- Add Below Button -->
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                prepend-icon="mdi-plus"
                @click="addFunctionalStep('filter', index + 1)"
              >
                Add Below
              </v-btn>
              
              <!-- Move Up -->
              <v-btn 
                icon="mdi-arrow-up" 
                size="small"
                variant="text"
                :disabled="index === 0"
                @click="moveFunctionalStep(step.id, 'up')" 
              ></v-btn>
              
              <!-- Move Down -->
              <v-btn 
                icon="mdi-arrow-down" 
                size="small"
                variant="text"
                :disabled="index === functionalSteps.length - 1"
                @click="moveFunctionalStep(step.id, 'down')" 
              ></v-btn>
              
              <!-- Delete -->
              <v-btn 
                icon="mdi-delete" 
                size="small"
                color="error"
                variant="text"
                @click="removeFunctionalStep(step.id)"
              ></v-btn>
            </div>
          </v-card-title>
          
          <v-card-text class="pt-0">
            <component 
              :is="getConfigComponent(step.type)"
              :value="step.options"
              @update="updateFunctionalStepOptions(step.id, $event)"
            />
          </v-card-text>
        </v-card>
      </div>
      
      <!-- Fixed Output Row -->
      <v-card variant="outlined" color="green">
        <v-card-title class="text-subtitle-1 pa-3 d-flex align-center">
          <v-chip color="green" size="small" class="me-2">OUTPUT</v-chip>
          
          <!-- Output Selection (replaces title text) -->
          <v-select
            :model-value="outputOperation.type"
            :items="outputOperations"
            item-title="name"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 200px"
            @update:model-value="updateOutputOperation"
          ></v-select>
          
          <v-spacer></v-spacer>
          
          <!-- Add Above Button -->
          <v-btn
            color="primary"
            variant="outlined"
            size="small"
            prepend-icon="mdi-plus"
            @click="addFunctionalStep('filter', functionalSteps.length)"
          >
            Add Above
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pt-0">
          <v-expand-transition>
            <div v-if="outputOperation.type">
              <SourceConfig
                :value="outputOperation.options"
                @update="updateOutputOptions"
              />
            </div>
          </v-expand-transition>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
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
  sourceOperation,
  outputOperation,
  functionalSteps,
  availableOperations,
  isValidPipeline,
  functionalOperations,
  outputOperations,
  enablePipelineHooks,
  pipelineHookOptions,
  isProcessing
} = storeToRefs(pipelineStore);

// Source operations for the fixed source row
const sourceOperations = [
  { name: 'From XML', value: 'fromXml' },
  { name: 'From JSON', value: 'fromJson' },
  { name: 'From XNode', value: 'fromXnode' }
];

// Functional operations with toXnode included
const functionalOperationItems = [
  ...functionalOperations.value,
  { name: 'To XNode', value: 'toXnode', description: 'Convert to XNode array' }
];

// Helper functions
const getOperationName = (type) => {
  return availableOperations.value[type]?.name || type;
};

const getConfigComponent = (type) => {
  switch (type) {
    case 'filter': return FilterConfig;
    case 'map': return MapConfig;
    case 'select': return SelectConfig;
    case 'reduce': return ReduceConfig;
    default: return null;
  }
};

// Actions
const updateSourceOperation = (type) => {
  pipelineStore.updateSourceOperation(type);
};

const updateOutputOperation = (type) => {
  pipelineStore.updateOutputOperation(type);
};

const updateSourceOptions = (options) => {
  pipelineStore.updateSourceOperation(sourceOperation.value.type, options);
};

const updateOutputOptions = (options) => {
  pipelineStore.updateOutputOperation(outputOperation.value.type, options);
};

const changeStepType = (stepId, newType) => {
  const step = functionalSteps.value.find(s => s.id === stepId);
  if (step) {
    // Get default options for the new type
    const defaultOptions = pipelineStore.getDefaultOptions(newType);
    pipelineStore.updateFunctionalStep(stepId, { ...defaultOptions, type: newType });
    
    // Update the step type
    step.type = newType;
  }
};

const addFunctionalStep = (type, position) => {
  pipelineStore.addFunctionalStep(type, position);
};

const removeFunctionalStep = (id) => {
  pipelineStore.removeFunctionalStep(id);
};

const updateFunctionalStepOptions = (id, options) => {
  pipelineStore.updateFunctionalStep(id, options);
};

const moveFunctionalStep = (id, direction) => {
  pipelineStore.moveFunctionalStep(id, direction);
};

const resetPipeline = () => {
  pipelineStore.resetPipeline();
};

const togglePipelineHooks = () => {
  pipelineStore.enablePipelineHooks = !pipelineStore.enablePipelineHooks;
};

const updatePipelineHooks = () => {
  pipelineStore.updatePipelineHooks(pipelineHookOptions.value);
};

const executePipeline = async () => {
  try {
    await pipelineStore.executePipeline();
  } catch (err) {
    console.error('Failed to execute pipeline:', err);
  }
};
</script>

<style scoped>
.v-card {
  border-left: 4px solid transparent;
}

.v-card:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.gap-2 {
  gap: 8px;
}
</style>