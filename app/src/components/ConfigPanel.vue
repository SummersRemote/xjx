<template>
    <v-card-text>
      <v-container fluid>
        <v-row>
          <!-- Preservation Options -->
          <v-col cols="12" md="4">
            <v-card variant="outlined" class="h-100">
              <v-card-title class="text-subtitle-1">
                <v-icon start>mdi-content-save</v-icon>
                Preservation Options
              </v-card-title>
              <v-card-text>
                <v-switch
                  v-model="store.config.preserveNamespaces"
                  label="Preserve Namespaces"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
                
                <v-switch
                  v-model="store.config.preserveComments"
                  label="Preserve Comments"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
                
                <v-switch
                  v-model="store.config.preserveProcessingInstr"
                  label="Preserve Processing Instructions"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
                
                <v-switch
                  v-model="store.config.preserveCDATA"
                  label="Preserve CDATA"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
                
                <v-switch
                  v-model="store.config.preserveTextNodes"
                  label="Preserve Text Nodes"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
                
                <v-switch
                  v-model="store.config.preserveAttributes"
                  label="Preserve Attributes"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
                
                <v-switch
                  v-model="store.config.preserveWhitespace"
                  label="Preserve Whitespace"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Output Options -->
          <v-col cols="12" md="4">
            <v-card variant="outlined" class="h-100">
              <v-card-title class="text-subtitle-1">
                <v-icon start>mdi-format-indent-increase</v-icon>
                Output Options
              </v-card-title>
              <v-card-text>
                <v-switch
                  v-model="store.config.outputOptions.prettyPrint"
                  label="Pretty Print"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
                
                <v-switch
                  v-model="store.config.outputOptions.compact"
                  label="Compact"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
                
                <v-switch
                  v-model="store.config.outputOptions.xml.declaration"
                  label="XML Declaration"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
                
                <v-row class="mt-3">
                  <v-col cols="12">
                    <v-text-field
                      v-model.number="store.config.outputOptions.indent"
                      type="number"
                      label="Indent Size"
                      min="0"
                      max="8"
                      density="compact"
                      hide-details
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Property Names -->
          <v-col cols="12" md="4">
            <v-card variant="outlined" class="h-100">
              <v-card-title class="text-subtitle-1">
                <v-icon start>mdi-rename-box</v-icon>
                Property Names
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model="store.config.propNames.namespace"
                      label="Namespace"
                      density="compact"
                      hide-details
                      class="mb-2"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="store.config.propNames.prefix"
                      label="Prefix"
                      density="compact"
                      hide-details
                      class="mb-2"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="store.config.propNames.attributes"
                      label="Attributes"
                      density="compact"
                      hide-details
                      class="mb-2"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="store.config.propNames.value"
                      label="Value"
                      density="compact"
                      hide-details
                      class="mb-2"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="store.config.propNames.cdata"
                      label="CDATA"
                      density="compact"
                      hide-details
                      class="mb-2"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="store.config.propNames.comments"
                      label="Comments"
                      density="compact"
                      hide-details
                      class="mb-2"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="store.config.propNames.instruction"
                      label="Instruction"
                      density="compact"
                      hide-details
                      class="mb-2"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="store.config.propNames.target"
                      label="Target"
                      density="compact"
                      hide-details
                      class="mb-2"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="store.config.propNames.children"
                      label="Children"
                      density="compact"
                      hide-details
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </template>
  
  <script setup>
  import { useXjxStore } from '../stores/xjxStore';
  
  // Get the store
  const store = useXjxStore();
  </script>