<!-- components/EditorPanel.vue -->
<template>
  <!-- Error Alert -->
  <v-alert v-if="error" type="error" variant="tonal" closable class="mt-4">
    {{ error }}
  </v-alert>

  <v-card>
    <v-card-title class="d-flex align-center">
      <!-- <v-spacer></v-spacer>
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
      </v-btn-group> -->
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- XML Editor -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="editor-card">
            <v-toolbar flat color="primary" dark>
              <!-- <v-card-title class="py-0 pr-4">XML</v-card-title> -->

              <v-btn
                class="py-0 pl-4"
                variant="outlined"
                @click="convertXmlToJson"
                :loading="isProcessing"
                :disabled="isProcessing"
              >
                XML → JSON
              </v-btn>
              <!-- XML Sample Selector -->
              <v-select
                class="py-0 pl-4"
                v-model="selectedXmlSample"
                :items="xmlSampleItems"
                :item-props="itemProps"
                item-value="index"
                label="Load Sample"
                density="compact"
                variant="outlined"
                hide-details
                style="max-width: 200px"
                @update:model-value="loadXmlSample"
              >
              </v-select>

              <v-spacer></v-spacer>

              <v-btn
                icon="mdi-content-copy"
                size="small"
                variant="text"
                @click="copyToClipboard(xml)"
              ></v-btn>
            </v-toolbar>

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
            <v-toolbar flat color="primary" dark>
              <!-- <v-card-title class="py-0 pr-4">JSON</v-card-title> -->
              <v-btn
                class="py-0 pl-4"
                variant="outlined"
                @click="convertJsonToXml"
                :loading="isProcessing"
                :disabled="isProcessing"
              >
                JSON → XML
              </v-btn>
              <!-- JSON Sample Selector -->
              <v-select
                class="py-0 pl-4"
                v-model="selectedJsonSample"
                :items="jsonSampleItems"
                :item-props="itemProps"
                item-value="index"
                label="Load Sample"
                density="compact"
                variant="outlined"
                hide-details
                style="max-width: 200px"
                @update:model-value="loadJsonSample"
              >
              </v-select>

              <v-spacer></v-spacer>

              <v-btn
                icon="mdi-content-copy"
                size="small"
                variant="text"
                @click="copyToClipboard(jsonText)"
              ></v-btn>
            </v-toolbar>

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

function itemProps(item) {
  return {
    title: item.name,
    subtitle: item.description,
  };
}

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
