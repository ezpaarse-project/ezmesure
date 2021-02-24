<template>
  <span>{{ duration }}</span>
</template>

<script>
export default {
  props: {
    ms: {
      type: Number,
      default: () => 0,
    },
    includeSeconds: {
      type: Boolean,
      default: () => false,
    },
  },
  computed: {
    duration() {
      return this.$dateFunctions.msToLocalDistance(this.ms, {
        includeSeconds: this.includeSeconds,
      });
    },
  },
};
</script>
