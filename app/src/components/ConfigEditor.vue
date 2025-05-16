<!-- components/ConfigEditor.vue -->
<template>
  <v-dialog
    v-model="dialog"
    max-width="800px"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        Configuration
        <v-spacer></v-spacer>
        <v-btn 
          color="error" 
          variant="text" 
          density="comfortable" 
          @click="resetConfig"
        >
          Reset to Default
        </v-btn>
        <v-btn 
          icon="mdi-close" 
          size="small"
          variant="text"
          @click="dialog = false"
        ></v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-expansion-panels variant="accordion">
          <!-- Feature Preservation -->
          <v-expansion-panel>
            <v-expansion-panel-title>Feature Preservation</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.preserveNamespaces"
                    label="Preserve Namespaces"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.preserveComments"
                    label="Preserve Comments"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.preserveProcessingInstr"
                    label="Preserve Processing Instructions"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.preserveCDATA"
                    label="Preserve CDATA"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.preserveTextNodes"
                    label="Preserve Text Nodes"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.preserveWhitespace"
                    label="Preserve Whitespace"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.preserveAttributes"
                    label="Preserve Attributes"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <!-- XML Output Options -->
          <v-expansion-panel>
            <v-expansion-panel-title>XML Options</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.converters.xml.options.prettyPrint"
                    label="Pretty Print"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.converters.xml.options.declaration"
                    label="Include XML Declaration"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="localConfig.converters.xml.options.indent"
                    label="Indent Size"
                    type="number"
                    min="0"
                    max="8"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <!-- XJX JSON Options -->
          <v-expansion-panel>
            <v-expansion-panel-title>XJX JSON Options</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.converters.xjxJson.options.compact"
                    label="Compact Output"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
              </v-row>
              
              <v-divider class="my-3"></v-divider>
              <div class="text-subtitle-2 mb-2">Property Names</div>
              
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.xjxJson.naming.namespace"
                    label="Namespace"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.xjxJson.naming.prefix"
                    label="Prefix"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.xjxJson.naming.attribute"
                    label="Attributes"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.xjxJson.naming.value"
                    label="Value"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.xjxJson.naming.cdata"
                    label="CDATA"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.xjxJson.naming.comment"
                    label="Comments"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.xjxJson.naming.processingInstr"
                    label="Processing Instruction"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.xjxJson.naming.target"
                    label="Target"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.xjxJson.naming.children"
                    label="Children"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <!-- Standard JSON Options -->
          <v-expansion-panel>
            <v-expansion-panel-title>Standard JSON Options</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="localConfig.converters.stdJson.options.attributeHandling"
                    :items="attributeHandlingOptions"
                    label="Attribute Handling"
                    hint="How to handle XML attributes in standard JSON"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.stdJson.options.attributePrefix"
                    label="Attribute Prefix"
                    hint="Prefix to use for attributes if handling is 'prefix'"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.stdJson.options.attributePropertyName"
                    label="Attribute Property Name"
                    hint="Property name to use for attributes if handling is 'property'"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.stdJson.options.textPropertyName"
                    label="Text Property Name"
                    hint="Property to use for element text content when there are attributes or children"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.converters.stdJson.options.alwaysCreateArrays"
                    label="Always Create Arrays"
                    hint="Always group elements with the same name into arrays"
                    persistent-hint
                    hide-details="auto"
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.converters.stdJson.options.preserveMixedContent"
                    label="Preserve Mixed Content"
                    hint="Preserve text nodes in elements with both text and child elements"
                    persistent-hint
                    hide-details="auto"
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.converters.stdJson.options.emptyElementsAsNull"
                    label="Empty Elements As Null"
                    hint="Convert empty elements to null instead of empty objects"
                    persistent-hint
                    hide-details="auto"
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
              </v-row>
              
              <v-divider class="my-3"></v-divider>
              <div class="text-subtitle-2 mb-2">Naming Options</div>
              
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.converters.stdJson.naming.arrayItem"
                    label="Array Item Name"
                    hint="Default name for array items when converting from standard JSON to XML"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <!-- Configuration Object -->
          <v-expansion-panel>
            <v-expansion-panel-title>Current Configuration</v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="config-json overflow-auto">
                <pre>{{ JSON.stringify(localConfig, null, 2) }}</pre>
              </div>
              <div class="d-flex justify-end mt-2">
                <v-btn 
                  icon="mdi-content-copy" 
                  size="small"
                  variant="text"
                  @click="copyConfig"
                ></v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
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
import { ref, reactive, onMounted, watch, defineExpose } from 'vue';
import { useConfigStore } from '../stores/configStore';
import { storeToRefs } from 'pinia';

const dialog = ref(false);
const copySuccess = ref(false);

const configStore = useConfigStore();
const { config } = storeToRefs(configStore);

// Attribute handling options
const attributeHandlingOptions = [
  { title: 'Ignore', value: 'ignore' },
  { title: 'Merge', value: 'merge' },
  { title: 'Prefix', value: 'prefix' },
  { title: 'Property', value: 'property' }
];

// Create a deep copy of the config for local editing
const localConfig = reactive(JSON.parse(JSON.stringify(config.value)));

// Ensure the nested config structure exists
if (!localConfig.converters) {
  localConfig.converters = {
    stdJson: {
      options: {
        attributeHandling: 'ignore',
        attributePrefix: '@',
        attributePropertyName: '_attrs',
        textPropertyName: '_text',
        alwaysCreateArrays: false,
        preserveMixedContent: true,
        emptyElementsAsNull: false
      },
      naming: {
        arrayItem: "item"
      }
    },
    xjxJson: {
      options: {
        compact: true
      },
      naming: {
        namespace: "$ns",
        prefix: "$pre",
        attribute: "$attr",
        value: "$val",
        cdata: "$cdata",
        comment: "$cmnt",
        processingInstr: "$pi",
        target: "$trgt",
        children: "$children"
      }
    },
    xml: {
      options: {
        declaration: true,
        prettyPrint: true,
        indent: 2
      }
    }
  };
}

// Update the store when the local config changes
const updateConfig = () => {
  configStore.updateConfig(JSON.parse(JSON.stringify(localConfig)));
};

// Reset config to default
const resetConfig = () => {
  configStore.resetToDefault();
  Object.assign(localConfig, JSON.parse(JSON.stringify(config.value)));
};

// Copy configuration to clipboard
const copyConfig = () => {
  navigator.clipboard.writeText(JSON.stringify(localConfig, null, 2));
  copySuccess.value = true;
};

// Watch for external config changes
watch(config, (newConfig) => {
  // Deep copy to avoid reference issues
  Object.assign(localConfig, JSON.parse(JSON.stringify(newConfig)));
}, { deep: true });

// Open dialog
const open = () => {
  dialog.value = true;
};

// Expose methods for external components to call
defineExpose({
  open
});

onMounted(() => {
  // Make sure we have the full config structure when mounting
  if (!localConfig.converters) {
    Object.assign(localConfig, JSON.parse(JSON.stringify(config.value)));
  }
});
</script>

<style scoped>
.config-json {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: monospace;
  max-height: 300px;
  overflow-y: auto;
}
</style>