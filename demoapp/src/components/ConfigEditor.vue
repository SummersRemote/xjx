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
          
          <!-- Output Options -->
          <v-expansion-panel>
            <v-expansion-panel-title>Output Options</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.outputOptions.prettyPrint"
                    label="Pretty Print"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.outputOptions.compact"
                    label="Compact Output"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-switch
                    v-model="localConfig.outputOptions.xml.declaration"
                    label="Include XML Declaration"
                    color="primary"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="localConfig.outputOptions.indent"
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
          
          <!-- Property Names -->
          <v-expansion-panel>
            <v-expansion-panel-title>Property Names</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.propNames.namespace"
                    label="Namespace"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.propNames.prefix"
                    label="Prefix"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.propNames.attributes"
                    label="Attributes"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.propNames.value"
                    label="Value"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.propNames.cdata"
                    label="CDATA"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.propNames.comments"
                    label="Comments"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.propNames.instruction"
                    label="Instruction"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.propNames.target"
                    label="Target"
                    hide-details
                    density="compact"
                    @update:model-value="updateConfig"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="localConfig.propNames.children"
                    label="Children"
                    hide-details
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
import { useAPIStore } from '../stores/apiStore';
import { storeToRefs } from 'pinia';

const dialog = ref(false);
const copySuccess = ref(false);

const configStore = useConfigStore();
const apiStore = useAPIStore();
const { config } = storeToRefs(configStore);

// Create a deep copy of the config for local editing
const localConfig = reactive(JSON.parse(JSON.stringify(config.value)));

// Update the store when the local config changes
const updateConfig = () => {
  configStore.updateConfig(JSON.parse(JSON.stringify(localConfig)));
  apiStore.updateFluentAPI();
};

// Reset config to default
const resetConfig = () => {
  configStore.resetToDefault();
  Object.assign(localConfig, JSON.parse(JSON.stringify(config.value)));
  apiStore.updateFluentAPI();
};

// Copy configuration to clipboard
const copyConfig = () => {
  navigator.clipboard.writeText(JSON.stringify(localConfig, null, 2));
  copySuccess.value = true;
};

// Watch for external config changes
watch(config, (newConfig) => {
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
  // Update API display when component mounts
  apiStore.updateFluentAPI();
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