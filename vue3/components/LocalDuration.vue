<template>
  {{ timeAgo }}
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [Date, String, Number],
    required: true,
  },
});

const timeAgo = useTimeAgo(computed(() => props.modelValue));
</script>
