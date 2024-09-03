<template>
  <div v-if="modelValue?.endpoint">
    {{ modelValue.endpoint.vendor }}
    -
    <v-chip
      v-for="(pkg, index) in modelValue.packages"
      :key="index"
      :text="pkg"
      size="small"
      density="compact"
      label
      class="mr-1"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
});
</script>
