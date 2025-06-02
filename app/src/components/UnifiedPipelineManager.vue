<template>
  <v-card>
    <!-- Pipeline Title and Actions -->
    <v-card-title class="pa-3">
      <div class="d-flex align-center w-100">
        <!-- Title -->
        <div class="d-flex align-center">
          <v-icon icon="mdi-pipe" class="me-2"></v-icon>
          <span class="text-h6">Fluent API Pipeline</span>
        </div>
        
        <!-- Action Buttons - same line as title -->
        <div class="d-flex align-center ms-auto">
          <!-- Always visible Execute button -->
          <v-btn
            color="success"
            variant="elevated"
            :disabled="!isValidPipeline || isProcessing"
            :loading="isProcessing"
            @click="executePipeline"
            class="me-2"
          >
            <v-icon icon="mdi-play" class="me-1"></v-icon>
            <span class="d-none d-sm-inline">Execute</span>
          </v-btn>
          
          <!-- Desktop: Show all buttons -->
          <div class="d-none d-lg-flex align-center gap-2">
            <v-btn
              :color="enablePipelineHooks ? 'primary' : 'grey'"
              variant="outlined"
              @click="togglePipelineHooks"
            >
              <v-icon :icon="enablePipelineHooks ? 'mdi-hook' : 'mdi-hook-off'" class="me-1"></v-icon>
              Pipeline Hooks
            </v-btn>
            
            <v-btn
              color="primary"
              variant="outlined"
              @click="swapContent"
              :disabled="isProcessing"
            >
              <v-icon icon="mdi-swap-horizontal" class="me-1"></v-icon>
              Swap
            </v-btn>
            
            <v-btn 
              color="error" 
              variant="outlined" 
              @click="resetPipeline"
            >
              <v-icon icon="mdi-refresh" class="me-1"></v-icon>
              Reset
            </v-btn>
          </div>
          
          <!-- Mobile/Tablet: Overflow menu -->
          <div class="d-flex d-lg-none">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-dots-vertical"
                  variant="text"
                ></v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  :prepend-icon="enablePipelineHooks ? 'mdi-hook' : 'mdi-hook-off'"
                  :title="`Pipeline Hooks ${enablePipelineHooks ? '(On)' : '(Off)'}`"
                  @click="togglePipelineHooks"
                ></v-list-item>
                <v-list-item
                  prepend-icon="mdi-swap-horizontal"
                  title="Swap"
                  :disabled="isProcessing"
                  @click="swapContent"
                ></v-list-item>
                <v-list-item
                  prepend-icon="mdi-refresh"
                  title="Reset"
                  @click="resetPipeline"
                ></v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </div>
    </v-card-title>
    
    <!-- Pipeline Hooks Configuration - UPDATED with custom hooks -->
    <v-expand-transition>
      <v-card-text v-show="enablePipelineHooks" class="pt-0">
        <v-card variant="outlined" color="primary" class="mb-4">
          <v-card-title class="text-subtitle-1">
            <v-icon icon="mdi-cog" class="me-1"></v-icon>
            Pipeline Hooks Configuration
          </v-card-title>
          <v-card-text>
            <!-- Built-in Hook Options -->
            <div class="text-subtitle-2 mb-2">Built-in Hooks</div>
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
            
            <v-divider class="my-4"></v-divider>
            
            <!-- Custom Hook Functions -->
            <div class="text-subtitle-2 mb-3">Custom Hook Functions</div>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-textarea
                  v-model="pipelineHookOptions.customBeforeStep"
                  label="Custom Before Step Hook"
                  hint="Function called before each pipeline step: (stepName, input) => { ... }"
                  persistent-hint
                  auto-grow
                  rows="4"
                  density="compact"
                  variant="outlined"
                  class="font-mono"
                  @update:model-value="updatePipelineHooks"
                  placeholder="(stepName, input) => {
  console.log('Before:', stepName);
}"
                ></v-textarea>
              </v-col>
              <v-col cols="12" md="6">
                <v-textarea
                  v-model="pipelineHookOptions.customAfterStep"
                  label="Custom After Step Hook"
                  hint="Function called after each pipeline step: (stepName, output) => { ... }"
                  persistent-hint
                  auto-grow
                  rows="4"
                  density="compact"
                  variant="outlined"
                  class="font-mono"
                  @update:model-value="updatePipelineHooks"
                  placeholder="(stepName, output) => {
  console.log('After:', stepName);
}"
                ></v-textarea>
              </v-col>
            </v-row>
            
            <!-- Help and Info -->
            <v-expansion-panels variant="accordion" class="mt-4">
              <v-expansion-panel>
                <v-expansion-panel-title class="text-caption">
                  <v-icon icon="mdi-help-circle" size="small" class="me-2"></v-icon>
                  Pipeline Hooks Help
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-alert type="info" variant="text" density="compact">
                    <strong>Hook Composition:</strong><br>
                    Custom hooks compose with built-in hooks. All enabled hooks run in this order:<br>
                    1. Built-in timing hooks (if enabled)<br>
                    2. Built-in logging hooks (if enabled)<br>
                    3. Custom hooks (if provided)<br>
                    <br>
                    <strong>Function Signatures:</strong><br>
                    - <code>beforeStep: (stepName: string, input: any) => void</code><br>
                    - <code>afterStep: (stepName: string, output: any) => void</code><br>
                    <br>
                    <strong>Custom Hook Examples:</strong><br>
                    <em>Data Validation:</em><br>
                    <code>(stepName, input) => { if (!input) throw new Error('Invalid input'); }</code><br>
                    <br>
                    <em>Performance Monitoring:</em><br>
                    <code>(stepName, output) => { performance.mark(`${stepName}-end`); }</code><br>
                    <br>
                    <em>Debug Inspection:</em><br>
                    <code>(stepName, output) => { if (stepName === 'map') console.log('Mapped:', output); }</code><br>
                    <br>
                    <strong>Error Handling:</strong><br>
                    Errors in custom hooks are caught and logged as warnings, but won't stop pipeline execution.
                  </v-alert>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
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
      
      <!-- Pipeline Accordion -->
      <v-expansion-panels variant="accordion" class="pipeline-accordion">
        <!-- Source Panel -->
        <v-expansion-panel>
          <v-expansion-panel-title class="pipeline-panel-title">
            <div class="d-flex align-center w-100">
              <!-- Left side: Label and Operation Name -->
              <div class="d-flex align-center">
                <v-chip color="blue" size="small" class="me-2" variant="flat">SOURCE</v-chip>
                <span class="text-subtitle-2">{{ getOperationDisplayName(sourceOperation.type) }}</span>
              </div>
              
              <!-- Right side: Action Buttons -->
              <div class="d-flex align-center ms-auto">
                <!-- Desktop Action Buttons -->
                <div class="d-none d-md-flex align-center gap-1">
                  <v-btn
                    icon="mdi-plus"
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click.stop="addFunctionalStep('filter', 0)"
                  ></v-btn>
                </div>
                
                <!-- Mobile Three-Dot Menu -->
                <div class="d-flex d-md-none">
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-dots-vertical"
                        size="x-small"
                        variant="text"
                        @click.stop
                      ></v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item
                        prepend-icon="mdi-plus"
                        title="Add operation below"
                        @click="addFunctionalStep('filter', 0)"
                      ></v-list-item>
                    </v-list>
                  </v-menu>
                </div>
              </div>
            </div>
          </v-expansion-panel-title>
          
          <v-expansion-panel-text>
            <div class="panel-content">
              <!-- Source Type Selection -->
              <v-select
                :model-value="sourceOperation.type"
                :items="sourceOperations"
                item-title="name"
                item-value="value"
                label="Source Type"
                density="compact"
                variant="outlined"
                class="mb-3"
                @update:model-value="updateSourceOperation"
              ></v-select>
              
              <!-- Source Configuration -->
              <SourceConfig
                v-if="sourceOperation.type"
                :value="sourceOperation.options"
                @update="updateSourceOptions"
              />
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
        
        <!-- Functional Step Panels -->
        <v-expansion-panel
          v-for="(step, index) in functionalSteps"
          :key="step.id"
        >
          <v-expansion-panel-title class="pipeline-panel-title">
            <div class="d-flex align-center w-100">
              <!-- Left side: Step Number and Operation Name -->
              <div class="d-flex align-center">
                <v-chip color="purple" size="small" class="me-2" variant="flat">{{ index + 1 }}</v-chip>
                <span class="text-subtitle-2">{{ getOperationDisplayName(step.type) }}</span>
              </div>
              
              <!-- Right side: Action Buttons -->
              <div class="d-flex align-center ms-auto">
                <!-- Desktop Action Buttons -->
                <div class="d-none d-md-flex align-center gap-1">
                  <v-btn
                    icon="mdi-plus-circle-outline"
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click.stop="addFunctionalStep('filter', index)"
                  ></v-btn>
                  
                  <v-btn
                    icon="mdi-plus-circle"
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click.stop="addFunctionalStep('filter', index + 1)"
                  ></v-btn>
                  
                  <v-btn
                    icon="mdi-arrow-up"
                    size="x-small"
                    variant="text"
                    :disabled="index === 0"
                    @click.stop="moveFunctionalStep(step.id, 'up')"
                  ></v-btn>
              
                  <v-btn
                    icon="mdi-arrow-down"
                    size="x-small"
                    variant="text"
                    :disabled="index === functionalSteps.length - 1"
                    @click.stop="moveFunctionalStep(step.id, 'down')"
                  ></v-btn>
              
                  <v-btn
                    icon="mdi-delete"
                    size="x-small"
                    variant="text"
                    color="error"
                    @click.stop="removeFunctionalStep(step.id)"
                  ></v-btn>
                </div>
                
                <!-- Mobile Three-Dot Menu -->
                <div class="d-flex d-md-none">
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-dots-vertical"
                        size="x-small"
                        variant="text"
                        @click.stop
                      ></v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item
                        prepend-icon="mdi-plus-circle-outline"
                        title="Add operation above"
                        @click="addFunctionalStep('filter', index)"
                      ></v-list-item>
                      <v-list-item
                        prepend-icon="mdi-plus-circle"
                        title="Add operation below"
                        @click="addFunctionalStep('filter', index + 1)"
                      ></v-list-item>
                      <v-divider></v-divider>
                      <v-list-item
                        prepend-icon="mdi-arrow-up"
                        title="Move up"
                        :disabled="index === 0"
                        @click="moveFunctionalStep(step.id, 'up')"
                      ></v-list-item>
                      <v-list-item
                        prepend-icon="mdi-arrow-down"
                        title="Move down"
                        :disabled="index === functionalSteps.length - 1"
                        @click="moveFunctionalStep(step.id, 'down')"
                      ></v-list-item>
                      <v-divider></v-divider>
                      <v-list-item
                        prepend-icon="mdi-delete"
                        title="Remove operation"
                        class="text-error"
                        @click="removeFunctionalStep(step.id)"
                      ></v-list-item>
                    </v-list>
                  </v-menu>
                </div>
              </div>
            </div>
          </v-expansion-panel-title>
          
          <v-expansion-panel-text>
            <div class="panel-content">
              <!-- Operation Type Selection -->
              <v-select
                :model-value="step.type"
                :items="functionalOperationItems"
                item-title="name"
                item-value="value"
                label="Operation Type"
                density="compact"
                variant="outlined"
                class="mb-3"
                @update:model-value="changeStepType(step.id, $event)"
              ></v-select>
              
              <!-- Operation Configuration -->
              <component 
                :is="getConfigComponent(step.type)"
                v-if="getConfigComponent(step.type)"
                :value="step.options"
                @update="updateFunctionalStepOptions(step.id, $event)"
              />
              <div v-else class="text-caption text-medium-emphasis">
                No configuration available for this operation.
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
        
        <!-- Output Panel -->
        <v-expansion-panel>
          <v-expansion-panel-title class="pipeline-panel-title">
            <div class="d-flex align-center w-100">
              <!-- Left side: Label and Operation Name -->
              <div class="d-flex align-center">
                <v-chip color="green" size="small" class="me-2" variant="flat">OUTPUT</v-chip>
                <span class="text-subtitle-2">{{ getOperationDisplayName(outputOperation.type) }}</span>
              </div>
              
              <!-- Right side: Action Buttons -->
              <div class="d-flex align-center ms-auto">
                <!-- Desktop Action Buttons -->
                <div class="d-none d-md-flex align-center gap-1">
                  <v-btn
                    icon="mdi-plus"
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click.stop="addFunctionalStep('filter', functionalSteps.length)"
                  ></v-btn>
                </div>
                
                <!-- Mobile Three-Dot Menu -->
                <div class="d-flex d-md-none">
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-dots-vertical"
                        size="x-small"
                        variant="text"
                        @click.stop
                      ></v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item
                        prepend-icon="mdi-plus"
                        title="Add operation above"
                        @click="addFunctionalStep('filter', functionalSteps.length)"
                      ></v-list-item>
                    </v-list>
                  </v-menu>
                </div>
              </div>
            </div>
          </v-expansion-panel-title>
          
          <v-expansion-panel-text>
            <div class="panel-content">
              <!-- Output Type Selection -->
              <v-select
                :model-value="outputOperation.type"
                :items="outputOperations"
                item-title="name"
                item-value="value"
                label="Output Type"
                density="compact"
                variant="outlined"
                class="mb-3"
                @update:model-value="updateOutputOperation"
              ></v-select>
              
              <!-- Output Configuration -->
              <SourceConfig
                v-if="outputOperation.type"
                :value="outputOperation.options"
                @update="updateOutputOptions"
              />
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
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
import BranchConfig from './configs/BranchConfig.vue';
import MergeConfig from './configs/MergeConfig.vue';
import WithConfigConfig from './configs/WithConfigConfig.vue';
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

