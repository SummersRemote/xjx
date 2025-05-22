<!-- components/EditorPanel.vue -->
<template>
  
  <!-- Error Alert -->
  <v-alert v-if="error" type="error" variant="tonal" closable class="mt-4">
    {{ error }}
  </v-alert>

  <v-card>
    <v-card-title class="d-flex align-center">
      <v-spacer></v-spacer>
      <v-btn-group variant="outlined">
        <v-btn
          color="primary"
          @click="convertXmlToJson"
          :loading="isProcessing"
          :disabled="isProcessing"
          class="no-wrap"
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

        <v-btn color="error" @click="reset" :disabled="isProcessing">
          Reset
        </v-btn>
      </v-btn-group>
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- XML Editor -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="editor-card">
            <v-card-title
              class="py-2 px-4 bg-blue-grey-lighten-5 d-flex align-center"
            >
              <div>XML</div>
              <v-spacer></v-spacer>

              <!-- XML Sample Selector -->
              <v-select
                v-model="selectedXmlSample"
                :items="xmlSampleItems"
                item-title="name"
                item-value="index"
                label="Load Sample"
                density="compact"
                variant="outlined"
                style="max-width: 200px"
                class="me-2"
                @update:model-value="loadXmlSample"
                clearable
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{
                      item.raw.description
                    }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>

              <v-btn
                icon="mdi-content-copy"
                size="small"
                variant="text"
                @click="copyToClipboard(xml)"
              ></v-btn>
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
            <v-card-title
              class="py-2 px-4 bg-blue-grey-lighten-5 d-flex align-center"
            >
              <div>JSON</div>
              <v-spacer></v-spacer>

              <!-- JSON Sample Selector -->
              <v-select
                v-model="selectedJsonSample"
                :items="jsonSampleItems"
                item-title="name"
                item-value="index"
                label="Load Sample"
                density="compact"
                variant="outlined"
                style="max-width: 200px"
                class="me-2"
                @update:model-value="loadJsonSample"
                clearable
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{
                      item.raw.description
                    }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>

              <v-btn
                icon="mdi-content-copy"
                size="small"
                variant="text"
                @click="copyToClipboard(jsonText)"
              ></v-btn>
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

      <!-- Copy Success Snackbar -->
      <v-snackbar v-model="copySuccess" :timeout="2000" color="success">
        Copied to clipboard!
      </v-snackbar>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useEditorStore } from "../stores/editorStore";
import { useAPIStore } from "../stores/apiStore";
import { storeToRefs } from "pinia";
import { xmlSamples, jsonSamples } from "../services/sampleData";

const editorStore = useEditorStore();
const apiStore = useAPIStore();
const { xml, json, isProcessing, error, jsonFormat } = storeToRefs(editorStore);

// Sample selection state
const selectedXmlSample = ref(null);
const selectedJsonSample = ref(null);

// Create sample items for dropdowns
const xmlSampleItems = xmlSamples.map((sample, index) => ({
  ...sample,
  index,
}));

const jsonSampleItems = jsonSamples.map((sample, index) => ({
  ...sample,
  index,
}));

// Track active JSON format
const activeJsonFormat = ref(null);

// Create a computed JSON text representation
const jsonText = computed({
  get: () => {
    try {
      return typeof json.value === "string"
        ? json.value
        : JSON.stringify(json.value, null, 2);
    } catch (err) {
      return "{}";
    }
  },
  set: (value) => {
    try {
      editorStore.updateJson(JSON.parse(value));
    } catch (err) {
      // If not valid JSON, store as string
      editorStore.updateJson(value);
    }
  },
});

// For clipboard operations
const copySuccess = ref(false);

// Load XML sample
const loadXmlSample = (index) => {
  if (index !== null && index !== undefined) {
    const sample = xmlSamples[index];
    editorStore.updateXml(sample.content);
  }
};

// Load JSON sample
const loadJsonSample = (index) => {
  if (index !== null && index !== undefined) {
    const sample = jsonSamples[index];
    editorStore.updateJson(sample.content);
  }
};

// Copy content to clipboard
const copyToClipboard = (content) => {
  navigator.clipboard.writeText(content);
  copySuccess.value = true;
};

// Convert XML to XJX JSON
const convertXmlToJson = async () => {
  await editorStore.convertXmlToJson();
  apiStore.updateLastDirection("xml");
  apiStore.updateJsonFormat("xjx");
  apiStore.updateFluentAPI();

  // Clear sample selections after conversion
  selectedXmlSample.value = null;
  selectedJsonSample.value = null;
};

// Convert JSON to XML
const convertJsonToXml = async () => {
  await editorStore.convertJsonToXml();
  apiStore.updateLastDirection("json");
  apiStore.updateFluentAPI();

  // Clear sample selections after conversion
  selectedXmlSample.value = null;
  selectedJsonSample.value = null;
};

// Reset the editor
const reset = () => {
  editorStore.reset();
  activeJsonFormat.value = null;
  selectedXmlSample.value = null;
  selectedJsonSample.value = null;
  apiStore.updateFluentAPI();
};

// Watch for external changes
watch(json, () => {
  apiStore.updateFluentAPI();
});

watch(xml, () => {
  apiStore.updateFluentAPI();
});

// Watch for jsonFormat changes from the store
watch(jsonFormat, (newFormat) => {
  if (newFormat) {
    activeJsonFormat.value = newFormat;
  }
});
</script>

<style scoped>
.font-mono {
  font-family: "Courier New", Courier, monospace;
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

.no-wrap {
  white-space: nowrap;
}
</style>
