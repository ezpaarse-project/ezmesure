<template>
  <div class="d-flex mx-4 rounded-bars">
    <div v-for="{ key, width, ...bar } in bars" :key="key" :style="{ width: `${width}%` }">
      <v-progress-linear v-bind="bar" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    value: { type: Array, required: true },
    height: { type: [String, Number], default: undefined },
  },
  computed: {
    bars() {
      return this.value
        .filter((bar) => bar.value >= 0.01)
        .map((bar) => ({
          key: bar.key,
          color: bar.color,

          stream: bar.type === 'stream',
          width: bar.value * 100,
          value: ['stream', 'buffer'].includes(bar.type) ? 0 : 100,
          bufferValue: bar.type === 'buffer' ? 100 : 0,

          height: this.height,
        }));
    },
  },
});
</script>

<style scoped>
.rounded-bars > div:first-child > div {
  border-top-left-radius: 1rem;
  border-bottom-left-radius: 1rem;
}
.rounded-bars > div:last-child > div {
  border-top-right-radius: 1rem;
  border-bottom-right-radius: 1rem;
}
</style>
