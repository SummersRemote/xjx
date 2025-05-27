<!-- components/configs/FilterConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-textarea
          v-model="localOptions.predicate"
          label="Filter Predicate"
          hint="Function that determines if a node should be REMOVED"
          persistent-hint
          auto-grow
          rows="3"
          class="font-mono"
          @update:model-value="updateOptions"
        ></v-textarea>
      </v-col>
    </v-row>
    
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
          type="warning"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="text-caption mt-3"
        >
          <strong>Important:</strong> Nodes that match the predicate will be REMOVED. The predicate function
          should return true for nodes you want to remove, not keep.
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
          <strong>Example predicates:</strong><br>
          - <code>node => node.attributes && node.attributes.type === 'admin'</code> (remove admin nodes)<br>
          - <code>node => parseInt(node.value) > 1000</code> (remove nodes with values > 1000)<br>
          - <code>node => node.name.startsWith('_')</code> (remove nodes with names starting with underscore)
        </v-alert>
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
          The <code>filter()</code> operation removes nodes that match the predicate while maintaining the document hierarchy.
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
      predicate: 'node => node.name === "example"',
      fragmentRoot: ''
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  predicate: props.value.predicate || 'node => node.name === "example"',
  fragmentRoot: props.value.fragmentRoot || ''
});

// Emit changes to the parent
const updateOptions = () => {
  emit('update', { ...localOptions });
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    localOptions.predicate = newValue.predicate || 'node => node.name === "example"';
    localOptions.fragmentRoot = newValue.fragmentRoot || '';
  }
}, { deep: true });
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>