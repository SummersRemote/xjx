<!-- components/ConfigPanel.vue - Fixed button layout -->
<template>
  <v-sheet class="pa-4">
    <!-- Header -->
    <div class="mb-4">
      <h5 class="text-h5 mb-3">Configuration</h5>
    </div>

    <!-- Log Level Selector -->
    <v-select
      v-model="logLevel"
      :items="logLevelOptions"
      label="Log Level"
      density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="setLogLevel"
    ></v-select>

    <!-- Configuration Presets Dropdown -->
    <v-select
      v-model="selectedPreset"
      :items="presetItems"
      :item-props="itemProps"
      label="Configuration Preset"
      density="compact"
      variant="outlined"
      class="mb-4"
      @update:model-value="loadPreset"
    >
    </v-select>

    <!-- Action Buttons - moved below preset selection, normal size -->
    <div class="d-flex flex-wrap gap-2 mb-4">
      <v-btn
        color="primary"
        variant="tonal"
        prepend-icon="mdi-code-tags"
        @click="$emit('showApi')"
        class="flex-grow-1 flex-sm-grow-0"
      >
        <span class="d-none d-sm-inline">View Code</span>
        <span class="d-inline d-sm-none">Code</span>
      </v-btn>
      
      <v-btn
        color="primary"
        variant="tonal"
        prepend-icon="mdi-eye"
        @click="$emit('showConfig')"
        class="flex-grow-1 flex-sm-grow-0"
      >
        <span class="d-none d-sm-inline">View Config</span>
        <span class="d-inline d-sm-none">Config</span>
      </v-btn>
    </div>

    <!-- Feature Preservation Section -->
    <div class="section-title">Feature Preservation</div>
    <v-switch
      v-model="config.preserveNamespaces"
      label="Preserve Namespaces"
      color="primary"
      hide-details
      density="compact"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-switch>
    
    <v-switch
      v-model="config.preserveComments"
      label="Preserve Comments"
      color="primary"
      hide-details
      density="compact"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-switch>
    
    <v-switch
      v-model="config.preserveProcessingInstr"
      label="Preserve Processing Instructions"
      color="primary"
      hide-details
      density="compact"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-switch>
    
    <v-switch
      v-model="config.preserveCDATA"
      label="Preserve CDATA"
      color="primary"
      hide-details
      density="compact"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-switch>
    
    <v-switch
      v-model="config.preserveTextNodes"
      label="Preserve Text Nodes"
      color="primary"
      hide-details
      density="compact"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-switch>
    
    <v-switch
      v-model="config.preserveWhitespace"
      label="Preserve Whitespace"
      color="primary"
      hide-details
      density="compact"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-switch>
    
    <v-switch
      v-model="config.preserveAttributes"
      label="Preserve Attributes"
      color="primary"
      hide-details
      density="compact"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-switch>
    
    <v-switch
      v-model="config.preservePrefixedNames"
      label="Preserve Prefixed Names"
      color="primary"
      hide-details
      density="compact"
      class="mb-4"
      @update:model-value="updateConfig"
    ></v-switch>
    
    <!-- Transformation Strategies Section -->
    <div class="section-title">Transformation Strategies</div>
    <v-switch
      v-model="config.strategies.highFidelity"
      label="High-Fidelity Mode"
      color="primary"
       density="compact"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-switch>
    
    <v-select
      v-model="config.strategies.attributeStrategy"
      :items="attributeStrategyOptions"
      label="Attribute Strategy"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-select>
    
    <v-select
      v-model="config.strategies.textStrategy"
      :items="textStrategyOptions"
      label="Text Strategy"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-select>
    
    <v-select
      v-model="config.strategies.namespaceStrategy"
      :items="namespaceStrategyOptions"
      label="Namespace Strategy"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-select>
    
    <v-select
      v-model="config.strategies.arrayStrategy"
      :items="arrayStrategyOptions"
      label="Array Strategy"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-select>
    
    <v-select
      v-model="config.strategies.emptyElementStrategy"
      :items="emptyElementStrategyOptions"
      label="Empty Element Strategy"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-select>
    
    <v-select
      v-model="config.strategies.mixedContentStrategy"
      :items="mixedContentStrategyOptions"
      label="Mixed Content Strategy"
       density="compact"
      variant="outlined"
      class="mb-4"
      @update:model-value="updateConfig"
    ></v-select>
    
    <!-- Property Names Section -->
    <div class="section-title">Property Names</div>
    <v-text-field
      v-model="config.properties.attribute"
      label="Attribute Property"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.properties.value"
      label="Value Property"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.properties.namespace"
      label="Namespace Property"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.properties.prefix"
      label="Prefix Property"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.properties.cdata"
      label="CDATA Property"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.properties.comment"
      label="Comment Property"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.properties.processingInstr"
      label="Processing Instruction Property"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.properties.target"
      label="Target Property"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.properties.children"
      label="Children Property"
       density="compact"
      variant="outlined"
      class="mb-4"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <!-- Prefix Configurations Section -->
    <div class="section-title">Prefix Configurations</div>
    <v-text-field
      v-model="config.prefixes.attribute"
      label="Attribute Prefix"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.prefixes.namespace"
      label="Namespace Prefix"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.prefixes.comment"
      label="Comment Prefix"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.prefixes.cdata"
      label="CDATA Prefix"
       density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <v-text-field
      v-model="config.prefixes.pi"
      label="Processing Instruction Prefix"
       density="compact"
      variant="outlined"
      class="mb-4"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <!-- Array Configurations Section -->
    <div class="section-title">Array Configurations</div>
    <v-combobox
      v-model="config.arrays.forceArrays"
      label="Force Arrays"
       multiple
      chips
      closable-chips
      density="compact"
      variant="outlined"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-combobox>
    
    <v-text-field
      v-model="config.arrays.defaultItemName"
      label="Default Item Name"
       density="compact"
      variant="outlined"
      class="mb-4"
      @update:model-value="updateConfig"
    ></v-text-field>
    
    <!-- Output Formatting Section -->
    <div class="section-title">Output Formatting</div>
    <v-switch
      v-model="config.formatting.pretty"
      label="Pretty Print"
       density="compact"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-switch>
    
    <v-switch
      v-model="config.formatting.declaration"
      label="Include XML Declaration"
       density="compact"
      class="mb-2"
      @update:model-value="updateConfig"
    ></v-switch>
    
    <v-text-field
      v-model.number="config.formatting.indent"
      label="Indent Size"
      type="number"
      min="0"
      max="8"
       density="compact"
      variant="outlined"
      class="mb-4"
      @update:model-value="updateConfig"
    ></v-text-field>

    <!-- Functional Operations Section -->
    <div class="section-title">Functional Operations</div>
    <v-text-field
      v-model="config.fragmentRoot"
      label="Fragment Root Name"
       density="compact"
      variant="outlined"
      class="mb-4"
      @update:model-value="updateConfig"
    ></v-text-field>

    <v-divider class="mb-4"></v-divider>
  </v-sheet>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useConfigStore } from '@/stores/configStore';
