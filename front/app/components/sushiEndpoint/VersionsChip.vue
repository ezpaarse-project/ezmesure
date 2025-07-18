<template>
  <v-chip
    v-for="version in modelValue.counterVersions"
    :key="version"
    v-tooltip="$t('endpoints.counterVersionTooltip', { version })"
    :text="version"
    :color="counterVersionsColors.get(version) || 'secondary'"
    :size="size"
    :density="density"
    :class="[end ? 'ml-2' : 'mr-2']"
    variant="flat"
    label
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
