<template>
  <v-chip
    v-for="tag in modelValue.tags ?? []"
    :key="tag"
    :text="tag"
    :density="density"
    :size="size"
    color="accent"
    variant="outlined"
    label
    :class="[end ? 'ml-2' : 'mr-2']"
  />
</template>

<script setup>
defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  size: {
    type: String,
    default: undefined,
  },
  density: {
    type: String,
    default: 'comfortable',
  },
  end: {
    type: Boolean,
    default: false,
  },
});
</script>