// Source operations for the selection dropdown
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
const getOperationDisplayName = (type) => {
  if (!type) return 'Select Operation';
  return availableOperations.value[type]?.name || type;
};

const getConfigComponent = (type) => {
  console.log('Getting config component for type:', type); // Debug log
  switch (type) {
    case 'filter': return FilterConfig;
    case 'map': return MapConfig;
    case 'select': return SelectConfig;
    case 'reduce': return ReduceConfig;
    case 'branch': return BranchConfig;
    case 'merge': return MergeConfig;
    case 'withConfig': 
      console.log('Returning WithConfigConfig component'); // Debug log
      return WithConfigConfig;
    default: 
      console.log('No component found for type:', type); // Debug log
      return null;
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
  console.log('Updating functional step options:', id, options); // Debug log
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

const swapContent = () => {
  pipelineStore.swapSourceResult();
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
.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}

.pipeline-accordion {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

.pipeline-panel-title {
  min-height: 48px !important;
}

.pipeline-panel-title :deep(.v-expansion-panel-title__overlay) {
  background-color: transparent;
}

.panel-content {
  padding-top: 8px;
}

/* Custom styling for panel titles */
.pipeline-accordion :deep(.v-expansion-panel-title) {
  padding: 12px 16px;
}

.pipeline-accordion :deep(.v-expansion-panel-text__wrapper) {
  padding: 0 16px 16px 16px;
}

/* Ensure action buttons don't trigger panel expansion */
.pipeline-panel-title :deep(.v-btn) {
  z-index: 1;
}

/* Mobile menu styling */
:deep(.v-list-item--disabled) {
  opacity: 0.5;
}

:deep(.v-list-item.text-error .v-list-item__prepend) {
  color: rgb(var(--v-theme-error));
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>