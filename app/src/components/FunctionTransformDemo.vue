<!-- components/FunctionTransformDemo.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-cog-transfer-outline" class="me-2"></v-icon>
      Function + Transform Integration Demo
      <v-spacer></v-spacer>
      <v-btn 
        color="primary" 
        variant="text" 
        density="comfortable" 
        @click="runDemo"
        :loading="isProcessing"
      >
        Run Demo
      </v-btn>
    </v-card-title>
    
    <v-card-text>
      <!-- Explanation -->
      <v-alert
        type="info"
        variant="tonal"
        class="mb-4"
        density="compact"
      >
        <div class="text-body-2">
          This demo shows how the new <code>transform()</code> function integrates with the functional pipeline.
          It enables seamless operations on XML data by combining navigation, transformation, and filtering.
        </div>
      </v-alert>
      
      <!-- Example Tabs -->
      <v-tabs v-model="activeTab" slider-color="primary" class="mb-4">
        <v-tab value="simple">Price Filtering</v-tab>
        <v-tab value="complex">Discount Pipeline</v-tab>
        <v-tab value="navigation">Navigation + Transform</v-tab>
      </v-tabs>
      
      <v-window v-model="activeTab" class="mb-4">
        <!-- Simple Example -->
        <v-window-item value="simple">
          <v-card variant="outlined" class="pa-3">
            <div class="font-weight-bold mb-2">Example: Find all prices over $100</div>
            <div class="code-block mb-3">
              <pre>const result = new XJX()
  .fromXml(catalogXml)
  .select(node => node.name === 'price')
  .transform(new NumberTransform())
  .filter(node => node.value > 100)
  .toXmlString();</pre>
            </div>
            <div class="text-body-2">
              This example shows how to:
              <ol>
                <li>Select all price elements</li>
                <li>Transform their string values to numbers</li>
                <li>Filter to only keep prices over $100</li>
              </ol>
            </div>
          </v-card>
        </v-window-item>
        
        <!-- Complex Example -->
        <v-window-item value="complex">
          <v-card variant="outlined" class="pa-3">
            <div class="font-weight-bold mb-2">Example: Apply 10% discount to in-stock products</div>
            <div class="code-block mb-3">
              <pre>const result = new XJX()
  .fromXml(catalogXml)
  .select(node => node.name === 'product' && 
          node.attributes.status === 'in-stock')
  .children(node => node.name === 'price')
  .transform(new NumberTransform())
  .map(node => {
    node.value = node.value * 0.9; // 10% discount
    return node;
  })
  .transform(new RegexTransform({
    pattern: /^(\d+)\.(\d+)$/,
    replacement: '$$$1.$2' // Add dollar sign
  }))
  .toXmlString();</pre>
            </div>
            <div class="text-body-2">
              This more complex example:
              <ol>
                <li>Finds all in-stock products</li>
                <li>Navigates to their price elements</li>
                <li>Converts prices to numbers</li>
                <li>Applies a 10% discount</li>
                <li>Formats them back as currency strings</li>
              </ol>
            </div>
          </v-card>
        </v-window-item>
        
        <!-- Navigation Example -->
        <v-window-item value="navigation">
          <v-card variant="outlined" class="pa-3">
            <div class="font-weight-bold mb-2">Example: Navigation with transforms</div>
            <div class="code-block mb-3">
              <pre>const result = new XJX()
  .fromXml(catalogXml)
  .select(node => node.name === 'category' && 
          node.attributes.id === 'electronics')
  .descendants(node => node.name === 'price')
  .transform(new NumberTransform())
  .filter(node => node.value > 500)
  .transform(new RegexTransform({
    pattern: /(\d+)\.(\d+)/,
    replacement: '$$$1.$2 (Premium Product)'
  }))
  .toXmlString();</pre>
            </div>
            <div class="text-body-2">
              This example demonstrates combining navigation and transforms:
              <ol>
                <li>Finds the electronics category</li>
                <li>Gets all price descendants (any level deep)</li>
                <li>Converts prices to numbers</li>
                <li>Filters to premium products (price > $500)</li>
                <li>Formats them with special premium label</li>
              </ol>
            </div>
          </v-card>
        </v-window-item>
      </v-window>
      
      <!-- Results Display -->
      <div v-if="demoResults">
        <div class="text-subtitle-2 mb-2">Demo Results:</div>
        <v-card variant="outlined">
          <v-card-text>
            <pre class="results-code">{{ demoResults }}</pre>
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
        v-if="demoError"
        type="error"
        variant="tonal"
        closable
        class="mt-4"
        @click:close="demoError = null"
      >
        {{ demoError }}
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
import { BooleanTransform, NumberTransform, RegexTransform } from '../../../dist/esm/index.js';
import { XJX } from '../../../dist/esm/index.js';

