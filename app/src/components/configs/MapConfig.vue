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
    
    <!-- Node Transform Mode -->
    <div v-if="transformMode === 'nodeTransform'">
      <v-row dense>
        <v-col cols="12">
          <v-select
            v-model="localOptions.transformType"
            :items="nodeTransformItems"
            label="Node Transform"
            density="compact"
            variant="outlined"
            @update:model-value="updateOptions"
          ></v-select>
        </v-col>
      </v-row>
      
      <!-- Node Filtering Options -->
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-combobox
            v-model="localOptions.transformOptions.nodeNames"
            label="Transform Only These Nodes"
            hint="Leave empty to transform all nodes"
            persistent-hint
            multiple
            chips
            closable-chips
            density="compact"
            @update:model-value="updateOptions"
          ></v-combobox>
        </v-col>
        <v-col cols="12" sm="6">
          <v-combobox
            v-model="localOptions.transformOptions.skipNodes"
            label="Skip These Nodes"
            hint="Nodes to exclude from transformation"
            persistent-hint
            multiple
            chips
            closable-chips
            density="compact"
            @update:model-value="updateOptions"
          ></v-combobox>
        </v-col>
      </v-row>
      
      <!-- Boolean Transform Options -->
      <div v-if="localOptions.transformType === 'toBoolean'">
        <v-row dense>
          <v-col cols="12" sm="6">
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
          <v-col cols="12" sm="6">
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
        <v-row dense>
          <v-col cols="12">
            <v-switch
              v-model="localOptions.transformOptions.ignoreCase"
              label="Ignore Case"
              hide-details
              density="compact"
              @update:model-value="updateOptions"
            ></v-switch>
          </v-col>
        </v-row>
      </div>
      
      <!-- Number Transform Options -->
      <div v-if="localOptions.transformType === 'toNumber'">
        <v-row dense>
          <v-col cols="12" sm="4">
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
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="localOptions.transformOptions.decimalSeparator"
              label="Decimal Separator"
              maxlength="1"
              density="compact"
              @update:model-value="updateOptions"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="localOptions.transformOptions.thousandsSeparator"
              label="Thousands Separator"
              maxlength="1"
              density="compact"
              @update:model-value="updateOptions"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-switch
              v-model="localOptions.transformOptions.integers"
              label="Parse Integers"
              hide-details
              density="compact"
              @update:model-value="updateOptions"
            ></v-switch>
          </v-col>
          <v-col cols="12" sm="4">
            <v-switch
              v-model="localOptions.transformOptions.decimals"
              label="Parse Decimals"
              hide-details
              density="compact"
              @update:model-value="updateOptions"
            ></v-switch>
          </v-col>
          <v-col cols="12" sm="4">
            <v-switch
              v-model="localOptions.transformOptions.scientific"
              label="Parse Scientific"
              hide-details
              density="compact"
              @update:model-value="updateOptions"
            ></v-switch>
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
            label="Custom Node Transformer Function"
            hint="Function that transforms each node (node) => transformedNode"
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
          - <em>Node Transform</em>: Use built-in transforms (toBoolean, toNumber, regex) with node filtering<br>
          - <em>Custom</em>: Write a custom node transformer function<br>
          - Return <code>null</code> from custom transformer to remove nodes
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense v-if="transformMode === 'nodeTransform'">
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-code-braces"
          class="text-caption mt-3"
        >
          <strong>Node filtering examples:</strong><br>
          - <em>Transform Only</em>: <code>["price", "total"]</code> - only transform these nodes<br>
          - <em>Skip Nodes</em>: <code>["id", "version"]</code> - skip these nodes<br>
          - Leave both empty to transform all nodes with matching values
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
          <strong>Example node transformers:</strong><br>
          - <code>node => node.name === 'price' ? {...node, value: parseFloat(node.value)} : node</code><br>
          - <code>node => node.name === 'comment' ? null : node</code> (remove comments)<br>
          - <code>node => ({...node, value: node.value?.toString().toUpperCase()})</code> (uppercase values)
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
      customTransformer: ''
    })
  }
});

const emit = defineEmits(['update']);

// Transform mode options
const transformModeItems = [
  { title: 'Node Transform', value: 'nodeTransform' },
  { title: 'Custom Transformer', value: 'custom' }
];

// Node transform options
const nodeTransformItems = [
  { title: 'Boolean Transform', value: 'toBoolean' },
  { title: 'Number Transform', value: 'toNumber' },
  { title: 'Regex Transform', value: 'regex' }
];

// Create a local reactive copy of the props
const localOptions = reactive({
  transformType: props.value.transformType || null,
  transformOptions: { ...props.value.transformOptions } || {},
  customTransformer: props.value.customTransformer || ''
});

// Determine current transform mode
const transformMode = computed({
  get() {
    return localOptions.transformType ? 'nodeTransform' : 'custom';
  },
  set(value) {
    if (value === 'nodeTransform') {
      if (!localOptions.transformType) {
        localOptions.transformType = 'toBoolean';
        localOptions.transformOptions = getDefaultTransformOptions('toBoolean');
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
    case 'toBoolean':
      return {
        trueValues: ['true', 'yes', '1', 'on'],
        falseValues: ['false', 'no', '0', 'off'],
        ignoreCase: true,
        nodeNames: [],
        skipNodes: []
      };
    case 'toNumber':
      return {
        precision: undefined,
        decimalSeparator: '.',
        thousandsSeparator: ',',
        integers: true,
        decimals: true,
        scientific: true,
        nodeNames: [],
        skipNodes: []
      };
    case 'regex':
      return {
        pattern: '',
        replacement: '',
        nodeNames: [],
        skipNodes: []
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
      customTransformer: newValue.customTransformer || ''
    });
  }
}, { deep: true });

// Watch for transform type changes to update default options
watch(() => localOptions.transformType, (newType) => {
  if (newType && transformMode.value === 'nodeTransform') {
    localOptions.transformOptions = {
      ...getDefaultTransformOptions(newType),
      ...localOptions.transformOptions
    };
    updateOptions();
  }
});
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>