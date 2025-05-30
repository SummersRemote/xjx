<!-- components/configs/TransformerConfig.vue - Multi-transform support -->
<template>
  <v-container>
    <!-- Transform Selection (Multiple) -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">Select Transform Types (Multiple Allowed)</div>
        <v-chip-group
          v-model="selectedTransforms"
          multiple
          column
          @update:model-value="updateSelectedTransforms"
        >
          <v-chip
            value="toBoolean"
            color="primary"
            variant="outlined"
            filter
          >
            Boolean
          </v-chip>
          <v-chip
            value="toNumber"
            color="primary"
            variant="outlined"
            filter
          >
            Number
          </v-chip>
          <v-chip
            value="regex"
            color="primary"
            variant="outlined"
            filter
          >
            Regex
          </v-chip>
          <v-chip
            value="custom"
            color="primary"
            variant="outlined"
            filter
          >
            Custom
          </v-chip>
        </v-chip-group>
        
        <v-alert
          v-if="selectedTransforms.length > 1"
          type="info"
          variant="text"
          density="compact"
          class="mt-2"
        >
          Transforms will be applied in order: {{ transformOrder.join(' → ') }}
        </v-alert>
      </v-col>
    </v-row>
    
    <!-- Transform Configurations -->
    <div v-if="selectedTransforms.length > 0">
      <!-- Global Node Filtering (applies to all transforms) -->
      <v-row dense>
        <v-col cols="12">
          <v-divider class="my-4"></v-divider>
          <div class="text-subtitle-2 mb-2">Global Node Filtering</div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-combobox
                v-model="localOptions.globalNodeNames"
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
                v-model="localOptions.globalSkipNodes"
                label="Skip These Nodes"
                hint="Nodes to exclude from all transforms"
                persistent-hint
                multiple
                chips
                closable-chips
                density="compact"
                @update:model-value="updateOptions"
              ></v-combobox>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      
      <v-divider class="my-4"></v-divider>
      
      <!-- Individual Transform Configurations -->
      <div v-for="(transformType, index) in transformOrder" :key="transformType" class="mb-4">
        <div class="d-flex align-center mb-2">
          <v-chip
            :color="getTransformColor(transformType)"
            size="small"
            class="me-2"
          >
            {{ index + 1 }}
          </v-chip>
          <div class="text-subtitle-2">{{ getTransformDisplayName(transformType) }} Configuration</div>
          <v-spacer></v-spacer>
          <!-- Move up/down buttons -->
          <v-btn
            v-if="index > 0"
            icon="mdi-arrow-up"
            size="x-small"
            variant="text"
            @click="moveTransform(index, -1)"
          ></v-btn>
          <v-btn
            v-if="index < transformOrder.length - 1"
            icon="mdi-arrow-down"
            size="x-small"
            variant="text"
            @click="moveTransform(index, 1)"
          ></v-btn>
        </div>
        
        <v-card variant="outlined" class="pa-3">
          <!-- Boolean Transform Options -->
          <div v-if="transformType === 'toBoolean'">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-combobox
                  v-model="localOptions.transforms.toBoolean.trueValues"
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
                  v-model="localOptions.transforms.toBoolean.falseValues"
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
                  v-model="localOptions.transforms.toBoolean.ignoreCase"
                  label="Ignore Case"
                  hide-details
                  density="compact"
                  @update:model-value="updateOptions"
                ></v-switch>
              </v-col>
            </v-row>
          </div>
          
          <!-- Number Transform Options -->
          <div v-if="transformType === 'toNumber'">
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="localOptions.transforms.toNumber.precision"
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
                  v-model="localOptions.transforms.toNumber.decimalSeparator"
                  label="Decimal Separator"
                  maxlength="1"
                  density="compact"
                  @update:model-value="updateOptions"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="localOptions.transforms.toNumber.thousandsSeparator"
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
                  v-model="localOptions.transforms.toNumber.integers"
                  label="Parse Integers"
                  hide-details
                  density="compact"
                  @update:model-value="updateOptions"
                ></v-switch>
              </v-col>
              <v-col cols="12" sm="4">
                <v-switch
                  v-model="localOptions.transforms.toNumber.decimals"
                  label="Parse Decimals"
                  hide-details
                  density="compact"
                  @update:model-value="updateOptions"
                ></v-switch>
              </v-col>
              <v-col cols="12" sm="4">
                <v-switch
                  v-model="localOptions.transforms.toNumber.scientific"
                  label="Parse Scientific"
                  hide-details
                  density="compact"
                  @update:model-value="updateOptions"
                ></v-switch>
              </v-col>
            </v-row>
          </div>
          
          <!-- Regex Transform Options -->
          <div v-if="transformType === 'regex'">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="localOptions.transforms.regex.pattern"
                  label="Pattern"
                  placeholder="Enter regex pattern or /pattern/flags"
                  density="compact"
                  @update:model-value="updateOptions"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="localOptions.transforms.regex.replacement"
                  label="Replacement"
                  placeholder="Replacement text"
                  density="compact"
                  @update:model-value="updateOptions"
                ></v-text-field>
              </v-col>
            </v-row>
          </div>
          
          <!-- Custom Transform Options -->
          <div v-if="transformType === 'custom'">
            <v-row dense>
              <v-col cols="12">
                <v-textarea
                  v-model="localOptions.transforms.custom.customTransformer"
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
        </v-card>
      </div>
    </div>
    
    <!-- Usage Examples -->
    <v-row dense v-if="selectedTransforms.length > 0">
      <v-col cols="12">
        <v-alert
          type="success"
          variant="tonal"
          density="compact"
          icon="mdi-lightbulb-outline"
          class="text-caption mt-3"
        >
          <strong>Multi-Transform Examples:</strong><br>
          - <em>Regex → Number</em>: Clean currency symbols then parse as number<br>
          - <em>Boolean → Custom</em>: Convert to boolean then add metadata<br>
          - <em>Number → Custom → Boolean</em>: Parse number, apply business logic, convert to flag<br>
          <br>
          <strong>Example:</strong> <code>compose(regex(/[^\d.]/g, ''), toNumber({ precision: 2 }))</code>
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense v-if="selectedTransforms.length === 0">
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="text-caption mt-3"
        >
          <strong>No transforms selected.</strong><br>
          Select one or more transform types above to configure a transformation pipeline.
          Transforms will be applied in the order shown, allowing you to chain operations together.
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
      selectedTransforms: [],
      transformOrder: [],
      globalNodeNames: [],
      globalSkipNodes: [],
      transforms: {
        toBoolean: {
          trueValues: ['true', 'yes', '1', 'on'],
          falseValues: ['false', 'no', '0', 'off'],
          ignoreCase: true
        },
        toNumber: {
          precision: undefined,
          decimalSeparator: '.',
          thousandsSeparator: ',',
          integers: true,
          decimals: true,
          scientific: true
        },
        regex: {
          pattern: '',
          replacement: ''
        },
        custom: {
          customTransformer: ''
        }
      }
    })
  },
  context: {
    type: String,
    default: 'transformer',
    validator: (value) => ['transformer', 'source', 'xnode', 'output'].includes(value)
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  selectedTransforms: [...(props.value.selectedTransforms || [])],
  transformOrder: [...(props.value.transformOrder || [])],
  globalNodeNames: [...(props.value.globalNodeNames || [])],
  globalSkipNodes: [...(props.value.globalSkipNodes || [])],
  transforms: {
    toBoolean: { 
      ...getDefaultBooleanOptions(),
      ...(props.value.transforms?.toBoolean || {})
    },
    toNumber: { 
      ...getDefaultNumberOptions(),
      ...(props.value.transforms?.toNumber || {})
    },
    regex: { 
      ...getDefaultRegexOptions(),
      ...(props.value.transforms?.regex || {})
    },
    custom: { 
      ...getDefaultCustomOptions(),
      ...(props.value.transforms?.custom || {})
    }
  }
});

