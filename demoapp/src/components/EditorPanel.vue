<!-- components/EditorPanel.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      XML ⟷ JSON Converter
      <v-spacer></v-spacer>
      <v-btn-group variant="outlined">
        <v-btn
          color="primary"
          @click="convertXmlToJson"
          :loading="isProcessing"
          :disabled="isProcessing"
        >
          XML → JSON
        </v-btn>
        
        <v-btn
          color="secondary"
          @click="convertJsonToXml"
          :loading="isProcessing"
          :disabled="isProcessing"
        >
          JSON → XML
        </v-btn>
        
        <v-btn
          color="error"
          @click="reset"
          :disabled="isProcessing"
        >
          Reset
        </v-btn>
      </v-btn-group>
    </v-card-title>
    
    <v-card-text>
      <v-row>
        <!-- XML Editor -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="editor-card">
            <v-card-title class="py-2 px-4 bg-blue-grey-lighten-5 d-flex align-center">
              <div>XML</div>
              <v-spacer></v-spacer>
              <v-chip
                size="small"
                :color="activeEditor === 'xml' ? 'primary' : 'grey'"
                :variant="activeEditor === 'xml' ? 'elevated' : 'outlined'"
              >
                {{ activeEditor === 'xml' ? 'Active' : 'Inactive' }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-0">
              <v-textarea
                v-model="xml"
                auto-grow
                variant="plain"
                hide-details
                rows="15"
                density="comfortable"
                class="font-mono pa-2"
                :readonly="isProcessing"
              ></v-textarea>
            </v-card-text>
          </v-card>
        </v-col>
        
        <!-- JSON Editor -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="editor-card">
            <v-card-title class="py-2 px-4 bg-blue-grey-lighten-5 d-flex align-center">
              <div>JSON</div>
              <v-spacer></v-spacer>
              <v-chip
                size="small"
                :color="activeEditor === 'json' ? 'primary' : 'grey'"
                :variant="activeEditor === 'json' ? 'elevated' : 'outlined'"
              >
                {{ activeEditor === 'json' ? 'Active' : 'Inactive' }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-0">
              <v-textarea
                v-model="jsonText"
                auto-grow
                variant="plain"
                hide-details
                rows="15"
                density="comfortable"
                class="font-mono pa-2"
                :readonly="isProcessing"
              ></v-textarea>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Error Alert -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="mt-4"
      >
        {{ error }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useEditorStore } from '../stores/editorStore';
import { useAPIStore } from '../stores/apiStore';
import { storeToRefs } from 'pinia';

const editorStore = useEditorStore();
const apiStore = useAPIStore();
const { xml, json, activeEditor, isProcessing, error } = storeToRefs(editorStore);

// Create a computed JSON text representation
const jsonText = computed({
  get: () => {
    try {
      return typeof json.value === 'string' 
        ? json.value 
        : JSON.stringify(json.value, null, 2);
    } catch (err) {
      return '{}';
    }
  },
  set: (value) => {
    try {
      editorStore.updateJson(JSON.parse(value));
    } catch (err) {
      // If not valid JSON, store as string
      editorStore.updateJson(value);
    }
  }
});

// Update XML content
const updateXml = (value) => {
  editorStore.updateXml(value);
  apiStore.updateFluentAPI();
};

// Update JSON content
const updateJson = (value) => {
  try {
    const parsed = JSON.parse(value);
    editorStore.updateJson(parsed);
  } catch (err) {
    // If not valid JSON, store as string
    editorStore.updateJson(value);
  }
  apiStore.updateFluentAPI();
};

// Convert XML to JSON
const convertXmlToJson = async () => {
  await editorStore.convertXmlToJson();
  apiStore.updateFluentAPI();
};

// Convert JSON to XML
const convertJsonToXml = async () => {
  await editorStore.convertJsonToXml();
  apiStore.updateFluentAPI();
};

// Reset the editor
const reset = () => {
  editorStore.reset();
  apiStore.updateFluentAPI();
};

// Watch for external changes
watch(json, () => {
  apiStore.updateFluentAPI();
});

watch(xml, () => {
  apiStore.updateFluentAPI();
});
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.4;
}

.editor-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-card :deep(.v-textarea) {
  flex-grow: 1;
}
</style>