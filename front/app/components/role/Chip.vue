<template>
  <v-chip
    :key="role.id"
    :text="role.label"
    :prepend-icon="role.icon || 'mdi-tag-outline'"
    :color="role.color"
  />
</template>

<script setup>
defineProps({
  role: {
    type: Object,
    required: true,
  },
});
</script>
