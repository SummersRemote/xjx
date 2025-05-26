<!-- components/transforms/RegexTransformConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-select
          v-model="localOptions.intent"
          :items="intentItems"
          label="Transform Intent"
          hint="Direction of transformation"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-select>
      </v-col>
    </v-row>
    
    <v-row dense class="mt-2">
      <v-col cols="12" sm="6">
        <v-switch
          v-model="localOptions.values"
          label="Apply to Values"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-switch>
      </v-col>
      
      <v-col cols="12" sm="6">
        <v-switch
          v-model="localOptions.attributes"
          label="Apply to Attributes"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-switch>
      </v-col>
    </v-row>
    
    <v-divider class="my-3"></v-divider>
    
    <v-row dense>
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">Regex Options</div>
      </v-col>
      
      <v-col cols="12">
        <v-text-field
          v-model="localOptions.pattern"
          label="Pattern"
          placeholder="Enter regex pattern"
          hint="/Regular expression/ or simple string to match"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12">
        <v-text-field
          v-model="localOptions.replacement"
          label="Replacement"
          placeholder="Enter replacement text"
          hint="Replacement string. Can use $1, $2, etc. for capture groups."
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="localOptions.flags"
          label="Regex Flags"
          placeholder="g, gi, etc."
          hint="Regular expression flags (default: g)"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="6">
        <v-switch
          v-model="localOptions.matchOnly"
          label="Match Only"
          hint="Only transform values that match the pattern"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-switch>
      </v-col>
    </v-row>
    
    <v-row dense v-if="showAttributeFilter">
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">Targeting Options</div>
      </v-col>
      
      <v-col cols="12">
        <v-text-field
          v-model="localOptions.attributeFilter"
          label="Attribute Filter"
          placeholder="name, price, etc."
          hint="Only transform attributes with this name"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { reactive, watch, computed } from 'vue';

// Intent options
const intentItems = [
  { title: 'Parse (input)', value: 'parse' },
  { title: 'Serialize (output)', value: 'serialize' }
];

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      // Standard transform options
      values: true,
      attributes: true,
      intent: 'parse',
      attributeFilter: undefined,
      
      // Regex transform specific options
      pattern: '',
      replacement: '',
      flags: 'g',
      matchOnly: false
    })
  }
});

const emit = defineEmits(['update']);

// Compute whether to show attribute filter section
const showAttributeFilter = computed(() => {
  return localOptions.attributes === true;
});

// Create a local reactive copy of the props
const localOptions = reactive({
  // Standard transform options
  values: props.value.values !== undefined ? props.value.values : true,
  attributes: props.value.attributes !== undefined ? props.value.attributes : true,
  intent: props.value.intent || 'parse',
  attributeFilter: props.value.attributeFilter,
  
  // Regex transform specific options
  pattern: props.value.pattern || '',
  replacement: props.value.replacement || '',
  flags: props.value.flags || 'g',
  matchOnly: props.value.matchOnly || false
});

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    Object.assign(localOptions, {
      // Standard transform options
      values: newValue.values !== undefined ? newValue.values : true,
      attributes: newValue.attributes !== undefined ? newValue.attributes : true,
      intent: newValue.intent || 'parse',
      attributeFilter: newValue.attributeFilter,
      
      // Regex transform specific options
      pattern: newValue.pattern || '',
      replacement: newValue.replacement || '',
      flags: newValue.flags || 'g',
      matchOnly: newValue.matchOnly || false
    });
  }
}, { deep: true });
</script>