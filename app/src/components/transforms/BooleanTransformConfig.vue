<!-- components/transforms/BooleanTransformConfig.vue -->
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
    
    <v-row dense v-if="localOptions.intent === 'parse'">
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">Parse Options (string → boolean)</div>
      </v-col>
      
      <v-col cols="12">
        <v-combobox
          v-model="localOptions.trueValues"
          label="True Values"
          multiple
          chips
          closable-chips
          density="compact"
          hint="Values to convert to true"
          persistent-hint
          @update:model-value="updateOptions"
        ></v-combobox>
      </v-col>
      
      <v-col cols="12">
        <v-combobox
          v-model="localOptions.falseValues"
          label="False Values"
          multiple
          chips
          closable-chips
          density="compact"
          hint="Values to convert to false"
          persistent-hint
          @update:model-value="updateOptions"
        ></v-combobox>
      </v-col>
      
      <v-col cols="12">
        <v-switch
          v-model="localOptions.ignoreCase"
          label="Ignore Case"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-switch>
      </v-col>
    </v-row>
    
    <v-row dense v-if="localOptions.intent === 'serialize'">
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">Serialize Options (boolean → string)</div>
      </v-col>
      
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="localOptions.trueString"
          label="True String"
          hint="String representation for true values"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="localOptions.falseString"
          label="False String"
          hint="String representation for false values"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { reactive, watch } from 'vue';

// Intent options
const intentItems = [
  { title: 'Parse (string → boolean)', value: 'parse' },
  { title: 'Serialize (boolean → string)', value: 'serialize' }
];

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      // Standard transform options
      values: true,
      attributes: true,
      intent: 'parse',
      
      // Boolean transform specific options
      trueValues: ['true', 'yes', '1', 'on'],
      falseValues: ['false', 'no', '0', 'off'],
      ignoreCase: true,
      trueString: 'true',
      falseString: 'false'
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  // Standard transform options
  values: props.value.values !== undefined ? props.value.values : true,
  attributes: props.value.attributes !== undefined ? props.value.attributes : true,
  intent: props.value.intent || 'parse',
  
  // Boolean transform specific options
  trueValues: [...props.value.trueValues || ['true', 'yes', '1', 'on']],
  falseValues: [...props.value.falseValues || ['false', 'no', '0', 'off']],
  ignoreCase: props.value.ignoreCase !== undefined ? props.value.ignoreCase : true,
  trueString: props.value.trueString || 'true',
  falseString: props.value.falseString || 'false'
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
      
      // Boolean transform specific options
      trueValues: [...(newValue.trueValues || [])],
      falseValues: [...(newValue.falseValues || [])],
      ignoreCase: newValue.ignoreCase !== undefined ? newValue.ignoreCase : true,
      trueString: newValue.trueString || 'true',
      falseString: newValue.falseString || 'false'
    });
  }
}, { deep: true });
</script>