// Stores
const editorStore = useEditorStore();

// Reactive references
const activeTab = ref('simple');
const isProcessing = ref(false);
const demoResults = ref(null);
const demoError = ref(null);
const copySuccess = ref(false);

// Computed properties
const hasXmlContent = computed(() => {
  return editorStore.xml && editorStore.xml.trim().length > 0;
});

// Run the selected demo
const runDemo = async () => {
  isProcessing.value = true;
  demoError.value = null;
  
  try {
    // Use the XML from the editor or fallback to sample
    const xml = hasXmlContent.value ? editorStore.xml : getSampleXml();
    
    let result;
    
    // Run the appropriate demo based on the active tab
    switch (activeTab.value) {
      case 'simple':
        result = await runPriceFilteringDemo(xml);
        break;
      case 'complex':
        result = await runDiscountPipelineDemo(xml);
        break;
      case 'navigation':
        result = await runNavigationTransformDemo(xml);
        break;
      default:
        result = await runPriceFilteringDemo(xml);
    }
    
    demoResults.value = result;
  } catch (err) {
    demoError.value = `Demo execution failed: ${err.message}`;
    console.error('Demo execution error:', err);
  } finally {
    isProcessing.value = false;
  }
};

// Price filtering demo
const runPriceFilteringDemo = async (xml) => {
  const result = new XJX()
    .fromXml(xml)
    .select(node => node.name === 'price')
    .transform(new NumberTransform())
    .filter(node => node.value > 100)
    .toXmlString();
  
  return result;
};

// Discount pipeline demo
const runDiscountPipelineDemo = async (xml) => {
  const result = new XJX()
    .fromXml(xml)
    .select(node => node.name === 'product' && 
            node.attributes.status === 'in-stock')
    .children(node => node.name === 'price')
    .transform(new NumberTransform())
    .map(node => {
      node.value = node.value * 0.9; // 10% discount
      return node;
    })
    .transform(new RegexTransform({
      pattern: /^(\d+)\.(\d+)$/,
      replacement: '$$$1.$2' // Add dollar sign
    }))
    .toXmlString();
  
  return result;
};

// Navigation with transform demo
const runNavigationTransformDemo = async (xml) => {
  const result = new XJX()
    .fromXml(xml)
    .select(node => node.name === 'category' && 
            node.attributes.id === 'electronics')
    .descendants(node => node.name === 'price')
    .transform(new NumberTransform())
    .filter(node => node.value > 500)
    .transform(new RegexTransform({
      pattern: /(\d+)\.(\d+)/,
      replacement: '$$$1.$2 (Premium Product)'
    }))
    .toXmlString();
  
  return result;
};

// Apply results to editor
const applyResultsToEditor = () => {
  if (demoResults.value) {
    editorStore.updateXml(demoResults.value);
  }
};

// Copy results to clipboard
const copyResults = () => {
  if (demoResults.value) {
    navigator.clipboard.writeText(demoResults.value);
    copySuccess.value = true;
  }
};

// Sample XML if none is provided in editor
const getSampleXml = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<catalog id="main-catalog">
  <category id="electronics" name="Electronics">
    <description>Electronic devices and accessories</description>
    <product id="p1001" status="in-stock">
      <n>Smartphone Pro</n>
      <price currency="USD">999.99</price>
      <specifications>
        <spec name="screen">6.7 inch OLED</spec>
        <spec name="processor">A15 Bionic</spec>
      </specifications>
    </product>
    <product id="p1002" status="low-stock">
      <n>Wireless Headphones</n>
      <price currency="USD">199.99</price>
      <specifications>
        <spec name="type">Over-ear</spec>
        <spec name="battery">30 hours</spec>
      </specifications>
    </product>
  </category>
  <category id="books" name="Books">
    <description>Bestselling books in various genres</description>
    <product id="p2001" status="in-stock">
      <n>The Great Novel</n>
      <price currency="USD">24.99</price>
      <specifications>
        <spec name="format">Hardcover</spec>
        <spec name="pages">432</spec>
      </specifications>
    </product>
  </category>
</catalog>`;
};
</script>

<style scoped>
.code-block {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.4;
}

.results-code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.4;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>