<template>
  {{ timeAgo }}
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [Date, String, Number],
    required: true,
  },
  includeSeconds: {
    type: Boolean,
    default: false,
  },
});

const timeAgo = useTimeAgo(
  () => props.modelValue,
  { includeSeconds: props.includeSeconds },
);
</script>
