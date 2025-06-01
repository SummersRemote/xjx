<!-- components/configs/MergeConfig.vue -->
<template>
  <v-container>
    <!-- Info Message -->
    <v-alert
      type="info"
      variant="text"
      density="compact"
      class="mb-4"
    >
      <strong>No Configuration Required</strong><br>
      The merge operation automatically integrates the current branch scope back into the parent document.
    </v-alert>

    <!-- Help Section -->
    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption">
          <v-icon icon="mdi-help-circle" size="small" class="me-2"></v-icon>
          Help
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-alert type="info" variant="text" density="compact">
            <strong>Merge Operation:</strong><br>
            The <code>merge()</code> operation merges the current branch scope back into the parent
            document using subset replacement strategy.<br>
            <br>
            <strong>Merge Behavior:</strong><br>
            - Whatever nodes exist in the branch when <code>merge()</code> is called become the replacement set<br>
            - Nodes are replaced at the position of the first originally branched node<br>
            - Relative order of replacement nodes is preserved<br>
            - Other parent nodes maintain their positions<br>
            <br>
            <strong>Example Workflow:</strong><br>
            1. <code>branch(node => node.name === 'price')</code> - Create branch with price nodes<br>
            2. <code>map(toNumber({ precision: 2 }))</code> - Transform prices in branch<br>
            3. <code>merge()</code> - Replace original prices with transformed ones<br>
            <br>
            <strong>Important:</strong> <code>merge()</code> without an active branch is ignored silently.
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup>
// Merge operation has no configuration options
// This component serves as a placeholder and provides help information
</script>