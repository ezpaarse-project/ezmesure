<template>
  <div class="d-flex mx-4 rounded-bars">
    <div
      v-for="{ key, width, ...bar } in bars"
      :key="key"
      :style="{ width: `${width}%` }"
    >
      <v-progress-linear v-bind="bar" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  height: {
    type: [String, Number],
    default: undefined,
  },
});

const bars = computed(() => props.modelValue
  .filter((bar) => bar.value >= 0.01)
  .map((bar) => ({
    key: bar.key,
    color: bar.color,

    stream: bar.type === 'stream',
    width: bar.value * 100,
    modelValue: ['stream', 'buffer'].includes(bar.type) ? 0 : 100,
    bufferValue: bar.type === 'buffer' ? 100 : 0,

    height: props.height,
  })));
</script>

<style lang="scss" scoped>
.rounded-bars {
  width: 100%;

  & > div {
    &:first-child > div {
      border-top-left-radius: 1rem;
      border-bottom-left-radius: 1rem;
    }

    &:last-child > div {
      border-top-right-radius: 1rem;
      border-bottom-right-radius: 1rem;
    }
  }
}
</style>
