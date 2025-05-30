<!-- components/configs/TransformerConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-btn-toggle
          v-model="transformMode"
          color="primary"
          variant="outlined"
          density="compact"
          mandatory
          @update:model-value="updateTransformMode"
        >
          <v-btn value="none" size="small">
            None
          </v-btn>
          <v-btn value="toBoolean" size="small">
            Boolean
          </v-btn>
          <v-btn value="toNumber" size="small">
            Number
          </v-btn>
          <v-btn value="regex" size="small">
            Regex
          </v-btn>
          <v-btn value="custom" size="small">
            Custom
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
    
    <!-- Node Transform Mode -->
    <div v-if="transformMode !== 'none' && transformMode !== 'custom'">
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
      <div v-if="transformMode === 'toBoolean'">
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
      <div v-if="transformMode === 'toNumber'">
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
      <div v-if="transformMode === 'regex'">
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
            :label="customLabel"
            :hint="customHint"
            persistent-hint
            auto-grow
            rows="4"
            class="font-mono"
            @update:model-value="updateOptions"
          ></v-textarea>
        </v-col>
      </v-row>
    </div>
    
    <v-row dense v-if="transformMode !== 'none'">
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="text-caption mt-3"
        >
          <strong>{{ alertTitle }}:</strong><br>
          - <em>Boolean Transform</em>: Convert string values to true/false<br>
          - <em>Number Transform</em>: Convert string values to numbers<br>
          - <em>Regex Transform</em>: Apply regex find/replace to string values<br>
          - <em>Custom</em>: Write custom transformer function
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense v-if="transformMode !== 'none' && transformMode !== 'custom'">
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
          <strong>{{ customExampleTitle }}:</strong><br>
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
  },
  context: {
    type: String,
    default: 'transformer',
    validator: (value) => ['transformer', 'callback'].includes(value)
  }
});

const emit = defineEmits(['update']);

// Computed labels based on context
const customLabel = computed(() => 
  props.context === 'callback' ? 'Custom Callback Function' : 'Custom Transformer Function'
);

const customHint = computed(() => 
  props.context === 'callback' 
    ? 'Function that processes each node: (node) => processedNode' 
    : 'Function that transforms each node: (node) => transformedNode'
);

const alertTitle = computed(() => 
  props.context === 'callback' ? 'Callback Transformers' : 'Node Transformers'
);

const customExampleTitle = computed(() => 
  props.context === 'callback' ? 'Example callback functions' : 'Example transformer functions'
);

// Create a local reactive copy of the props
const localOptions = reactive({
  transformType: props.value.transformType || null,
  transformOptions: { ...props.value.transformOptions } || {},
  customTransformer: props.value.customTransformer || ''
});

// Determine current transform mode
const transformMode = computed({
  get() {
    if (localOptions.transformType) {
      return localOptions.transformType;
    } else if (localOptions.customTransformer && localOptions.customTransformer.trim()) {
      return 'custom';
    } else {
      return 'none';
    }
  },
  set(value) {
    if (value === 'none') {
      localOptions.transformType = null;
      localOptions.transformOptions = {};
      localOptions.customTransformer = '';
    } else if (value === 'custom') {
      localOptions.transformType = null;
      localOptions.transformOptions = {};
      if (!localOptions.customTransformer.trim()) {
        localOptions.customTransformer = 'node => node';
      }
    } else {
      localOptions.transformType = value;
      localOptions.transformOptions = getDefaultTransformOptions(value);
      localOptions.customTransformer = '';
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
  if (newType && transformMode.value !== 'custom') {
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