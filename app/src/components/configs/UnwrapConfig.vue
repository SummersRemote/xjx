<!-- components/configs/UnwrapConfig.vue -->
<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
          class="text-caption"
        >
          <strong>Unwrap Operation:</strong><br>
          The <code>unwrap()</code> operation removes the container element and promotes its children.
          <ul class="mb-0">
            <li>If there's a single child, that child becomes the new root</li>
            <li>If there are multiple children with the same name, they're placed under a new element with that name</li>
            <li>If there are children with different names, the operation will fail</li>
          </ul>
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12">
        <v-alert
          type="warning"
          variant="tonal"
          density="compact"
          icon="mdi-alert"
          class="text-caption mt-3"
        >
          <strong>Note:</strong> This operation is destructive and removes the container element.
          Use it carefully to avoid losing document structure.
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row dense>
      <v-col cols="12" class="text-center">
        <v-chip color="primary">No configuration options required</v-chip>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// This component doesn't need any reactive state or props
// since unwrap() doesn't take any parameters
</script>