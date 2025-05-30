<!-- components/UnifiedPipelineManager.vue - Redesigned with fixed source/output -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-pipe" class="me-2"></v-icon>
      Fluent API Pipeline
      <v-spacer></v-spacer>
      
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
          
          <!-- Add Below Menu -->
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                icon="mdi-plus"
                size="small"
                variant="text"
                v-bind="props"
              ></v-btn>
            </template>
            <v-list density="compact">
              <v-list-subheader>Add Below</v-list-subheader>
              <v-list-item
                v-for="op in functionalOperations"
                :key="op.value"
                @click="addFunctionalStep(op.value, 0)"
              >
                <v-list-item-title>{{ op.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ op.description }}</v-list-item-subtitle>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item @click="addFunctionalStep('toXnode', 0)">
                <v-list-item-title>To XNode</v-list-item-title>
                <v-list-item-subtitle>Convert to XNode array</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-menu>
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
            {{ getOperationName(step.type) }}
            <v-spacer></v-spacer>
            
            <!-- Step Controls -->
            <div class="d-flex align-center">
              <!-- Add Above Menu -->
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-plus-circle-outline"
                    size="small"
                    variant="text"
                    v-bind="props"
                    class="me-1"
                  ></v-btn>
                </template>
                <v-list density="compact">
                  <v-list-subheader>Add Above</v-list-subheader>
                  <v-list-item
                    v-for="op in functionalOperations"
                    :key="op.value"
                    @click="addFunctionalStep(op.value, index)"
                  >
                    <v-list-item-title>{{ op.name }}</v-list-item-title>
                  </v-list-item>
                  <v-divider></v-divider>
                  <v-list-item @click="addFunctionalStep('toXnode', index)">
                    <v-list-item-title>To XNode</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              
              <!-- Add Below Menu -->
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-plus-circle"
                    size="small"
                    variant="text"
                    v-bind="props"
                    class="me-1"
                  ></v-btn>
                </template>
                <v-list density="compact">
                  <v-list-subheader>Add Below</v-list-subheader>
                  <v-list-item
                    v-for="op in functionalOperations"
                    :key="op.value"
                    @click="addFunctionalStep(op.value, index + 1)"
                  >
                    <v-list-item-title>{{ op.name }}</v-list-item-title>
                  </v-list-item>
                  <v-divider></v-divider>
                  <v-list-item @click="addFunctionalStep('toXnode', index + 1)">
                    <v-list-item-title>To XNode</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              
              <!-- Move Up -->
              <v-btn 
                icon="mdi-arrow-up" 
                size="small"
                variant="text"
                class="me-1"
                :disabled="index === 0"
                @click="moveFunctionalStep(step.id, 'up')" 
              ></v-btn>
              
              <!-- Move Down -->
              <v-btn 
                icon="mdi-arrow-down" 
                size="small"
                variant="text"
                class="me-1"
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
          
          <!-- Add Above Menu -->
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                icon="mdi-plus"
                size="small"
                variant="text"
                v-bind="props"
              ></v-btn>
            </template>
            <v-list density="compact">
              <v-list-subheader>Add Above</v-list-subheader>
              <v-list-item
                v-for="op in functionalOperations"
                :key="op.value"
                @click="addFunctionalStep(op.value, -1)"
              >
                <v-list-item-title>{{ op.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ op.description }}</v-list-item-subtitle>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item @click="addFunctionalStep('toXnode', -1)">
                <v-list-item-title>To XNode</v-list-item-title>
                <v-list-item-subtitle>Convert to XNode array</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-menu>
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
  pipelineHookOptions
} = storeToRefs(pipelineStore);

// Source operations for the fixed source row
const sourceOperations = [
  { name: 'From XML', value: 'fromXml' },
  { name: 'From JSON', value: 'fromJson' },
  { name: 'From XNode', value: 'fromXnode' }
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
</script>

<style scoped>
.v-card {
  border-left: 4px solid transparent;
}

.v-card:hover {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>