<!-- components/configs/TransformConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-select
          v-model="transformType"
          :items="transformerItems"
          label="Transform Type"
          density="comfortable"
          variant="outlined"
          @update:model-value="changeTransformType"
        ></v-select>
      </v-col>
    </v-row>
    
    <!-- Render the appropriate transform configuration component based on type -->
    <v-row dense>
      <v-col cols="12">
        <BooleanTransformConfig
          v-if="transformType === 'BooleanTransform'"
          :value="localOptions.options"
          @update="updateTransformerOptions"
        />
        <NumberTransformConfig
          v-else-if="transformType === 'NumberTransform'"
          :value="localOptions.options"
          @update="updateTransformerOptions"
        />
        <RegexTransformConfig
          v-else-if="transformType === 'RegexTransform'"
          :value="localOptions.options"
          @update="updateTransformerOptions"
        />
        <div v-else class="pa-2">
          No configuration available for this transform type.
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';

// Import transform configuration components
import BooleanTransformConfig from '../transforms/BooleanTransformConfig.vue';
import NumberTransformConfig from '../transforms/NumberTransformConfig.vue';
import RegexTransformConfig from '../transforms/RegexTransformConfig.vue';
import XJXService from '../../services/xjxService';

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      type: 'BooleanTransform',
      options: {}
    })
  }
});

const emit = defineEmits(['update']);

// Get available transformers
const availableTransformers = XJXService.getAvailableTransformers();

// Create transformer select items
const transformerItems = Object.keys(availableTransformers).map(key => ({
  title: key,
  value: key
}));

// Track current transform type
const transformType = ref(props.value.type || 'BooleanTransform');

// Create a local reactive copy of the props
const localOptions = reactive({
  type: props.value.type || 'BooleanTransform',
  options: { ...props.value.options } || {}
});

// Change transform type
const changeTransformType = (type) => {
  localOptions.type = type;
  // Get default options for the new type
  localOptions.options = XJXService.getDefaultOptions(type);
  updateOptions();
};

// Update transformer options
const updateTransformerOptions = (options) => {
  localOptions.options = options;
  updateOptions();
};

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    transformType.value = newValue.type || 'BooleanTransform';
    localOptions.type = newValue.type || 'BooleanTransform';
    localOptions.options = { ...newValue.options } || {};
  }
}, { deep: true });

// Initialize with default options if empty
onMounted(() => {
  if (!props.value.options || Object.keys(props.value.options).length === 0) {
    localOptions.options = XJXService.getDefaultOptions(transformType.value);
    updateOptions();
  }
});
</script>