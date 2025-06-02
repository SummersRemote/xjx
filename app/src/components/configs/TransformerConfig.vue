<!-- components/configs/TransformerConfig.vue - Updated with transformAttr/transformVal options -->
<template>
  <v-container>
    <!-- Source/Output Context: Simple text box -->
    <div v-if="isSourceOrOutputContext">
      <v-alert
        type="info"
        variant="text"
        density="compact"
        class="mb-3"
      >
        <strong>{{ contextDisplayName }} Context:</strong><br>
        Enter a custom function to process {{ getContextDataType() }}. Built-in transforms work with individual nodes - use <code>map()</code> operations for those.
      </v-alert>
      
      <v-textarea
        v-model="simpleCustomFunction"
        :label="customLabel"
        :hint="customHint"
        persistent-hint
        auto-grow
        rows="4"
        density="compact"
        variant="outlined"
        class="font-mono"
        @update:model-value="updateSimpleCustom"
      ></v-textarea>
    </div>
    
    <!-- Transformer Context: Multi-transform interface -->
    <div v-else>
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
              size="small"
            >
              Boolean
            </v-chip>
            <v-chip
              value="toNumber"
              color="primary"
              variant="outlined"
              filter
              size="small"
            >
              Number
            </v-chip>
            <v-chip
              value="regex"
              color="primary"
              variant="outlined"
              filter
              size="small"
            >
              Regex
            </v-chip>
            <v-chip
              value="custom"
              color="primary"
              variant="outlined"
              filter
              size="small"
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
              <!-- Target Selection -->
              <div class="text-subtitle-2 mb-2">Transform Target</div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localOptions.transforms.toBoolean.transformVal"
                    label="Transform Node Value"
                    hide-details
                    density="compact"
                    @update:model-value="updateOptions"
                  ></v-switch>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localOptions.transforms.toBoolean.transformAttr"
                    label="Transform Attributes"
                    hide-details
                    density="compact"
                    @update:model-value="updateOptions"
                  ></v-switch>
                </v-col>
              </v-row>
              
              <v-divider class="my-3"></v-divider>
              
              <!-- Boolean Values -->
              <div class="text-subtitle-2 mb-2">Boolean Values</div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-combobox
                    v-model="localOptions.transforms.toBoolean.trueValues"
                    label="True Values"
                    multiple
                    chips
                    closable-chips
                    density="compact"
                    variant="outlined"
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
                    variant="outlined"
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
              <!-- Target Selection -->
              <div class="text-subtitle-2 mb-2">Transform Target</div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localOptions.transforms.toNumber.transformVal"
                    label="Transform Node Value"
                    hide-details
                    density="compact"
                    @update:model-value="updateOptions"
                  ></v-switch>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localOptions.transforms.toNumber.transformAttr"
                    label="Transform Attributes"
                    hide-details
                    density="compact"
                    @update:model-value="updateOptions"
                  ></v-switch>
                </v-col>
              </v-row>
              
              <v-divider class="my-3"></v-divider>
              
              <!-- Number Options -->
              <div class="text-subtitle-2 mb-2">Number Options</div>
              <v-row dense>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="localOptions.transforms.toNumber.precision"
                    label="Precision (decimal places)"
                    type="number"
                    min="0"
                    max="10"
                    density="compact"
                    variant="outlined"
                    @update:model-value="updateOptions"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="localOptions.transforms.toNumber.decimalSeparator"
                    label="Decimal Separator"
                    maxlength="1"
                    density="compact"
                    variant="outlined"
                    @update:model-value="updateOptions"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="localOptions.transforms.toNumber.thousandsSeparator"
                    label="Thousands Separator"
                    maxlength="1"
                    density="compact"
                    variant="outlined"
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
              <!-- Target Selection -->
              <div class="text-subtitle-2 mb-2">Transform Target</div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localOptions.transforms.regex.transformVal"
                    label="Transform Node Value"
                    hide-details
                    density="compact"
                    @update:model-value="updateOptions"
                  ></v-switch>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localOptions.transforms.regex.transformAttr"
                    label="Transform Attributes"
                    hide-details
                    density="compact"
                    @update:model-value="updateOptions"
                  ></v-switch>
                </v-col>
              </v-row>
              
              <v-divider class="my-3"></v-divider>
              
              <!-- Regex Options -->
              <div class="text-subtitle-2 mb-2">Regex Options</div>
              <v-row dense>
                <v-col cols="12">
                  <v-text-field
                    v-model="localOptions.transforms.regex.pattern"
                    label="Pattern"
                    placeholder="Enter regex pattern or /pattern/flags"
                    density="compact"
                    variant="outlined"
                    @update:model-value="updateOptions"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="localOptions.transforms.regex.replacement"
                    label="Replacement"
                    placeholder="Replacement text"
                    density="compact"
                    variant="outlined"
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
                    label="Custom Transformer Function"
                    hint="Function that transforms each node: (node) => transformedNode"
                    persistent-hint
                    auto-grow
                    rows="4"
                    density="compact"
                    variant="outlined"
                    class="font-mono"
                    @update:model-value="updateOptions"
                  ></v-textarea>
                </v-col>
              </v-row>
            </div>
          </v-card>
        </div>
      </div>
      
      <!-- No transforms selected message -->
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
          </v-alert>
        </v-col>
      </v-row>

      <!-- Help Section - Updated for attribute/value targeting -->
      <v-expansion-panels variant="accordion" class="mt-4">
        <v-expansion-panel>
          <v-expansion-panel-title class="text-caption">
            <v-icon icon="mdi-help-circle" size="small" class="me-2"></v-icon>
            Help
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-alert type="info" variant="text" density="compact">
              <strong>Transform Targeting:</strong><br>
              Each transform can target node values, attributes, or both:<br>
              - <strong>Transform Node Value</strong>: Apply to <code>node.value</code><br>
              - <strong>Transform Attributes</strong>: Apply to all <code>node.attributes</code><br>
              <br>
              <strong>Example Use Cases:</strong><br>
              - Convert price attributes: <code>&lt;item price="99.99"&gt;</code> → <code>&lt;item price=99.99&gt;</code><br>
              - Transform boolean flags: <code>&lt;active&gt;true&lt;/active&gt;</code> → <code>&lt;active&gt;true&lt;/active&gt;</code><br>
              - Clean attribute values: <code>&lt;price currency="$99.99"&gt;</code> → <code>&lt;price currency="99.99"&gt;</code><br>
              <br>
              <strong>Transform Composition:</strong><br>
              Multiple transforms are automatically composed using the <code>compose()</code> function.
              Each transform receives the output of the previous transform.<br>
              <br>
              <strong>Node Targeting Pattern:</strong><br>
              - Use <code>filter(node => node.name === 'price')</code> before transforms<br>
              - Use <code>select(node => ['price', 'total'].includes(node.name))</code> to collect specific nodes<br>
              - Then apply transforms: <code>map(toNumber({ transformAttr: true }))</code><br>
              <br>
              <strong>Examples:</strong><br>
              - <em>Attributes Only</em>: <code>toNumber({ transformAttr: true, transformVal: false })</code><br>
              - <em>Values + Attributes</em>: <code>toBoolean({ transformAttr: true, transformVal: true })</code><br>
              - <em>Regex → Number</em>: Clean currency symbols then parse as number<br>
            </v-alert>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Simple Help for Source/Output -->
    <v-expansion-panels v-if="isSourceOrOutputContext" variant="accordion" class="mt-4">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-help-circle" size="small" class="me-2"></v-icon>
          Help
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-alert type="info" variant="text" density="compact">
            <strong>{{ contextDisplayName }} Context Functions:</strong><br>
            Write a custom function to process {{ getContextDataType() }}.<br>
            <br>
            <strong>Examples:</strong><br>
            <span v-if="context === 'source'">
              - <em>beforeTransform</em>: <code>source => source.replace(/&lt;/g, '&amp;lt;')</code><br>
              - <em>afterTransform</em>: <code>xnode => ({ ...xnode, metadata: { processed: true } })</code>
            </span>
            <span v-if="context === 'output'">
              - <em>beforeTransform</em>: <code>xnode => ({ ...xnode, version: '1.0' })</code><br>
              - <em>afterTransform</em>: <code>output => output.replace(/\n\s*\n/g, '\n')</code>
            </span>
            <br>
            <strong>For Node Targeting:</strong><br>
            Use <code>filter()</code> or <code>select()</code> operations before transforms.
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup>
import { reactive, computed, watch, ref } from 'vue';

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      selectedTransforms: [],
      transformOrder: [],
      transforms: {
        toBoolean: {
          trueValues: ['true', 'yes', '1', 'on'],
          falseValues: ['false', 'no', '0', 'off'],
          ignoreCase: true,
          transformAttr: false,
          transformVal: true
        },
        toNumber: {
          precision: undefined,
          decimalSeparator: '.',
          thousandsSeparator: ',',
          integers: true,
          decimals: true,
          scientific: true,
          transformAttr: false,
          transformVal: true
        },
        regex: {
          pattern: '',
          replacement: '',
          transformAttr: false,
          transformVal: true
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

// Simple custom function for source/output contexts
const simpleCustomFunction = ref('');

// Computed properties for context-based behavior
const isSourceOrOutputContext = computed(() => {
  return props.context === 'source' || props.context === 'output';
});

const contextDisplayName = computed(() => {
  switch (props.context) {
    case 'source': return 'Source';
    case 'output': return 'Output';
    case 'xnode': return 'XNode';
    case 'transformer':
    default: return 'Transform';
  }
});

const customLabel = computed(() => {
  switch (props.context) {
    case 'source': return 'Custom Source Processor';
    case 'output': return 'Custom Output Processor';
    case 'transformer':
    case 'xnode':
    default: return 'Custom Transformer Function';
  }
});

const customHint = computed(() => {
  switch (props.context) {
    case 'source': return 'Function that processes raw source: (source) => processedSource';
    case 'output': return 'Function that processes output: (output) => processedOutput';
    case 'transformer':
    case 'xnode':
    default: return 'Function that transforms each node: (node) => transformedNode';
  }
});

// Helper function to get context data type description
const getContextDataType = () => {
  switch (props.context) {
    case 'source': return 'raw source data (strings, objects)';
    case 'output': return 'final output data (strings, objects, DOM)';
    default: return 'structured data';
  }
};

// Create a local reactive copy of the props for transformer context
const localOptions = reactive({
  selectedTransforms: [...(props.value.selectedTransforms || [])],
  transformOrder: [...(props.value.transformOrder || [])],
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

// Computed for transformer context
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

// Initialize simple custom function for source/output contexts
if (isSourceOrOutputContext.value) {
  simpleCustomFunction.value = props.value.customTransformer || getDefaultCustomTransformer();
}

// Helper functions
function getDefaultBooleanOptions() {
  return {
    trueValues: ['true', 'yes', '1', 'on'],
    falseValues: ['false', 'no', '0', 'off'],
    ignoreCase: true,
    transformAttr: false,
    transformVal: true
  };
}

function getDefaultNumberOptions() {
  return {
    precision: undefined,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    integers: true,
    decimals: true,
    scientific: true,
    transformAttr: false,
    transformVal: true
  };
}

function getDefaultRegexOptions() {
  return {
    pattern: '',
    replacement: '',
    transformAttr: false,
    transformVal: true
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
    case 'output': return 'output => output';
    case 'transformer':
    case 'xnode':
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

// Update for simple custom function (source/output contexts)
function updateSimpleCustom() {
  emit('update', {
    customTransformer: simpleCustomFunction.value
  });
}

// Update for transformer context
function updateOptions() {
  emit('update', { ...localOptions });
}

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    if (isSourceOrOutputContext.value) {
      // For source/output, just update the simple custom function
      simpleCustomFunction.value = newValue.customTransformer || getDefaultCustomTransformer();
    } else {
      // For transformer context, update the full options
      Object.assign(localOptions, {
        selectedTransforms: [...(newValue.selectedTransforms || [])],
        transformOrder: [...(newValue.transformOrder || [])],
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
  }
}, { deep: true });
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>