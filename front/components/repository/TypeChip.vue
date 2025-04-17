<template>
  <v-chip
    :text="$te(`spaces.types.${modelValue.type}`) ? $t(`spaces.types.${modelValue.type}`) : modelValue.type"
    :color="repoColors.get(modelValue.type)"
    size="x-small"
    density="comfortable"
  />
</template>

<script setup>
defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});
</script>
