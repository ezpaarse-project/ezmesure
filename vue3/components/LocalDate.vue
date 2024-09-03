<template>
  {{ localDate }}
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [Date, String, Number],
    required: true,
  },
  format: {
    type: String,
    default: undefined,
  },
});

const localDate = useDateFormat(
  computed(() => props.modelValue),
  computed(() => props.format),
);
</script>
