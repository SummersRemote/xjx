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

                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.preservePrefixedNames"
                    label="Preserve Prefixed Names"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <!-- Transformation Strategies -->
          <v-expansion-panel>
            <v-expansion-panel-title>Transformation Strategies</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12">
                  <v-switch
                    v-model="localConfig.strategies.highFidelity"
                    label="High-Fidelity Mode (Preserve all XML information for perfect round-trip)"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="localConfig.strategies.attributeStrategy"
                    :items="attributeStrategyOptions"
                    label="Attribute Strategy"
                    hint="How to represent XML attributes in JSON"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="localConfig.strategies.textStrategy"
                    :items="textStrategyOptions"
                    label="Text Strategy"
                    hint="How to represent text content in JSON"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="localConfig.strategies.namespaceStrategy"
                    :items="namespaceStrategyOptions"
                    label="Namespace Strategy"
                    hint="How to represent namespaces in JSON"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="localConfig.strategies.arrayStrategy"
                    :items="arrayStrategyOptions"
                    label="Array Strategy"
                    hint="How to handle multiple elements with the same name"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="localConfig.strategies.emptyElementStrategy"
                    :items="emptyElementStrategyOptions"
                    label="Empty Element Strategy"
                    hint="How to represent empty elements in JSON"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="localConfig.strategies.mixedContentStrategy"
                    :items="mixedContentStrategyOptions"
                    label="Mixed Content Strategy"
                    hint="How to handle elements with both text and child elements"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-select>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <!-- Property Names -->
          <v-expansion-panel>
            <v-expansion-panel-title>Property Names</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.properties.attribute"
                    label="Attribute Property"
                    hint="Property name for attributes"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.properties.value"
                    label="Value Property"
                    hint="Property name for values"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.properties.text"
                    label="Text Property"
                    hint="Property name for text content"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.properties.namespace"
                    label="Namespace Property"
                    hint="Property name for namespaces"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.properties.prefix"
                    label="Prefix Property"
                    hint="Property name for namespace prefixes"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.properties.cdata"
                    label="CDATA Property"
                    hint="Property name for CDATA sections"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.properties.comment"
                    label="Comment Property"
                    hint="Property name for comments"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.properties.processingInstr"
                    label="Processing Instruction Property"
                    hint="Property name for processing instructions"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.properties.target"
                    label="Target Property"
                    hint="Property name for processing instruction targets"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.properties.children"
                    label="Children Property"
                    hint="Property name for child elements"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.properties.compact"
                    label="Compact Output"
                    hint="Remove empty objects/arrays in output"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <!-- Prefix Configurations -->
          <v-expansion-panel>
            <v-expansion-panel-title>Prefix Configurations</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.prefixes.attribute"
                    label="Attribute Prefix"
                    hint="Prefix for attributes when using prefix strategy"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.prefixes.namespace"
                    label="Namespace Prefix"
                    hint="Prefix for namespaces"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.prefixes.comment"
                    label="Comment Prefix"
                    hint="Prefix for comments"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.prefixes.cdata"
                    label="CDATA Prefix"
                    hint="Prefix for CDATA sections"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.prefixes.pi"
                    label="Processing Instruction Prefix"
                    hint="Prefix for processing instructions"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <!-- Array Configurations -->
          <v-expansion-panel>
            <v-expansion-panel-title>Array Configurations</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12">
                  <v-combobox
                    v-model="localConfig.arrays.forceArrays"
                    label="Force Arrays"
                    hint="Element names that should always be treated as arrays"
                    persistent-hint
                    multiple
                    chips
                    closable-chips
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-combobox>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.arrays.defaultItemName"
                    label="Default Item Name"
                    hint="Default name for items when converting JSON arrays to XML"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-divider class="my-3"></v-divider>
                
                <v-col cols="12">
                  <div class="text-subtitle-2 mb-2">Custom Item Names</div>
                  <p class="text-caption mb-2">Define custom item names for specific parent elements</p>
                  
                  <v-row v-for="(itemName, parentName) in localItemNames" :key="parentName" dense>
                    <v-col cols="12" sm="5">
                      <v-text-field
                        v-model="localItemNames[parentName].parent"
                        label="Parent Element"
                        density="compact"
                        @update:model-value="updateItemNames"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12" sm="5">
                      <v-text-field
                        v-model="localItemNames[parentName].item"
                        label="Item Name"
                        density="compact"
                        @update:model-value="updateItemNames"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12" sm="2">
                      <v-btn
                        icon="mdi-delete"
                        color="error"
                        variant="text"
                        density="compact"
                        @click="removeItemName(parentName)"
                      ></v-btn>
                    </v-col>
                  </v-row>
                  
                  <v-btn
                    prepend-icon="mdi-plus"
                    class="mt-2"
                    @click="addItemName"
                  >
                    Add Item Name
                  </v-btn>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          
          <!-- Output Formatting -->
          <v-expansion-panel>
            <v-expansion-panel-title>Output Formatting</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.formatting.pretty"
                    label="Pretty Print"
                    hint="Format output with indentation"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.formatting.declaration"
                    label="Include XML Declaration"
                    hint="Add XML declaration to the beginning of XML output"
                    persistent-hint
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="localConfig.formatting.indent"
                    label="Indent Size"
                    type="number"
                    min="0"
                    max="8"
                    hint="Number of spaces for each indentation level"
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

