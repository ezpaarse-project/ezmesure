<template>
  <v-icon-btn
    :rotate="rotate ? 180 : 0"
    :size="size"
    :icon-size="size"
    icon="$mdi-chevron-down"
    variant="text"
    hide-overlay
  />
</template>

<script setup>
defineProps({
  rotate: {
    type: Boolean,
    default: false,
  },
  size: {
    type: Number,
    default: 16,
  },
});
</script>