import { configPresets } from '@/services/configPresets.js';

// Define emits for parent communication
const emit = defineEmits(['showApi', 'showConfig']);

// Store and configuration
const configStore = useConfigStore();
const { config, logLevel } = storeToRefs(configStore);

// Preset selection state - start with Default selected
const selectedPreset = ref(0);

// Create preset items for dropdown
const presetItems = configPresets.map((preset, index) => ({
  ...preset,
  value: index
}));

function itemProps (item) {
    return {
      title: item.name,
      subtitle: item.description,
    }
  }

// Select options
const attributeStrategyOptions = [
  { title: 'Merge', value: 'merge' },
  { title: 'Prefix', value: 'prefix' },
  { title: 'Property', value: 'property' }
];

const textStrategyOptions = [
  { title: 'Direct', value: 'direct' },
  { title: 'Property', value: 'property' }
];

const namespaceStrategyOptions = [
  { title: 'Prefix', value: 'prefix' },
  { title: 'Property', value: 'property' }
];

const arrayStrategyOptions = [
  { title: 'Multiple (Arrays only when needed)', value: 'multiple' },
  { title: 'Always (Always create arrays)', value: 'always' },
  { title: 'Never (Last element wins)', value: 'never' }
];

const emptyElementStrategyOptions = [
  { title: 'Object (Empty object)', value: 'object' },
  { title: 'Null (null value)', value: 'null' },
  { title: 'String (Empty string)', value: 'string' },
  { title: 'Remove (Remove empty elements)', value: 'remove' }
];

const mixedContentStrategyOptions = [
  { title: 'Preserve (Keep both text and elements separately)', value: 'preserve' },
  { title: 'Merge (Flatten all content into readable text)', value: 'merge' }
];

const logLevelOptions = [
  { title: 'Debug', value: 'DEBUG' },
  { title: 'Info', value: 'INFO' },
  { title: 'Warning', value: 'WARN' },
  { title: 'Error', value: 'ERROR' },
  { title: 'None', value: 'NONE' }
];

// Methods
const updateConfig = () => {
  configStore.updateConfig(JSON.parse(JSON.stringify(config.value)));
  // Clear preset selection when manually updating config
  selectedPreset.value = null;
};

const setLogLevel = (level) => {
  configStore.updateLogLevel(level);
};

const loadPreset = (presetIndex) => {
  if (presetIndex !== null && presetIndex !== undefined) {
    const preset = configPresets[presetIndex];
    if (preset && preset.config) {
      configStore.updateConfig(JSON.parse(JSON.stringify(preset.config)));
    }
  }
};

// Initialize with default configuration on mount
onMounted(() => {
  // Load the default configuration (first preset) if no config is already set
  if (selectedPreset.value === 0) {
    loadPreset(0);
  }
});
</script>

<style scoped>
/* Style section titles */
.section-title {
  font-size: 1rem;
  font-weight: bold;
  color: #1976D2;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e0e0e0;
}

.gap-2 {
  gap: 8px;
}
</style>