<!-- components/transforms/BooleanTransformConfig.vue -->
<template>
    <v-container>
      <v-row dense>
        <v-col cols="12">
          <v-combobox
            v-model="localOptions.trueValues"
            label="True Values"
            multiple
            chips
            closable-chips
            density="compact"
            hint="Values to convert to true"
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
    </v-container>
  </template>
  
  <script setup>
  import { reactive, watch } from 'vue';
  
  const props = defineProps({
    value: {
      type: Object,
      default: () => ({
        trueValues: ['true', 'yes', '1', 'on'],
        falseValues: ['false', 'no', '0', 'off'],
        ignoreCase: true
      })
    }
  });
  
  const emit = defineEmits(['update']);
  
  // Create a local reactive copy of the props
  const localOptions = reactive({
    trueValues: [...props.value.trueValues || ['true', 'yes', '1', 'on']],
    falseValues: [...props.value.falseValues || ['false', 'no', '0', 'off']],
    ignoreCase: props.value.ignoreCase !== undefined ? props.value.ignoreCase : true
  });
  
  // Emit changes to the parent
  const updateOptions = () => {
    emit('update', { ...localOptions });
  };
  
  // Watch for prop changes
  watch(() => props.value, (newValue) => {
    if (newValue) {
      localOptions.trueValues = [...(newValue.trueValues || [])];
      localOptions.falseValues = [...(newValue.falseValues || [])];
      localOptions.ignoreCase = newValue.ignoreCase !== undefined ? newValue.ignoreCase : true;
    }
  }, { deep: true });
  </script>