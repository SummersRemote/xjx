<!-- components/configs/RootConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-text-field
          v-model="localOptions.fragmentRoot"
          label="Fragment Root (Optional)"
          hint="Container element name for results"
          persistent-hint
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
          icon="mdi-code-braces"
          class="text-caption mt-3"
        >
          The <code>root()</code> operation navigates to the root node of the current selection.
          This is useful after traversing down into the document to return to the top level.
        </v-alert>
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
          <strong>No additional configuration needed.</strong> The root operation simply navigates 
          to the root node of the current selection or document.
        </v-alert>
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
      fragmentRoot: ''
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  fragmentRoot: props.value.fragmentRoot || ''
});

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    localOptions.fragmentRoot = newValue.fragmentRoot || '';
  }
}, { deep: true });
</script>