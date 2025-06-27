<template>
  {{ label }}
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const { locale } = useI18n();

const label = computed(() => {
  const key = `${locale.value[0].toUpperCase()}${locale.value.slice(1)}`;
  return props.modelValue[`label${key}`] || props.modelValue.labelEn;
});
</script>
