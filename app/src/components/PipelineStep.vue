<!-- components/PipelineStep.vue -->
<template>
  <div class="pipeline-step-wrapper">
    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title class="py-1">
          <div class="d-flex align-center">
            <v-chip
              size="small"
              :color="categoryColor"
              class="me-2"
            >
              {{ categoryLabel }}
            </v-chip>
            <strong>{{ index + 1 }}. {{ operationName }}</strong>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <!-- Render the appropriate configuration component based on operation type -->
          <component 
            :is="configComponent" 
            :value="step.options" 
            @update="updateOptions"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    
    <div class="control-buttons">
      <v-btn 
        icon="mdi-arrow-up" 
        size="small"
        variant="text"
        class="me-1"
        :disabled="isFirst"
        @click.stop="$emit('move', step.id, 'up')" 
      ></v-btn>
      <v-btn 
        icon="mdi-arrow-down" 
        size="small"
        variant="text"
        class="me-1"
        :disabled="isLast"
        @click.stop="$emit('move', step.id, 'down')" 
      ></v-btn>
      <v-btn 
        icon="mdi-delete" 
        size="small"
        color="error"
        variant="text"
        @click.stop="$emit('remove', step.id)"
      ></v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePipelineStore } from '../stores/pipelineStore';

// Import configuration components
import SelectConfig from './configs/SelectConfig.vue';
import FilterConfig from './configs/FilterConfig.vue';
import MapConfig from './configs/MapConfig.vue';
import ReduceConfig from './configs/ReduceConfig.vue';
import GetConfig from './configs/GetConfig.vue';
import TransformConfig from './configs/TransformConfig.vue';

const props = defineProps({
  step: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  isFirst: {
    type: Boolean,
    default: false
  },
  isLast: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update', 'remove', 'move']);

const pipelineStore = usePipelineStore();

// Get operation name from the store
const operationName = computed(() => {
  if (!props.step || !props.step.type) return 'Unknown Operation';
  return pipelineStore.availableOperations[props.step.type]?.name || props.step.type;
});

// Get category for styling
const operationCategory = computed(() => {
  if (!props.step || !props.step.type) return 'unknown';
  return pipelineStore.availableOperations[props.step.type]?.category || 'unknown';
});

// Category styling
const categoryColor = computed(() => {
  switch (operationCategory.value) {
    case 'functional': return 'primary';
    case 'transform': return 'success';
    default: return 'grey';
  }
});

// Category label
const categoryLabel = computed(() => {
  switch (operationCategory.value) {
    case 'functional': return 'FUNC';
    case 'transform': return 'TRANS';
    default: return 'OP';
  }
});

// Determine which configuration component to use
const configComponent = computed(() => {
  if (!props.step || !props.step.type) return null;
  
  switch (props.step.type) {
    case 'select': return SelectConfig;
    case 'filter': return FilterConfig;
    case 'map': return MapConfig;
    case 'reduce': return ReduceConfig;
    case 'get': return GetConfig;
    case 'transform': return TransformConfig;
    default: return null;
  }
});

// Update options and emit to parent
const updateOptions = (options) => {
  emit('update', props.step.id, options);
};
</script>

<style scoped>
.pipeline-step-wrapper {
  display: flex;
  width: 100%;
  align-items: flex-start;
}

.v-expansion-panels {
  flex-grow: 1;
}

.control-buttons {
  display: flex;
  align-items: center;
  margin-left: 12px;
}
</style>