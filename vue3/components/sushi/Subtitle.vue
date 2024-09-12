<template>
  <div v-if="modelValue?.endpoint || modelValue?.institution">
    <span v-if="modelValue.endpoint">
      {{ modelValue.endpoint.vendor }}
      -
    </span>
    <span v-if="modelValue.institution">
      {{ modelValue.institution.acronym || modelValue.institution.name }}
      -
    </span>
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
