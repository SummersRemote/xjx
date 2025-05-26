<!-- components/transforms/NumberTransformConfig.vue -->
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
        <div class="text-subtitle-2 mb-2">Parse Options (string → number)</div>
      </v-col>
      
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
      
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="localOptions.decimalSeparator"
          label="Decimal Separator"
          maxlength="1"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="localOptions.thousandsSeparator"
          label="Thousands Separator"
          maxlength="1"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="localOptions.precision"
          label="Precision (decimal places)"
          type="number"
          min="0"
          max="10"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
    </v-row>
    
    <v-row dense v-if="localOptions.intent === 'serialize'">
      <v-col cols="12">
        <div class="text-subtitle-2 mb-2">Serialize Options (number → string)</div>
      </v-col>
      
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="localOptions.format"
          label="Format String"
          hint="e.g., '0.00', '0,000.00', '0.##'"
          persistent-hint
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="6">
        <v-text-field
          v-model.number="localOptions.precision"
          label="Precision (decimal places)"
          type="number"
          min="0"
          max="10"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="localOptions.decimalSeparator"
          label="Decimal Separator"
          maxlength="1"
          hide-details
          density="compact"
          @update:model-value="updateOptions"
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" sm="6">
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
    
    <v-row dense v-if="showTransformNote">
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="text-caption mt-3"
        >
          <strong>Need more targeting control?</strong><br>
          Use <code>select()</code> and <code>filter()</code> before transform to target specific nodes:
          <br><code>.select(node => node.name === 'price')</code>
          <br><code>.filter(node => node.attributes?.currency === 'USD')</code>
          <br><code>.transform(toNumber())</code>
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { reactive, watch, computed } from 'vue';

// Intent options
const intentItems = [
  { title: 'Parse (string → number)', value: 'parse' },
  { title: 'Serialize (number → string)', value: 'serialize' }
];

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      // Standard transform options
      values: true,
      attributes: true,
      intent: 'parse',
      
      // Number transform specific options
      integers: true,
      decimals: true,
      scientific: true,
      decimalSeparator: '.',
      thousandsSeparator: ',',
      precision: undefined,
      format: undefined
    })
  }
});

const emit = defineEmits(['update']);

// Show transform note only when targeting options are used
const showTransformNote = computed(() => {
  return localOptions.values !== true || localOptions.attributes !== true;
});

// Create a local reactive copy of the props
const localOptions = reactive({
  // Standard transform options
  values: props.value.values !== undefined ? props.value.values : true,
  attributes: props.value.attributes !== undefined ? props.value.attributes : true,
  intent: props.value.intent || 'parse',
  
  // Number transform specific options
  integers: props.value.integers !== undefined ? props.value.integers : true,
  decimals: props.value.decimals !== undefined ? props.value.decimals : true,
  scientific: props.value.scientific !== undefined ? props.value.scientific : true,
  decimalSeparator: props.value.decimalSeparator || '.',
  thousandsSeparator: props.value.thousandsSeparator || ',',
  precision: props.value.precision,
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
      // Standard transform options
      values: newValue.values !== undefined ? newValue.values : true,
      attributes: newValue.attributes !== undefined ? newValue.attributes : true,
      intent: newValue.intent || 'parse',
      
      // Number transform specific options
      integers: newValue.integers !== undefined ? newValue.integers : true,
      decimals: newValue.decimals !== undefined ? newValue.decimals : true,
      scientific: newValue.scientific !== undefined ? newValue.scientific : true,
      decimalSeparator: newValue.decimalSeparator || '.',
      thousandsSeparator: newValue.thousandsSeparator || ',',
      precision: newValue.precision,
      format: newValue.format
    });
  }
}, { deep: true });
</script>