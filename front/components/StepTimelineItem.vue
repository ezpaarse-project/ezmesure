<template>
  <v-timeline-item
    small
    :color="color"
    :icon="icon"
  >
    <div>
      <strong>{{ label }}</strong>
    </div>
    <div v-if="date" class="caption">
      {{ $t('tasks.steps.startedOn', { date }) }}
    </div>
    <div v-if="duration" class="caption">
      {{ $t('tasks.steps.terminatedIn', { duration }) }}
    </div>
  </v-timeline-item>
</template>

<script>
const statusColors = new Map([
  ['running', 'blue'],
  ['finished', 'green'],
  ['failed', 'red'],
]);

const statusIcons = new Map([
  ['running', 'mdi-play'],
  ['finished', 'mdi-check'],
  ['failed', 'mdi-alert-circle-outline'],
]);

export default {
  props: {
    step: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    duration() {
      if (!Number.isInteger(this.step?.took)) { return null; }

      return this.$dateFunctions.msToLocalDistance(this.step?.took, {
        includeSeconds: true,
      });
    },
    date() {
      const startTime = new Date(this.step?.startTime);

      if (this.$dateFunctions.isValid(startTime)) {
        return this.$dateFunctions.format(startTime, 'PPPpp');
      }

      return null;
    },
    color() {
      return statusColors.get(this.step?.status) || 'grey';
    },
    icon() {
      return statusIcons.get(this.step?.status) || 'mdi-progress-question';
    },
    label() {
      const key = `tasks.steps.labels.${this.step?.label}`;
      if (this.$te(key)) {
        return this.$t(key);
      }
      return this.step?.label;
    },
  },
};
</script>