// Options for selects
const attributeStrategyOptions = [
  { title: 'Merge', value: 'merge' },
  { title: 'Prefix', value: 'prefix' },
  { title: 'Property', value: 'property' }
];

const textStrategyOptions = [
  { title: 'Direct', value: 'direct' },
  { title: 'Property', value: 'property' }
];

const namespaceStrategyOptions = [
  { title: 'Prefix', value: 'prefix' },
  { title: 'Property', value: 'property' }
];

const arrayStrategyOptions = [
  { title: 'Multiple (Arrays only when needed)', value: 'multiple' },
  { title: 'Always (Always create arrays)', value: 'always' },
  { title: 'Never (Last element wins)', value: 'never' }
];

const emptyElementStrategyOptions = [
  { title: 'Object (Empty object)', value: 'object' },
  { title: 'Null (null value)', value: 'null' },
  { title: 'String (Empty string)', value: 'string' }
];

const mixedContentStrategyOptions = [
  { title: 'Preserve (Keep both text and elements)', value: 'preserve' },
  { title: 'Prioritize Text', value: 'prioritize-text' },
  { title: 'Prioritize Elements', value: 'prioritize-elements' }
];

// Create a deep copy of the config for local editing
const localConfig = reactive({
  // Preservation settings
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  preserveAttributes: true,
  preservePrefixedNames: false,

  // High-level strategies - now in strategies object
  strategies: {
    highFidelity: false,
    attributeStrategy: 'merge',
    textStrategy: 'direct',
    namespaceStrategy: 'prefix',
    arrayStrategy: 'multiple',
    emptyElementStrategy: 'object',
    mixedContentStrategy: 'preserve',
  },

  // Property names
  properties: {
    attribute: "$attr",
    value: "$val",
    text: "_text",
    namespace: "$ns",
    prefix: "$pre",
    cdata: "$cdata",
    comment: "$cmnt",
    processingInstr: "$pi",
    target: "$trgt",
    children: "$children",
    compact: true
  },

  // Prefix configurations
  prefixes: {
    attribute: '@',
    namespace: 'xmlns:',
    comment: '#',
    cdata: '!',
    pi: '?'
  },

  // Array configurations
  arrays: {
    forceArrays: [],
    defaultItemName: "item",
    itemNames: {}
  },

  // Output formatting
  formatting: {
    indent: 2,
    declaration: true,
    pretty: true
  }
});

// Helper for item names management
const localItemNames = reactive({});

// Initialize localItemNames from config
function initItemNames() {
  Object.keys(localItemNames).forEach(key => delete localItemNames[key]);
  
  Object.entries(localConfig.arrays.itemNames).forEach(([parent, item]) => {
    localItemNames[parent] = { parent, item };
  });
  
  // Add an empty one if none exist
  if (Object.keys(localItemNames).length === 0) {
    addItemName();
  }
}

// Add a new item name pair
function addItemName() {
  const key = Date.now().toString();
  localItemNames[key] = { parent: '', item: '' };
}

// Remove an item name pair
function removeItemName(key) {
  delete localItemNames[key];
  updateItemNames();
}

// Update item names in the config
function updateItemNames() {
  const itemNames = {};
  
  Object.values(localItemNames).forEach(({ parent, item }) => {
    if (parent && item) {
      itemNames[parent] = item;
    }
  });
  
  localConfig.arrays.itemNames = itemNames;
  updateConfig();
}

// Update the store when the local config changes
const updateConfig = () => {
  configStore.updateConfig(JSON.parse(JSON.stringify(localConfig)));
};

// Reset config to default
const resetConfig = () => {
  configStore.resetToDefault();
  Object.assign(localConfig, JSON.parse(JSON.stringify(config.value)));
  initItemNames();
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
  initItemNames();
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
  Object.assign(localConfig, JSON.parse(JSON.stringify(config.value)));
  initItemNames();
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