<!-- components/configs/MapConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-select
          v-model="transformMode"
          :items="transformModeItems"
          label="Transform Mode"
          density="compact"
          variant="outlined"
          @update:model-value="updateTransformMode"
        ></v-select>
      </v-col>
    </v-row>
    
    <!-- Value Transform Mode -->
    <div v-if="transformMode === 'valueTransform'">
      <v-row dense>
        <v-col cols="12">
          <v-select
            v-model="localOptions.transformType"
            :items="valueTransformItems"
            label="Value Transform"
            density="compact"
            variant="outlined"
            @update:model-value="updateOptions"
          ></v-select>
        </v-col>
      </v-row>
      
      <!-- Number Transform Options -->
      <div v-if="localOptions.transformType === 'toNumber'">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="localOptions.transformOptions.precision"
              label="Precision (decimal places)"
              type="number"
              min="0"
              max="10"
              density="compact"
              @update:model-value="updateOptions"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="localOptions.transformOptions.decimalSeparator"
              label="Decimal Separator"
              maxlength="1"
              density="compact"
              @update:model-value="updateOptions"
            ></v-text-field>
          </v-col>
        </v-row>
      </div>
      
      <!-- Boolean Transform Options -->
      <div v-if="localOptions.transformType === 'toBoolean'">
        <v-row dense>
          <v-col cols="12">
            <v-combobox
              v-model="localOptions.transformOptions.trueValues"
              label="True Values"
              multiple
              chips
              closable-chips
              density="compact"
              @update:model-value="updateOptions"
            ></v-combobox>
          </v-col>
          <v-col cols="12">
            <v-combobox
              v-model="localOptions.transformOptions.falseValues"
              label="False Values"
              multiple
              chips
              closable-chips
              density="compact"
              @update:model-value="updateOptions"
            ></v-combobox>
          </v-col>
        </v-row>
      </div>
      
      <!-- Regex Transform Options -->
      <div v-if="localOptions.transformType === 'regex'">
        <v-row dense>
          <v-col cols="12">
            <v-text-field
              v-model="localOptions.transformOptions.pattern"
              label="Pattern"
              placeholder="Enter regex pattern or /pattern/flags"
              density="compact"
              @update:model-value="updateOptions"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="localOptions.transformOptions.replacement"
              label="Replacement"
              placeholder="Replacement text"
              density="compact"
              @update:model-value="updateOptions"
            ></v-text-field>
          </v-col>
        </v-row>
      </div>
    </div>
    
    <!-- Custom Transform Mode -->
    <div v-if="transformMode === 'custom'">
      <v-row dense>
        <v-col cols="12">
          <v-textarea
            v-model="localOptions.customTransformer"
            label="Custom Transformer Function"
            hint="Function that transforms each node"
            persistent-hint
            auto-grow
            rows="4"
            class="font-mono"
            @update:model-value="updateOptions"
          ></v-textarea>
        </v-col>
      </v-row>
    </div>
    
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="text-caption mt-3"
        >
          <strong>Map Operation:</strong><br>
          - <em>Value Transform</em>: Apply toNumber(), toBoolean(), or regex() transforms to node values<br>
          - <em>Custom</em>: Write a custom transformer function that processes each node<br>
          - Return <code>null</code> from custom transformer to remove nodes
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense v-if="transformMode === 'custom'">
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-code-braces"
          class="text-caption mt-3"
        >
          <strong>Example transformers:</strong><br>
          - <code>node => node.name === 'price' ? {...node, value: parseFloat(node.value)} : node</code><br>
          - <code>node => node.name === 'comment' ? null : node</code> (remove comments)<br>
          - <code>node => ({...node, value: node.value?.toUpperCase()})</code> (uppercase values)
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      transformType: null,
      transformOptions: {},
      customTransformer: 'node => node'
    })
  }
});

const emit = defineEmits(['update']);

// Transform mode options
const transformModeItems = [
  { title: 'Value Transform', value: 'valueTransform' },
  { title: 'Custom Transformer', value: 'custom' }
];

// Value transform options
const valueTransformItems = [
  { title: 'Number Transform', value: 'toNumber' },
  { title: 'Boolean Transform', value: 'toBoolean' },
  { title: 'Regex Transform', value: 'regex' }
];

// Create a local reactive copy of the props
const localOptions = reactive({
  transformType: props.value.transformType || null,
  transformOptions: { ...props.value.transformOptions } || {},
  customTransformer: props.value.customTransformer || 'node => node'
});

// Determine current transform mode
const transformMode = computed({
  get() {
    return localOptions.transformType ? 'valueTransform' : 'custom';
  },
  set(value) {
    if (value === 'valueTransform') {
      if (!localOptions.transformType) {
        localOptions.transformType = 'toNumber';
        localOptions.transformOptions = getDefaultTransformOptions('toNumber');
      }
    } else {
      localOptions.transformType = null;
      localOptions.transformOptions = {};
    }
    updateOptions();
  }
});

// Update transform mode
const updateTransformMode = (mode) => {
  transformMode.value = mode;
};

// Get default options for transform types
const getDefaultTransformOptions = (type) => {
  switch (type) {
    case 'toNumber':
      return {
        precision: undefined,
        decimalSeparator: '.',
        thousandsSeparator: ','
      };
    case 'toBoolean':
      return {
        trueValues: ['true', 'yes', '1', 'on'],
        falseValues: ['false', 'no', '0', 'off'],
        ignoreCase: true
      };
    case 'regex':
      return {
        pattern: '',
        replacement: ''
      };
    default:
      return {};
  }
};

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    Object.assign(localOptions, {
      transformType: newValue.transformType || null,
      transformOptions: { ...newValue.transformOptions } || {},
      customTransformer: newValue.customTransformer || 'node => node'
    });
  }
}, { deep: true });

// Watch for transform type changes to update default options
watch(() => localOptions.transformType, (newType) => {
  if (newType && transformMode.value === 'valueTransform') {
    // Reset options to defaults for the new type
    localOptions.transformOptions = getDefaultTransformOptions(newType);
    updateOptions();
  }
});
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>