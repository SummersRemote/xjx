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
          hint="Use simple text for exact match or /pattern/flags for regex"
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
          <strong>Pattern Syntax:</strong><br>
          - Simple text: Exact match, global replacement<br>
          - /pattern/flags: Full regex with flags (g, i, m, etc.)
        </v-alert>
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
          <br><code>.select(node => node.name === 'phone')</code>
          <br><code>.filter(node => node.value?.length > 10)</code>
          <br><code>.transform(regex('[^0-9]', ''))</code>
        </v-alert>
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
      
      // Regex transform specific options
      pattern: '',
      replacement: ''
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
  
  // Regex transform specific options
  pattern: props.value.pattern || '',
  replacement: props.value.replacement || ''
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
      
      // Regex transform specific options
      pattern: newValue.pattern || '',
      replacement: newValue.replacement || ''
    });
  }
}, { deep: true });
</script>