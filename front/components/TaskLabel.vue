<template>
  <v-chip
    :color="color"
    text-color="white"
    small
    label
  >
    <v-icon small left>
      {{ icon }}
    </v-icon>
    {{ statusText }}
  </v-chip>
</template>

<script>
const colors = new Map([
  ['pending', 'grey'],
  ['running', 'blue'],
  ['finished', 'green'],
  ['error', 'red'],
  ['interrupted', 'red'],
]);

const icons = new Map([
  ['pending', 'mdi-clock-outline'],
  ['running', 'mdi-play'],
  ['finished', 'mdi-check'],
  ['error', 'mdi-alert-circle-outline'],
  ['interrupted', 'mdi-progress-close'],
]);

export default {
  props: {
    status: {
      type: String,
      default: () => '',
    },
  },
  computed: {
    statusText() {
      const key = `tasks.status.${this.status}`;
      if (this.$te(key)) {
        return this.$t(key);
      }
      return this.status;
    },
    color() { return colors.get(this.status) || 'grey'; },
    icon() { return icons.get(this.status) || 'mdi-progress-question'; },
  },
};
</script>
