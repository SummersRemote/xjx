<!-- components/FunctionalPanel.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-function-variant" class="me-2"></v-icon>
      Functional Operations
      <v-spacer></v-spacer>
      <v-btn 
        color="error" 
        variant="text" 
        density="comfortable"
        @click="resetFunctional"
      >
        Reset
      </v-btn>
    </v-card-title>
    
    <v-card-text>
      <!-- Info Alert -->
      <v-alert
        type="info"
        variant="tonal"
        class="mb-4"
        density="compact"
      >
        <div class="text-body-2">
          Use functional operations to query and transform XML data. Operations work on the current XML content in the editor.
          <v-btn
            variant="text"
            size="small"
            color="primary"
            class="ml-2"
            @click="showHelp = !showHelp"
          >
            {{ showHelp ? 'Hide Help' : 'Show Help' }}
          </v-btn>
        </div>
      </v-alert>

      <!-- Help Section -->
      <v-expand-transition>
        <v-card
          v-show="showHelp"
          variant="outlined"
          class="mb-4 help-section"
        >
          <v-card-title class="text-subtitle-1 py-2">Quick Reference</v-card-title>
          <v-card-text class="py-2">
            <div class="text-body-2 mb-2">
              <strong>Node Properties:</strong>
            </div>
            <ul class="text-body-2 mb-3">
              <li><code>node.name</code> - Element name ('user', 'product')</li>
              <li><code>node.attributes</code> - Object with attributes</li>
              <li><code>node.children</code> - Array of child nodes</li>
              <li><code>node.value</code> - Text content</li>
              <li><code>node.type</code> - Node type (1=element, 3=text)</li>
            </ul>
            
            <div class="text-body-2 mb-2">
              <strong>Example Predicates:</strong>
            </div>
            <div class="code-examples">
              <div><code>node => node.name === 'user'</code></div>
              <div><code>node => node.attributes && node.attributes.active === 'true'</code></div>
              <div><code>node => node.children && node.children.length > 0</code></div>
              <div><code>node => node.children && node.children.some(child => child.name === 'price')</code></div>
            </div>
          </v-card-text>
        </v-card>
      </v-expand-transition>

      <!-- Predefined Examples -->
      <v-row class="mb-4">
        <v-col cols="12">
          <div class="text-subtitle-2 mb-2">Quick Examples:</div>
          <v-chip-group>
            <v-chip
              v-for="example in predefinedExamples"
              :key="example.name"
              @click="applyExample(example)"
              size="small"
              variant="outlined"
            >
              {{ example.name }}
            </v-chip>
          </v-chip-group>
        </v-col>
      </v-row>

      <!-- Operations Tabs -->
      <v-tabs v-model="activeTab" slider-color="primary" class="mb-4">
        <v-tab value="select">Global Select</v-tab>
        <v-tab value="filter">Filter</v-tab>
        <v-tab value="navigation">Navigation</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="mb-4">
        <!-- Select Operation Tab -->
        <v-window-item value="select">
          <v-card variant="outlined" class="pa-4">
            <div class="d-flex align-center mb-3">
              <v-icon icon="mdi-magnify" class="me-2"></v-icon>
              <div class="text-subtitle-1">Select Operation</div>
              <v-spacer></v-spacer>
              <v-chip
                v-if="selectResults"
                size="small"
                color="primary"
              >
                {{ selectResults.length }} nodes
              </v-chip>
            </div>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="selectPredicate"
                  label="Select Predicate (JavaScript)"
                  placeholder="node => node.name === 'user'"
                  hint="Enter a JavaScript function that returns true for nodes you want to select"
                  persistent-hint
                  rows="3"
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                ></v-textarea>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="fragmentRoot"
                  label="Fragment Root Element (Optional)"
                  hint="Container element name for multiple results"
                  persistent-hint
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-btn
                  color="primary"
                  @click="executeSelect"
                  :loading="isProcessing"
                  :disabled="!selectPredicate.trim() || !hasXmlContent"
                  block
                >
                  Execute Select
                </v-btn>
              </v-col>
            </v-row>
          </v-card>
        </v-window-item>

        <!-- Filter Operation Tab -->
        <v-window-item value="filter">
          <v-card variant="outlined" class="pa-4">
            <div class="d-flex align-center mb-3">
              <v-icon icon="mdi-filter" class="me-2"></v-icon>
              <div class="text-subtitle-1">Filter Operation</div>
              <v-spacer></v-spacer>
              <v-chip
                v-if="filterResults"
                size="small"
                color="secondary"
              >
                {{ filterResults.length }} nodes
              </v-chip>
            </div>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="filterPredicate"
                  label="Filter Predicate (JavaScript)"
                  placeholder="node => node.attributes && node.attributes.active === 'true'"
                  hint="Enter a JavaScript function to filter the current selection"
                  persistent-hint
                  rows="3"
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                ></v-textarea>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="fragmentRoot"
                  label="Fragment Root Element (Optional)"
                  hint="Container element name for multiple results"
                  persistent-hint
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-btn
                  color="secondary"
                  @click="executeFilter"
                  :loading="isProcessing"
                  :disabled="!filterPredicate.trim() || !hasSelection"
                  block
                >
                  Execute Filter
                </v-btn>
              </v-col>
            </v-row>
          </v-card>
        </v-window-item>

        <!-- Navigation Operations Tab -->
        <v-window-item value="navigation">
          <v-card variant="outlined" class="pa-4">
            <div class="d-flex align-center mb-3">
              <v-icon icon="mdi-directions" class="me-2"></v-icon>
              <div class="text-subtitle-1">Axis Navigation</div>
            </div>

            <v-row>
              <v-col cols="12">
                <v-alert
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mb-3"
                >
                  Axis navigation functions let you traverse the XML tree relative to the current context node.
                </v-alert>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="navigationPredicate"
                  label="Predicate (Optional)"
                  placeholder="node => node.name === 'item'"
                  hint="Leave empty to select all nodes in this axis"
                  persistent-hint
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="fragmentRoot"
                  label="Fragment Root Element (Optional)"
                  hint="Container element name for multiple results"
                  persistent-hint
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-btn-group variant="outlined" class="w-100">
                  <v-btn
                    color="primary"
                    @click="executeAxisNavigation('children')"
                    :loading="isProcessing"
                    :disabled="!hasSelection"
                    class="flex-grow-1"
                  >
                    Children
                  </v-btn>
                  <v-btn
                    color="primary"
                    @click="executeAxisNavigation('descendants')"
                    :loading="isProcessing"
                    :disabled="!hasSelection"
                    class="flex-grow-1"
                  >
                    Descendants
                  </v-btn>
                  <v-btn
                    color="primary"
                    @click="executeAxisNavigation('parent')"
                    :loading="isProcessing"
                    :disabled="!hasSelection"
                    class="flex-grow-1"
                  >
                    Parent
                  </v-btn>
                  <v-btn
                    color="primary"
                    @click="executeAxisNavigation('ancestors')"
                    :loading="isProcessing"
                    :disabled="!hasSelection"
                    class="flex-grow-1"
                  >
                    Ancestors
                  </v-btn>
                  <v-btn
                    color="primary"
                    @click="executeAxisNavigation('siblings')"
                    :loading="isProcessing"
                    :disabled="!hasSelection"
                    class="flex-grow-1"
                  >
                    Siblings
                  </v-btn>
                </v-btn-group>
              </v-col>
            </v-row>
          </v-card>
        </v-window-item>
      </v-window>

      <!-- Results Display -->
      <div v-if="functionalResults">
        <div class="text-subtitle-2 mb-2">Results:</div>
        <v-card variant="outlined">
          <v-card-text>
            <pre class="results-code">{{ functionalResults }}</pre>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              variant="text"
              @click="applyResultsToEditor"
            >
              Apply to Editor
            </v-btn>
            <v-btn
              color="primary"
              variant="text"
              @click="copyResults"
            >
              Copy Results
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>

      <!-- Error Display -->
      <v-alert
        v-if="functionalError"
        type="error"
        variant="tonal"
        closable
        class="mt-4"
        @click:close="functionalError = null"
      >
        {{ functionalError }}
      </v-alert>

      <!-- Copy Success Snackbar -->
      <v-snackbar
        v-model="copySuccess"
        :timeout="2000"
        color="success"
      >
        Results copied to clipboard!
      </v-snackbar>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useEditorStore } from '../stores/editorStore';
