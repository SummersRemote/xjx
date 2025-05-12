<!-- components/transforms/NumberTransformConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-select
          v-model="localOptions.format"
          :items="formatItems"
          label="Apply To Format"
          hint="Leave blank to apply to both formats"
          persistent-hint
          clearable
          density="compact"
          @update:model-value="updateOptions"
        ></v-select>
      </v-col>
    </v-row>
    
    <v-row dense class="mt-2">
      <v-col cols="12" sm="4">
        <v-switch
          v-model="localOptions.integers"
          label="Convert Integers"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-switch>
      </v-col>
      
      <v-col cols="12" sm="4">
        <v-switch
          v-model="localOptions.decimals"
          label="Convert Decimals"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-switch>
      </v-col>
      
      <v-col cols="12" sm="4">
        <v-switch
          v-model="localOptions.scientific"
          label="Convert Scientific"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-switch>
      </v-col>
    </v-row>
    
    <v-row dense class="mt-2">
      <v-col cols="12" sm="4">
        <v-switch
          v-model="localOptions.strictParsing"
          label="Strict Parsing"
          hint="Only convert exact matches"
          density="compact"
          @update:model-value="updateOptions"
        ></v-switch>
      </v-col>
      
      <v-col cols="12" sm="4">
        <v-text-field
          v-model="localOptions.decimalSeparator"
          label="Decimal Separator"
          maxlength="1"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="4">
        <v-text-field
          v-model="localOptions.thousandsSeparator"
          label="Thousands Separator"
          maxlength="1"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { reactive, watch } from 'vue';

// Available format options
const formatItems = [
  { title: 'XML Only', value: 'xml' },
  { title: 'JSON Only', value: 'json' }
];

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      integers: true,
      decimals: true,
      scientific: true,
      strictParsing: true,
      decimalSeparator: '.',
      thousandsSeparator: ',',
      format: undefined
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  integers: props.value.integers !== undefined ? props.value.integers : true,
  decimals: props.value.decimals !== undefined ? props.value.decimals : true,
  scientific: props.value.scientific !== undefined ? props.value.scientific : true,
  strictParsing: props.value.strictParsing !== undefined ? props.value.strictParsing : true,
  decimalSeparator: props.value.decimalSeparator || '.',
  thousandsSeparator: props.value.thousandsSeparator || ',',
  format: props.value.format
});

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    Object.assign(localOptions, {
      integers: newValue.integers !== undefined ? newValue.integers : true,
      decimals: newValue.decimals !== undefined ? newValue.decimals : true,
      scientific: newValue.scientific !== undefined ? newValue.scientific : true,
      strictParsing: newValue.strictParsing !== undefined ? newValue.strictParsing : true,
      decimalSeparator: newValue.decimalSeparator || '.',
      thousandsSeparator: newValue.thousandsSeparator || ',',
      format: newValue.format
    });
  }
}, { deep: true });
</script>