<!-- components/configs/MapConfig.vue - Updated for new hook system -->
<template>
  <v-container>
    <!-- Primary Transform Configuration -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">
          <v-icon icon="mdi-cog" size="small" class="me-1"></v-icon>
          Primary Transform (Required)
        </div>
        <v-card variant="outlined" class="pa-3" :color="!hasMainTransform ? 'warning' : ''">
          <div class="text-caption text-medium-emphasis mb-2">
            Main transformation function applied to each node
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
            Primary transform is required for map operations
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
    
    <v-divider class="my-4"></v-divider>
    
    <!-- Before Transform Hook Configuration -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">
          <v-icon icon="mdi-play" size="small" class="me-1"></v-icon>
          Before Transform Hook (Optional)
        </div>
        <v-card variant="outlined" class="pa-3">
          <div class="text-caption text-medium-emphasis mb-2">
            Applied to each node before the primary transform
          </div>
          <TransformerConfig
            :value="localOptions.beforeTransform"
            context="transformer"
            @update="updateBeforeTransform"
          />
        </v-card>
      </v-col>
    </v-row>
    
    <v-divider class="my-4"></v-divider>
    
    <!-- After Transform Hook Configuration -->
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">
          <v-icon icon="mdi-check" size="small" class="me-1"></v-icon>
          After Transform Hook (Optional)
        </div>
        <v-card variant="outlined" class="pa-3">
          <div class="text-caption text-medium-emphasis mb-2">
            Applied to each node after the primary transform
          </div>
          <TransformerConfig
            :value="localOptions.afterTransform"
            context="transformer"
            @update="updateAfterTransform"
          />
        </v-card>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="text-caption mt-3"
        >
          <strong>Map Operation Flow:</strong><br>
          1. <span class="text-primary">Before Hook</span>: Prepare node for transformation<br>
          2. <span class="text-warning">Primary Transform</span>: Main transformation logic (required)<br>
          3. <span class="text-success">After Hook</span>: Finalize or validate transformed node<br>
          <br>
          <strong>API:</strong> <code>map(primaryTransform, { beforeTransform?, afterTransform? })</code>
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="success"
          variant="tonal"
          density="compact"
          icon="mdi-lightbulb-outline"
          class="text-caption mt-3"
        >
          <strong>Transform Examples:</strong><br>
          - <em>Primary</em>: <code>toNumber({ nodeNames: ['price'] })</code><br>
          - <em>Before Hook</em>: <code>node => ({ ...node, originalValue: node.value })</code><br>
          - <em>After Hook</em>: <code>node => node.value > 100 ? {...node, expensive: true} : node</code><br>
          <br>
          Return <code>null</code> from any transform to remove the node from the tree.
        </v-alert>
      </v-col>
    </v-row>
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
        transformType: null,
        transformOptions: {},
        customTransformer: ''
      },
      beforeTransform: {
        transformType: null,
        transformOptions: {},
        customTransformer: ''
      },
      afterTransform: {
        transformType: null,
        transformOptions: {},
        customTransformer: ''
      }
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  transform: { 
    transformType: props.value.transform?.transformType || null,
    transformOptions: { ...props.value.transform?.transformOptions } || {},
    customTransformer: props.value.transform?.customTransformer || ''
  },
  beforeTransform: { 
    transformType: props.value.beforeTransform?.transformType || null,
    transformOptions: { ...props.value.beforeTransform?.transformOptions } || {},
    customTransformer: props.value.beforeTransform?.customTransformer || ''
  },
  afterTransform: { 
    transformType: props.value.afterTransform?.transformType || null,
    transformOptions: { ...props.value.afterTransform?.transformOptions } || {},
    customTransformer: props.value.afterTransform?.customTransformer || ''
  }
});

// Check if main transform is configured
const hasMainTransform = computed(() => {
  const t = localOptions.transform;
  return !!(t.transformType || (t.customTransformer && t.customTransformer.trim()));
});

// Update primary transform
const updateTransform = (options) => {
  localOptions.transform = { ...options };
  updateOptions();
};

// Update before transform hook
const updateBeforeTransform = (options) => {
  localOptions.beforeTransform = { ...options };
  updateOptions();
};

// Update after transform hook
const updateAfterTransform = (options) => {
  localOptions.afterTransform = { ...options };
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
        transformType: newValue.transform?.transformType || null,
        transformOptions: { ...newValue.transform?.transformOptions } || {},
        customTransformer: newValue.transform?.customTransformer || ''
      },
      beforeTransform: { 
        transformType: newValue.beforeTransform?.transformType || null,
        transformOptions: { ...newValue.beforeTransform?.transformOptions } || {},
        customTransformer: newValue.beforeTransform?.customTransformer || ''
      },
      afterTransform: { 
        transformType: newValue.afterTransform?.transformType || null,
        transformOptions: { ...newValue.afterTransform?.transformOptions } || {},
        customTransformer: newValue.afterTransform?.customTransformer || ''
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