import { useFunctionalStore } from '../stores/functionalStore';
import { storeToRefs } from 'pinia';

// Stores
const editorStore = useEditorStore();
const functionalStore = useFunctionalStore();

// Reactive references
const { 
  selectPredicate, 
  filterPredicate, 
  selectResults, 
  filterResults, 
  functionalResults, 
  functionalError, 
  isProcessing 
} = storeToRefs(functionalStore);

const copySuccess = ref(false);
const showHelp = ref(false);
const activeTab = ref('select');
const fragmentRoot = ref('');
const navigationPredicate = ref('');

// Computed properties
const hasXmlContent = computed(() => {
  return editorStore.xml && editorStore.xml.trim().length > 0;
});

const hasSelection = computed(() => {
  return selectResults.value && selectResults.value.length > 0;
});

// Predefined examples
const predefinedExamples = [
  {
    name: 'Active Users',
    select: "node => node.name === 'user'",
    filter: "node => node.attributes && node.attributes.active === 'true'"
  },
  {
    name: 'Electronics Products',
    select: "node => node.name === 'product'",
    filter: "node => node.attributes && node.attributes.category === 'electronics'"
  },
  {
    name: 'In Stock Items',
    select: "node => node.name === 'product'",
    filter: "node => node.attributes && node.attributes.inStock === 'true'"
  },
  {
    name: 'High Rated Products',
    select: "node => node.name === 'product'",
    filter: "node => node.children && node.children.some(child => child.name === 'rating' && parseFloat(child.value) >= 4.5)"
  },
  {
    name: 'Engineering Users',
    select: "node => node.name === 'user'",
    filter: "node => node.children && node.children.some(child => child.name === 'department' && child.value === 'Engineering')"
  },
  {
    name: 'High Value Products',
    select: "node => node.name === 'product'",
    filter: "node => node.children && node.children.some(child => child.name === 'price' && parseFloat(child.value) > 100)"
  }
];