// Computed properties
const selectedTransforms = computed({
  get() {
    return localOptions.selectedTransforms;
  },
  set(value) {
    localOptions.selectedTransforms = value;
    updateTransformOrder();
  }
});

const transformOrder = computed(() => localOptions.transformOrder);

const customLabel = computed(() => {
  switch (props.context) {
    case 'source': return 'Custom Source Processor';
    case 'xnode': return 'Custom XNode Processor';
    case 'output': return 'Custom Output Processor';
    case 'transformer':
    default: return 'Custom Transformer Function';
  }
});

const customHint = computed(() => {
  switch (props.context) {
    case 'source': return 'Function that processes raw source: (source) => processedSource';
    case 'xnode': return 'Function that processes XNode: (xnode) => processedXNode';
    case 'output': return 'Function that processes output: (output) => processedOutput';
    case 'transformer':
    default: return 'Function that transforms each node: (node) => transformedNode';
  }
});

// Helper functions
function getDefaultBooleanOptions() {
  return {
    trueValues: ['true', 'yes', '1', 'on'],
    falseValues: ['false', 'no', '0', 'off'],
    ignoreCase: true
  };
}

function getDefaultNumberOptions() {
  return {
    precision: undefined,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    integers: true,
    decimals: true,
    scientific: true
  };
}

