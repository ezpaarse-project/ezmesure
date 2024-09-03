<template>
  <div v-if="modelValue">
    {{ modelValue?.name }}
    -
    <v-chip
      :text="typeChip.text"
      :color="typeChip.color"
      size="small"
      density="compact"
      label
      class="mr-1"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
});

const typeChip = computed(() => ({
  text: t(`spaces.types.${props.modelValue?.type}`),
  color: repoColors.get(props.modelValue?.type),
}));
</script>
