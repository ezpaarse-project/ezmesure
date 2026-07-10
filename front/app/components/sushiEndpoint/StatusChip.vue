<template>
  <div class="d-inline">
    <v-icon
      v-if="!modelValue.registryId"
      v-tooltip:top="$t('endpoints.registryDescription')"
      :density="density"
      :size="size"
      icon="mdi-link-variant-off"
      color="warning"
      :class="[end ? 'ml-2' : 'mr-2']"
    />

    <v-icon
      v-if="!modelValue.active"
      v-tooltip:top="$t('endpoints.inactiveDescription')"
      :density="density"
      :size="size"
      icon="mdi-api-off"
      color="warning"
      :class="[end ? 'ml-2' : 'mr-2']"
    />
  </div>
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
