<template>
  <v-chip
    :color="color"
    text-color="white"
    small
    label
    v-on="$listeners"
  >
    <v-icon v-if="icon" small left>
      {{ icon }}
    </v-icon>
    {{ statusText }}
  </v-chip>
</template>

<script>
import { colors, icons } from './harvest/state';

export default {
  props: {
    task: {
      type: Object,
      default: () => null,
    },
  },
  computed: {
    status() { return this.task?.status; },
    color() { return colors.get(this.status) || 'grey'; },
    icon() { return icons.get(this.status); },
    lastStep() {
      if (Array.isArray(this.task?.steps)) {
        return this.task.steps[this.task.steps.length - 1];
      }
      return null;
    },
    statusText() {
      if (!this.task) {
        return this.$t('tasks.status.notLaunchedYet');
      }

      if (this.status === 'error' && this.lastStep?.status !== 'finished') {
        const sushiCode = this.lastStep?.data?.sushiErrorCode;

        if (sushiCode) {
          const key = `tasks.status.exceptions.${sushiCode}`;
          if (this.$te(key)) {
            return this.$t(key);
          }
        }

        const translateKey = `tasks.failedStep.${this.lastStep?.label}`;

        if (this.$te(translateKey)) {
          return this.$t(translateKey);
        }
      }

      const key = `tasks.status.${this.status}`;
      if (this.$te(key)) {
        return this.$t(key);
      }
      return this.status;
    },
  },
};
</script>
