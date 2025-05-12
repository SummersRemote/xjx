<!-- components/TransformManager.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Transform Pipeline
      <v-spacer></v-spacer>
      <v-btn 
        color="error" 
        variant="text" 
        density="comfortable" 
        :disabled="transforms.length === 0"
        @click="clearTransformers"
      >
        Clear All
      </v-btn>
    </v-card-title>
    
    <v-card-text>
      <!-- Add Transform Controls -->
      <v-row>
        <v-col cols="12" sm="8">
          <v-select
            v-model="selectedTransformer"
            :items="transformerItems"
            label="Add Transformer"
            item-title="text"
            item-value="value"
            density="comfortable"
            variant="outlined"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="4">
          <v-btn
            color="primary"
            block
            @click="addTransformer"
            :disabled="!selectedTransformer"
          >
            Add Transform
          </v-btn>
        </v-col>
      </v-row>
      
      <!-- Empty State -->
      <v-row v-if="transforms.length === 0">
        <v-col cols="12" class="text-center">
          <v-alert
            type="info"
            variant="tonal"
            class="mb-0"
          >
            <div class="text-center">
              No transforms added. Add a transform to start building your pipeline.
            </div>
          </v-alert>
        </v-col>
      </v-row>
      
      <!-- Transform Pipeline -->
      <div v-else>
        <v-list 
          lines="three"
          class="transform-list bg-grey-lighten-5 rounded mt-2"
        >
          <v-list-item v-for="(element, index) in transforms" :key="element.id">
            <template v-slot:prepend>
              <v-icon class="handle me-2">mdi-drag-horizontal-variant</v-icon>
            </template>
            
            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title class="py-1">
                  <strong>{{ index + 1 }}. {{ element.type }}</strong>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <BooleanTransformConfig
                    v-if="element.type === 'BooleanTransform'"
                    :value="element.options"
                    @update="updateTransformerOptions(element.id, $event)"
                  />
                  <NumberTransformConfig
                    v-else-if="element.type === 'NumberTransform'"
                    :value="element.options"
                    @update="updateTransformerOptions(element.id, $event)"
                  />
                  <RegexTransformConfig
                    v-else-if="element.type === 'RegexTransform'"
                    :value="element.options"
                    @update="updateTransformerOptions(element.id, $event)"
                  />
                  <div v-else class="pa-2">
                    No configuration available for this transform type.
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            
            <template v-slot:append>
              <div class="d-flex align-center">
                <v-btn 
                  icon="mdi-arrow-up" 
                  size="small"
                  variant="text"
                  class="me-1"
                  :disabled="index === 0"
                  @click.stop="moveTransformer(element.id, 'up')" 
                ></v-btn>
                <v-btn 
                  icon="mdi-arrow-down" 
                  size="small"
                  variant="text"
                  class="me-1"
                  :disabled="index === transforms.length - 1"
                  @click.stop="moveTransformer(element.id, 'down')" 
                ></v-btn>
                <v-btn 
                  icon="mdi-delete" 
                  size="small"
                  color="error"
                  variant="text"
                  @click.stop="removeTransformer(element.id)"
                ></v-btn>
              </div>
            </template>
            <v-divider v-if="index < transforms.length - 1"></v-divider>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTransformStore } from '../stores/transformStore';
import { useAPIStore } from '../stores/apiStore';
import { storeToRefs } from 'pinia';

// Import transform configuration components
import BooleanTransformConfig from './transforms/BooleanTransformConfig.vue';
import NumberTransformConfig from './transforms/NumberTransformConfig.vue';
import RegexTransformConfig from './transforms/RegexTransformConfig.vue';

const transformStore = useTransformStore();
const apiStore = useAPIStore();
const { transforms, availableTransformers } = storeToRefs(transformStore);

const selectedTransformer = ref('');

// Create items for the transformer select
const transformerItems = computed(() => {
  return Object.keys(availableTransformers.value).map(key => ({
    text: key,
    value: key
  }));
});

// Add a new transformer
const addTransformer = () => {
  if (!selectedTransformer.value) return;
  
  const defaultOptions = getDefaultOptions(selectedTransformer.value);
  transformStore.addTransform(selectedTransformer.value, defaultOptions);
  apiStore.updateFluentAPI();
  selectedTransformer.value = '';
};

// Remove a transformer
const removeTransformer = (id) => {
  transformStore.removeTransform(id);
  apiStore.updateFluentAPI();
};

// Move a transformer up or down
const moveTransformer = (id, direction) => {
  transformStore.moveTransform(id, direction);
  apiStore.updateFluentAPI();
};

// Update transformer options
const updateTransformerOptions = (id, options) => {
  transformStore.updateTransform(id, options);
  apiStore.updateFluentAPI();
};

// Clear all transformers
const clearTransformers = () => {
  transformStore.clearTransforms();
  apiStore.updateFluentAPI();
};

// Get default options for each transformer type
const getDefaultOptions = (type) => {
  switch (type) {
    case 'BooleanTransform':
      return {
        trueValues: ['true', 'yes', '1', 'on'],
        falseValues: ['false', 'no', '0', 'off'],
        ignoreCase: true
      };
    case 'NumberTransform':
      return {
        integers: true,
        decimals: true,
        scientific: true,
        strictParsing: true,
        decimalSeparator: '.',
        thousandsSeparator: ','
      };
    case 'RegexTransform':
      return {
        pattern: '',
        replacement: ''
      };
    default:
      return {};
  }
};

onMounted(() => {
  apiStore.updateFluentAPI();
});
</script>

<style scoped>
.cursor-move {
  cursor: move;
}
.transform-list {
  border: 1px solid #e0e0e0;
}
</style>