// Methods
const applyExample = (example) => {
  selectPredicate.value = example.select;
  filterPredicate.value = example.filter;
};

const executeSelect = async () => {
  try {
    // Pass optional fragment root
    const rootToUse = fragmentRoot.value.trim() || undefined;
    await functionalStore.executeSelect(editorStore.xml, selectPredicate.value, rootToUse);
  } catch (err) {
    console.error('Select operation failed:', err);
  }
};

const executeFilter = async () => {
  try {
    // Pass optional fragment root
    const rootToUse = fragmentRoot.value.trim() || undefined;
    await functionalStore.executeFilter(filterPredicate.value, rootToUse);
  } catch (err) {
    console.error('Filter operation failed:', err);
  }
};

const executeAxisNavigation = async (axisName) => {
  try {
    // Get predicate if specified, otherwise undefined
    const predicate = navigationPredicate.value.trim() || undefined;
    
    // Get fragment root if specified, otherwise undefined
    const rootToUse = fragmentRoot.value.trim() || undefined;
    
    // Execute navigation operation
    await functionalStore.executeAxisNavigation(axisName, predicate, rootToUse);
  } catch (err) {
    console.error(`${axisName} navigation failed:`, err);
  }
};

const applyResultsToEditor = () => {
  if (functionalResults.value) {
    editorStore.updateXml(functionalResults.value);
  }
};

const copyResults = () => {
  if (functionalResults.value) {
    navigator.clipboard.writeText(functionalResults.value);
    copySuccess.value = true;
  }
};

const resetFunctional = () => {
  functionalStore.reset();
  fragmentRoot.value = '';
  navigationPredicate.value = '';
};
</script>

<style scoped>
.results-code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.4;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.v-chip-group {
  flex-wrap: wrap;
}

.v-chip {
  margin-right: 8px;
  margin-bottom: 4px;
}

.help-section {
  background-color: #f8f9fa;
}

.code-examples {
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  line-height: 1.6;
}

.code-examples div {
  margin-bottom: 4px;
  padding: 2px 4px;
  background-color: #e9ecef;
  border-radius: 3px;
}

.code-examples code {
  background: none;
  padding: 0;
}
</style>