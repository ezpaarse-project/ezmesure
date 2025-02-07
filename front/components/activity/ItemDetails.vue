<template>
  <div
    v-for="(meta, index) in metadata"
    :key="index"
  >
    <span class="font-weight-bold">{{ meta.name }}</span> <span>{{ meta.value }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
});

const metadata = computed(() => {
  const metadataItems = Object
    .entries(props.modelValue?.metadata || {})
    .map(([name, value]) => ({ name, value }));

  if (props.modelValue?.index) {
    metadataItems.push({
      name: 'index',
      value: props.modelValue?.index,
    });
  }

  return metadataItems;
});
</script>
