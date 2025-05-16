<!-- components/APIViewer.vue -->
<template>
  <v-dialog
    v-model="dialog"
    max-width="800px"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        Fluent API
        <v-spacer></v-spacer>
        <v-btn 
          icon="mdi-content-copy" 
          size="small"
          variant="text"
          @click="copyAPI"
        ></v-btn>
        <v-btn 
          icon="mdi-close" 
          size="small"
          variant="text"
          @click="dialog = false"
        ></v-btn>
      </v-card-title>
      
      <v-card-text>
        <div class="api-code overflow-auto">
          <pre>{{ fluent }}</pre>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  
  <v-snackbar
    v-model="copySuccess"
    :timeout="2000"
    color="success"
  >
    Copied to clipboard!
  </v-snackbar>
</template>

<script setup>
import { ref, defineExpose } from 'vue';
import { useAPIStore } from '../stores/apiStore';
import { storeToRefs } from 'pinia';

const dialog = ref(false);
const copySuccess = ref(false);

const apiStore = useAPIStore();
const { fluent } = storeToRefs(apiStore);

const copyAPI = () => {
  navigator.clipboard.writeText(fluent.value);
  copySuccess.value = true;
};

const open = () => {
  dialog.value = true;
};

// Expose methods for external components to call
defineExpose({
  open
});
</script>

<style scoped>
.api-code {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  max-height: 500px;
  overflow-y: auto;
  line-height: 1.4;
  border: 1px solid #e0e0e0;
}
</style>