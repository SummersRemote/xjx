<template>
    <v-card class="mb-4">
      <v-card-title>
        <v-icon start>mdi-function</v-icon>
        Transformers
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="outlined"
          @click="togglePanel"
          size="small"
        >
          {{ showPanel ? 'Hide' : 'Show' }} Transformers
        </v-btn>
      </v-card-title>
      <v-expand-transition>
        <div v-show="showPanel">
          <v-divider></v-divider>
          <v-card-text>
            <v-container fluid>
              <!-- Active Transformers List -->
              <v-row>
                <v-col cols="12">
                  <h3 class="text-h6 mb-2">Active Transformers</h3>
                  <v-alert
                    v-if="activeTransformers.length === 0"
                    type="info"
                    variant="tonal"
                    class="mb-4"
                  >
                    No transformers configured. Add one below to get started.
                  </v-alert>
                  
                  <v-list v-else>
                    <v-list-item
                      v-for="(transformer, index) in activeTransformers"
                      :key="index"
                    >
                      <v-list-item-title>
                        <span class="font-weight-bold">{{ index + 1 }}. {{ transformer.type }}</span>
                        <v-chip
                          size="small"
                          :color="transformer.direction === 'XML_TO_JSON' ? 'primary' : 'secondary'"
                          class="ml-2"
                        >
                          {{ transformer.direction === 'XML_TO_JSON' ? 'XML → JSON' : 'JSON → XML' }}
                        </v-chip>
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        <div v-if="transformer.type === 'Boolean'">
                          True values: {{ transformer.options.trueValues?.join(', ') }},
                          False values: {{ transformer.options.falseValues?.join(', ') }}
                        </div>
                        <div v-else-if="transformer.type === 'Number'">
                          {{ transformer.options.integers ? 'Integers, ' : '' }}
                          {{ transformer.options.decimals ? 'Decimals, ' : '' }}
                          {{ transformer.options.scientific ? 'Scientific Notation' : '' }}
                        </div>
                        <div v-else-if="transformer.type === 'String'">
                          Replace: {{ transformer.options.pattern.toString() }},
                          With: {{ transformer.options.replacement }}
                        </div>
                        <div v-else-if="transformer.type === 'Filter'">
                          Exclude children named: {{ transformer.options.excludeNames?.join(', ') }}
                        </div>
                      </v-list-item-subtitle>
                      <template v-slot:append>
                        <v-btn
                          icon
                          variant="text"
                          color="error"
                          size="small"
                          @click="removeTransformer(index)"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>
  
              <!-- Add New Transformer Section -->
              <v-row class="mt-4">
                <v-col cols="12">
                  <h3 class="text-h6 mb-2">Add New Transformer</h3>
                  <v-btn-group
                    variant="outlined"
                    divided
                    class="mb-4"
                  >
                    <v-btn
                      @click="showAddForm('Boolean')"
                      prepend-icon="mdi-toggle-switch"
                      :color="newTransformer.type === 'Boolean' ? 'primary' : ''"
                    >
                      Boolean
                    </v-btn>
                    <v-btn
                      @click="showAddForm('Number')"
                      prepend-icon="mdi-numeric"
                      :color="newTransformer.type === 'Number' ? 'primary' : ''"
                    >
                      Number
                    </v-btn>
                    <v-btn
                      @click="showAddForm('String')"
                      prepend-icon="mdi-find-replace"
                      :color="newTransformer.type === 'String' ? 'primary' : ''"
                    >
                      String Replace
                    </v-btn>
                    <v-btn
                      @click="showAddForm('Filter')"
                      prepend-icon="mdi-filter"
                      :color="newTransformer.type === 'Filter' ? 'primary' : ''"
                    >
                      Filter Children
                    </v-btn>
                  </v-btn-group>
                </v-col>
              </v-row>
  
              <!-- Dynamic Form Based on Selected Transformer Type -->
              <v-expand-transition>
                <div v-if="newTransformer.type">
                  <v-divider class="my-4"></v-divider>
                  
                  <!-- Common Direction Selection -->
                  <v-row>
                    <v-col cols="12">
                      <v-radio-group
                        v-model="newTransformer.direction"
                        inline
                        label="Transform Direction"
                        mandatory
                      >
                        <v-radio
                          label="XML to JSON"
                          value="XML_TO_JSON"
                        ></v-radio>
                        <v-radio
                          label="JSON to XML"
                          value="JSON_TO_XML"
                        ></v-radio>
                      </v-radio-group>
                    </v-col>
                  </v-row>
  
                  <!-- Boolean Transformer Form -->
                  <div v-if="newTransformer.type === 'Boolean'">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="newTransformer.options.trueValues"
                          label="True Values (comma separated)"
                          hint="Values to convert to true (e.g. true,yes,1,on)"
                          persistent-hint
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="newTransformer.options.falseValues"
                          label="False Values (comma separated)"
                          hint="Values to convert to false (e.g. false,no,0,off)"
                          persistent-hint
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-switch
                          v-model="newTransformer.options.ignoreCase"
                          label="Ignore Case"
                          color="primary"
                          hide-details
                        ></v-switch>
                      </v-col>
                    </v-row>
                  </div>
  
                  <!-- Number Transformer Form -->
                  <div v-if="newTransformer.type === 'Number'">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-switch
                          v-model="newTransformer.options.integers"
                          label="Convert Integers"
                          color="primary"
                          hide-details
                        ></v-switch>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-switch
                          v-model="newTransformer.options.decimals"
                          label="Convert Decimals"
                          color="primary"
                          hide-details
                        ></v-switch>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-switch
                          v-model="newTransformer.options.scientific"
                          label="Convert Scientific Notation"
                          color="primary"
                          hide-details
                        ></v-switch>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-switch
                          v-model="newTransformer.options.strictParsing"
                          label="Strict Parsing"
                          color="primary"
                          hide-details
                        ></v-switch>
                      </v-col>
                    </v-row>
                  </div>
  
                  <!-- String Replace Transformer Form -->
                  <div v-if="newTransformer.type === 'String'">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="newTransformer.options.pattern"
                          label="Pattern to Replace"
                          hint="String or regex pattern to find"
                          persistent-hint
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="newTransformer.options.replacement"
                          label="Replacement String"
                          hint="String to replace with"
                          persistent-hint
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-switch
                          v-model="newTransformer.options.ignoreCase"
                          label="Ignore Case"
                          color="primary"
                          hide-details
                        ></v-switch>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-switch
                          v-model="newTransformer.options.replaceAll"
                          label="Replace All Occurrences"
                          color="primary"
                          hide-details
                        ></v-switch>
                      </v-col>
                    </v-row>
                  </div>
  
                  <!-- Filter Children Transformer Form -->
                  <div v-if="newTransformer.type === 'Filter'">
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="newTransformer.options.excludeNames"
                          label="Element Names to Exclude (comma separated)"
                          hint="Child elements with these names will be filtered out"
                          persistent-hint
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-switch
                          v-model="newTransformer.options.ignoreCase"
                          label="Ignore Case"
                          color="primary"
                          hide-details
                        ></v-switch>
                      </v-col>
                    </v-row>
                  </div>
  
                  <!-- Add Transformer Button -->
                  <v-row class="mt-4">
                    <v-col cols="12" class="d-flex">
                      <v-spacer></v-spacer>
                      <v-btn
                        color="error"
                        variant="outlined"
                        @click="cancelAdd"
                        class="mr-2"
                      >
                        Cancel
                      </v-btn>
                      <v-btn
                        color="primary"
                        @click="addTransformer"
                        :disabled="!isValidTransformerConfig"
                      >
                        Add Transformer
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>
  
              <!-- Clear All Transformers Button -->
              <v-row class="mt-4" v-if="activeTransformers.length > 0">
                <v-col cols="12" class="d-flex justify-center">
                  <v-btn
                    color="error"
                    variant="outlined"
                    prepend-icon="mdi-delete-sweep"
                    @click="clearAllTransformers"
                  >
                    Clear All Transformers
                  </v-btn>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </div>
      </v-expand-transition>
    </v-card>
  </template>
  
  <script setup>
  import { ref, computed, reactive, onMounted } from 'vue';
  import { useXjxStore } from '../stores/xjxStore';
  import XjxService from '../services/xjxService';
  
  // Get the store
  const store = useXjxStore();
  
  // Panel visibility state
  const showPanel = ref(false);
  
  // Track active transformers
  const activeTransformers = ref([]);
  
  // New transformer state
  const newTransformer = reactive({
    type: '',
    direction: 'XML_TO_JSON',
    options: {}
  });
  
  // Load active transformers
  const refreshTransformers = () => {
    // In real implementation, we'd get this from the XJX instance
    // For demo purposes, we'll pretend we can retrieve them
    // In a real app, you'd track them as they're added
    activeTransformers.value = [];
  };
  
  // Initialize component
  onMounted(() => {
    refreshTransformers();
  });
  
  // Toggle panel visibility
  const togglePanel = () => {
    showPanel.value = !showPanel.value;
  };
  
  // Show form for adding a specific transformer type
  const showAddForm = (type) => {
    newTransformer.type = type;
    newTransformer.direction = 'XML_TO_JSON';
    
    // Set default options based on the transformer type
    if (type === 'Boolean') {
      newTransformer.options = {
        trueValues: 'true,yes,1,on',
        falseValues: 'false,no,0,off',
        ignoreCase: true
      };
    } else if (type === 'Number') {
      newTransformer.options = {
        integers: true,
        decimals: true,
        scientific: true,
        strictParsing: true
      };
    } else if (type === 'String') {
      newTransformer.options = {
        pattern: '',
        replacement: '',
        ignoreCase: false,
        replaceAll: true
      };
    } else if (type === 'Filter') {
      newTransformer.options = {
        excludeNames: '',
        ignoreCase: false
      };
    }
  };
  
  // Validate transformer configuration
  const isValidTransformerConfig = computed(() => {
    if (!newTransformer.type || !newTransformer.direction) {
      return false;
    }
    
    if (newTransformer.type === 'String') {
      return !!newTransformer.options.pattern && newTransformer.options.replacement !== undefined;
    }
    
    if (newTransformer.type === 'Filter') {
      return !!newTransformer.options.excludeNames;
    }
    
    return true;
  });
  
  // Add a new transformer
  const addTransformer = () => {
    try {
      // Process the options based on transformer type
      const processedOptions = { ...newTransformer.options };
      
      // Process string inputs for arrays
      if (newTransformer.type === 'Boolean') {
        processedOptions.trueValues = newTransformer.options.trueValues.split(',').map(v => v.trim());
        processedOptions.falseValues = newTransformer.options.falseValues.split(',').map(v => v.trim());
      } else if (newTransformer.type === 'Filter') {
        processedOptions.excludeNames = newTransformer.options.excludeNames.split(',').map(v => v.trim());
      }
      
      // Create the appropriate transformer type
      let transformer;
      if (newTransformer.type === 'Boolean') {
        transformer = XjxService.addBooleanTransformer(
          newTransformer.direction,
          processedOptions
        );
      } else if (newTransformer.type === 'Number') {
        transformer = XjxService.addNumberTransformer(
          newTransformer.direction,
          processedOptions
        );
      } else if (newTransformer.type === 'String') {
        transformer = XjxService.addStringReplaceTransformer(
          newTransformer.direction,
          processedOptions
        );
      } else if (newTransformer.type === 'Filter') {
        transformer = XjxService.addFilterChildrenTransformer(
          newTransformer.direction,
          processedOptions
        );
      }
      
      // Add to our local tracking array for UI display
      activeTransformers.value.push({
        type: newTransformer.type,
        direction: newTransformer.direction,
        options: processedOptions,
        instance: transformer
      });
      
      // Show success notification
      store.showNotification('Transformer added', 'success', 2000);
      
      // Reset form
      cancelAdd();
    } catch (error) {
      store.showNotification(`Error adding transformer: ${error.message}`, 'error', 3000);
    }
  };
  
  // Cancel adding a transformer
  const cancelAdd = () => {
    newTransformer.type = '';
    newTransformer.direction = 'XML_TO_JSON';
    newTransformer.options = {};
  };
  
  // Remove a transformer
  const removeTransformer = (index) => {
    if (confirm('Are you sure you want to remove this transformer?')) {
      // Remove from our tracking array
      activeTransformers.value.splice(index, 1);
      
      // In a real implementation, you would need to retrieve all transformers
      // from the XJX instance, clear them all, and re-add the remaining ones
      // For our demo, we'll reset and re-add all transformers
      XjxService.clearTransformers();
      
      // Re-add all remaining transformers
      for (const transformer of activeTransformers.value) {
        // Apply each transformer again
        if (transformer.type === 'Boolean') {
          XjxService.addBooleanTransformer(
            transformer.direction,
            transformer.options
          );
        } else if (transformer.type === 'Number') {
          XjxService.addNumberTransformer(
            transformer.direction,
            transformer.options
          );
        } else if (transformer.type === 'String') {
          XjxService.addStringReplaceTransformer(
            transformer.direction,
            transformer.options
          );
        } else if (transformer.type === 'Filter') {
          XjxService.addFilterChildrenTransformer(
            transformer.direction,
            transformer.options
          );
        }
      }
      
      store.showNotification('Transformer removed', 'info', 2000);
    }
  };
  
  // Clear all transformers
  const clearAllTransformers = () => {
    if (confirm('Are you sure you want to remove all transformers?')) {
      // Clear our tracking array
      activeTransformers.value = [];
      
      // Clear all transformers from the XJX instance
      XjxService.clearTransformers();
      
      store.showNotification('All transformers cleared', 'info', 2000);
    }
  };
  </script>