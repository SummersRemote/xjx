<!-- components/transforms/RegexTransformConfig.vue -->
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
      <v-col cols="12">
        <v-text-field
          v-model="localOptions.pattern"
          label="Pattern"
          placeholder="Enter regex pattern"
          hint="Regular expression or string to search for"
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
      
      <v-col cols="12" class="text-caption mt-1">
        <div class="text-grey">
          Note: To use a regular expression with flags, you'll need to create a RegExp object in your code.
          The current interface supports string patterns only.
        </div>
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
      pattern: '',
      replacement: '',
      format: undefined
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  pattern: props.value.pattern || '',
  replacement: props.value.replacement || '',
  format: props.value.format
});

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    localOptions.pattern = newValue.pattern || '';
    localOptions.replacement = newValue.replacement || '';
    localOptions.format = newValue.format;
  }
}, { deep: true });
</script>