function getDefaultRegexOptions() {
  return {
    pattern: '',
    replacement: ''
  };
}

function getDefaultCustomOptions() {
  return {
    customTransformer: getDefaultCustomTransformer()
  };
}

function getDefaultCustomTransformer() {
  switch (props.context) {
    case 'source': return 'source => source';
    case 'xnode': return 'xnode => xnode';
    case 'output': return 'output => output';
    case 'transformer':
    default: return 'node => node';
  }
}

function getTransformDisplayName(type) {
  switch (type) {
    case 'toBoolean': return 'Boolean Transform';
    case 'toNumber': return 'Number Transform';
    case 'regex': return 'Regex Transform';
    case 'custom': return 'Custom Transform';
    default: return type;
  }
}

function getTransformColor(type) {
  switch (type) {
    case 'toBoolean': return 'blue';
    case 'toNumber': return 'green';
    case 'regex': return 'orange';
    case 'custom': return 'purple';
    default: return 'grey';
  }
}

function updateSelectedTransforms() {
  updateTransformOrder();
  updateOptions();
}

function updateTransformOrder() {
  // Define the preferred order for transforms
  const preferredOrder = ['regex', 'toNumber', 'toBoolean', 'custom'];
  
  // Create new order based on selected transforms and preferred order
  const newOrder = [];
  
  // First, add transforms that are in both selected and preferred order
  preferredOrder.forEach(type => {
    if (localOptions.selectedTransforms.includes(type)) {
      newOrder.push(type);
    }
  });
  
  // Then add any selected transforms not in preferred order
  localOptions.selectedTransforms.forEach(type => {
    if (!newOrder.includes(type)) {
      newOrder.push(type);
    }
  });
  
  localOptions.transformOrder = newOrder;
}

function moveTransform(index, direction) {
  const newIndex = index + direction;
  if (newIndex >= 0 && newIndex < localOptions.transformOrder.length) {
    const order = [...localOptions.transformOrder];
    [order[index], order[newIndex]] = [order[newIndex], order[index]];
    localOptions.transformOrder = order;
    updateOptions();
  }
}

// Emit changes to the parent
function updateOptions() {
  emit('update', { ...localOptions });
}

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    Object.assign(localOptions, {
      selectedTransforms: [...(newValue.selectedTransforms || [])],
      transformOrder: [...(newValue.transformOrder || [])],
      globalNodeNames: [...(newValue.globalNodeNames || [])],
      globalSkipNodes: [...(newValue.globalSkipNodes || [])],
      transforms: {
        toBoolean: { 
          ...getDefaultBooleanOptions(),
          ...(newValue.transforms?.toBoolean || {})
        },
        toNumber: { 
          ...getDefaultNumberOptions(),
          ...(newValue.transforms?.toNumber || {})
        },
        regex: { 
          ...getDefaultRegexOptions(),
          ...(newValue.transforms?.regex || {})
        },
        custom: { 
          ...getDefaultCustomOptions(),
          ...(newValue.transforms?.custom || {})
        }
      }
    });
  }
}, { deep: true });
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>