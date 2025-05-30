<!-- components/configs/MapConfig.vue - Refactored with collapsible hooks and help at bottom -->
<template>
  <v-container>
    <!-- Primary Transform Configuration -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">
          <v-icon icon="mdi-cog" size="small" class="me-1"></v-icon>
          Primary Transform Pipeline (Required)
        </div>
        <v-card variant="outlined" class="pa-3" :color="!hasMainTransform ? 'warning' : ''">
          <div class="text-caption text-medium-emphasis mb-2">
            Main transformation pipeline applied to each node - supports multiple chained transforms
          </div>
          <TransformerConfig
            :value="localOptions.transform"
            context="transformer"
            @update="updateTransform"
          />
          <v-alert
            v-if="!hasMainTransform"
            type="warning"
            variant="text"
            density="compact"
            class="mt-2"
          >
            Primary transform pipeline is required for map operations
          </v-alert>
          <v-alert
            v-if="hasMainTransform && transformSummary"
            type="success"
            variant="text"
            density="compact"
            class="mt-2"
          >
            <strong>Transform Pipeline:</strong> {{ transformSummary }}
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
    
    <v-divider class="my-4"></v-divider>
    
    <!-- Before Transform Hook Configuration -->
    <v-expansion-panels variant="accordion" class="mb-3">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-play" size="small" class="me-2"></v-icon>
          Before Transform Hook (Optional)
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="text-caption text-medium-emphasis mb-2">
            Applied to each node before the primary transform pipeline
          </div>
          <TransformerConfig
            :value="localOptions.beforeTransform"
            context="transformer"
            @update="updateBeforeTransform"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    
    <!-- After Transform Hook Configuration -->
    <v-expansion-panels variant="accordion" class="mb-4">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-check" size="small" class="me-2"></v-icon>
          After Transform Hook (Optional)
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="text-caption text-medium-emphasis mb-2">
            Applied to each node after the primary transform pipeline
          </div>
          <TransformerConfig
            :value="localOptions.afterTransform"
            context="transformer"
            @update="updateAfterTransform"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Help Section - Moved to bottom -->
    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-help-circle" size="small" class="me-2"></v-icon>
          Help
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-alert type="info" variant="text" density="compact">
            <strong>Map Operation Flow:</strong><br>
            1. <span class="text-primary">Before Hook</span>: Prepare node for transformation<br>
            2. <span class="text-warning">Primary Transform Pipeline</span>: Main transformation logic (required)<br>
            3. <span class="text-success">After Hook</span>: Finalize or validate transformed node<br>
            <br>
            <strong>API:</strong> <code>map(primaryTransformPipeline, { beforeTransform?, afterTransform? })</code><br>
            <br>
            <strong>Multi-Transform Pipeline Examples:</strong><br>
            - <em>Currency Processing</em>: <code>regex(/[$,]/g, '') → toNumber({ precision: 2 })</code><br>
            - <em>Boolean Flags</em>: <code>toBoolean() → custom(node => ({...node, processed: true}))</code><br>
            - <em>Data Cleanup</em>: <code>regex(/\s+/g, ' ') → toNumber() → toBoolean()</code><br>
            <br>
            Multiple transforms are automatically composed using the <code>compose()</code> function.
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import TransformerConfig from './TransformerConfig.vue';

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      transform: {
        selectedTransforms: [],
        transformOrder: [],
        globalNodeNames: [],
        globalSkipNodes: [],
        transforms: {}
      },
      beforeTransform: {
        selectedTransforms: [],
        transformOrder: [],
        globalNodeNames: [],
        globalSkipNodes: [],
        transforms: {}
      },
      afterTransform: {
        selectedTransforms: [],
        transformOrder: [],
        globalNodeNames: [],
        globalSkipNodes: [],
        transforms: {}
      }
    })
  }
});

const emit = defineEmits(['update']);

// Get default transform config structure
function getDefaultTransformConfig() {
  return {
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
  };
}

// Create a local reactive copy of the props
const localOptions = reactive({
  transform: { 
    ...getDefaultTransformConfig(),
    ...(props.value.transform || {})
  },
  beforeTransform: { 
    ...getDefaultTransformConfig(),
    ...(props.value.beforeTransform || {})
  },
  afterTransform: { 
    ...getDefaultTransformConfig(),
    ...(props.value.afterTransform || {})
  }
});

// Check if main transform pipeline is configured
const hasMainTransform = computed(() => {
  const t = localOptions.transform;
  return !!(t.selectedTransforms && t.selectedTransforms.length > 0);
});

// Generate a summary of the transform pipeline
const transformSummary = computed(() => {
  const t = localOptions.transform;
  if (!t.transformOrder || t.transformOrder.length === 0) {
    return '';
  }
  
  const transformNames = t.transformOrder.map(type => {
    switch (type) {
      case 'toBoolean': return 'Boolean';
      case 'toNumber': return 'Number';
      case 'regex': return 'Regex';
      case 'custom': return 'Custom';
      default: return type;
    }
  });
  
  let summary = transformNames.join(' → ');
  
  // Add node filtering info if present
  const nodeInfo = [];
  if (t.globalNodeNames && t.globalNodeNames.length > 0) {
    nodeInfo.push(`only: [${t.globalNodeNames.join(', ')}]`);
  }
  if (t.globalSkipNodes && t.globalSkipNodes.length > 0) {
    nodeInfo.push(`skip: [${t.globalSkipNodes.join(', ')}]`);
  }
  
  if (nodeInfo.length > 0) {
    summary += ` (${nodeInfo.join(', ')})`;
  }
  
  return summary;
});

// Update primary transform
const updateTransform = (options) => {
  localOptions.transform = { ...getDefaultTransformConfig(), ...options };
  updateOptions();
};

// Update before transform hook
const updateBeforeTransform = (options) => {
  localOptions.beforeTransform = { ...getDefaultTransformConfig(), ...options };
  updateOptions();
};

// Update after transform hook
const updateAfterTransform = (options) => {
  localOptions.afterTransform = { ...getDefaultTransformConfig(), ...options };
  updateOptions();
};

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    Object.assign(localOptions, {
      transform: { 
        ...getDefaultTransformConfig(),
        ...(newValue.transform || {})
      },
      beforeTransform: { 
        ...getDefaultTransformConfig(),
        ...(newValue.beforeTransform || {})
      },
      afterTransform: { 
        ...getDefaultTransformConfig(),
        ...(newValue.afterTransform || {})
      }
    });
  }
}, { deep: true });
</script>

<style scoped>
.text-subtitle-2 {
  font-weight: 600;
  color: #1976D2;
}
</style>