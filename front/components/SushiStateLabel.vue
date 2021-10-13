<template>
  <v-chip
    :color="color"
    outlined
    label
  >
    <v-icon v-if="icon" small left>
      {{ icon }}
    </v-icon>
    {{ statusText }}
  </v-chip>
</template>

<script>
export default {
  props: {
    state: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    lastStep() {
      if (!Array.isArray(this.state?.steps)) { return null; }
      return this.state.steps[this.state.steps.length - 1];
    },
    statusText() {
      switch (this.state?.success) {
        case true:
          return this.$t('sushi.states.finished');
        case false:
          if (this.lastStep?.status !== 'finished') {
            const translateKey = `sushi.states.failedStep.${this.lastStep?.label}`;
            if (this.$te(translateKey)) {
              return this.$t(translateKey);
            }
          }
          return this.$t('sushi.states.failed');
        default:
          return this.$t('sushi.states.untested');
      }
    },
    color() {
      switch (this.state?.success) {
        case true:
          return 'green';
        case false:
          return 'red';
        default:
          return 'grey';
      }
    },
    icon() {
      switch (this.state?.success) {
        case true:
          return 'mdi-check';
        case false:
          return 'mdi-alert-circle-outline';
        default:
          return null;
      }
    },
  },
};
</script>
