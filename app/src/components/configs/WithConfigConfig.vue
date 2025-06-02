<!-- components/configs/WithConfigConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-textarea
          v-model="localOptions.config"
          label="Configuration JSON"
          hint="JSON object containing configuration properties to update"
          persistent-hint
          auto-grow
          rows="8"
          density="compact"
          variant="outlined"
          class="font-mono"
          :error="hasJsonError"
          :error-messages="jsonErrorMessage"
          @update:model-value="updateOptions"
        ></v-textarea>
      </v-col>
    </v-row>

    <!-- JSON Validation Status -->
    <v-row dense v-if="hasJsonError">
      <v-col cols="12">
        <v-alert
          type="error"
          variant="text"
          density="compact"
          icon="mdi-alert-circle"
        >
          <strong>Invalid JSON:</strong> {{ jsonErrorMessage }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Help Section -->
    <v-expansion-panels variant="accordion" class="mt-4">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-help-circle" size="small" class="me-2"></v-icon>
          Help
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-alert type="info" variant="text" density="compact">
            <strong>With Config Operation:</strong><br>
            The <code>withConfig()</code> operation allows you to update configuration settings 
            mid-pipeline. This is useful for changing transformation behavior based on intermediate results.<br>
            <br>
            <strong>Commonly Updated Mid-Pipeline Properties:</strong><br>
            - <code>strategies</code>: Change transformation strategies (highFidelity, attributeStrategy, etc.)<br>
            - <code>properties</code>: Update property names for output format<br>
            - <code>formatting</code>: Change output formatting (indent, pretty print)<br>
            - <code>fragmentRoot</code>: Change container name for functional operations<br>
            <br>
            <strong>Example Usage Pattern:</strong><br>
            1. <code>fromXml(source)</code> - Parse with initial config<br>
            2. <code>filter(node => node.name === 'item')</code> - Filter to items only<br>
            3. <code>withConfig({ strategies: { highFidelity: true } })</code> - Switch to high-fidelity<br>
            4. <code>toJson()</code> - Output with updated config<br>
            <br>
            <strong>API:</strong> <code>withConfig(configObject)</code><br>
            The configuration object is merged with existing configuration.
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Configuration Examples -->
    <v-expansion-panels variant="accordion" class="mt-2">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-code-json" size="small" class="me-2"></v-icon>
          Configuration Examples
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="text-caption mb-2"><strong>Switch to High-Fidelity Mode:</strong></div>
          <v-card variant="outlined" class="pa-2 mb-3">
            <pre class="text-caption font-mono">{{ exampleHighFidelity }}</pre>
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              @click="loadExample('highFidelity')"
            >
              Load Example
            </v-btn>
          </v-card>

          <div class="text-caption mb-2"><strong>Change Output Format:</strong></div>
          <v-card variant="outlined" class="pa-2 mb-3">
            <pre class="text-caption font-mono">{{ exampleOutputFormat }}</pre>
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              @click="loadExample('outputFormat')"
            >
              Load Example
            </v-btn>
          </v-card>

          <div class="text-caption mb-2"><strong>Update Array Handling:</strong></div>
          <v-card variant="outlined" class="pa-2">
            <pre class="text-caption font-mono">{{ exampleArrayHandling }}</pre>
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              @click="loadExample('arrayHandling')"
            >
              Load Example
            </v-btn>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';

const props = defineProps({
  value: {
    type: Object,
    default: () => ({
      config: JSON.stringify({
        strategies: {
          highFidelity: false,
          attributeStrategy: "merge",
          textStrategy: "direct"
        },
        formatting: {
          indent: 2,
          pretty: true
        }
      }, null, 2)
    })
  }
});

const emit = defineEmits(['update']);

// Create a local reactive copy of the props
const localOptions = reactive({
  config: props.value.config || JSON.stringify({
    strategies: {
      highFidelity: false,
      attributeStrategy: "merge"
    },
    formatting: {
      indent: 2,
      pretty: true
    }
  }, null, 2)
});

// JSON validation
const jsonErrorMessage = computed(() => {
  try {
    JSON.parse(localOptions.config);
    return '';
  } catch (err) {
    return err.message;
  }
});

const hasJsonError = computed(() => {
  return jsonErrorMessage.value !== '';
});

// Example configurations
const exampleHighFidelity = `{
  "strategies": {
    "highFidelity": true,
    "attributeStrategy": "property"
  }
}`;

const exampleOutputFormat = `{
  "properties": {
    "attribute": "@attrs",
    "value": "text",
    "children": "elements"
  },
  "formatting": {
    "indent": 4,
    "pretty": true
  }
}`;

const exampleArrayHandling = `{
  "strategies": {
    "arrayStrategy": "always"
  },
  "arrays": {
    "forceArrays": ["item", "product"],
    "defaultItemName": "element"
  }
}`;

// Load example configurations
const loadExample = (exampleType) => {
  switch (exampleType) {
    case 'highFidelity':
      localOptions.config = exampleHighFidelity;
      break;
    case 'outputFormat':
      localOptions.config = exampleOutputFormat;
      break;
    case 'arrayHandling':
      localOptions.config = exampleArrayHandling;
      break;
  }
  updateOptions();
};

// Emit changes to the parent
const updateOptions = () => {
  // Only emit if JSON is valid
  if (!hasJsonError.value) {
    emit('update', { ...localOptions });
  }
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
  if (newValue) {
    localOptions.config = newValue.config || '{}';
  }
}, { deep: true });
</script>

<style scoped>
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>