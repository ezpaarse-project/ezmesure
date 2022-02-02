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
    <div v-if="data.processedReportItems" class="caption">
      {{ $t('tasks.steps.processedItems', { n: data.processedReportItems }) }}
    </div>
    <div v-if="data.progress && data.progress < 100" class="caption">
      {{ $t('tasks.steps.progress', { progress: data.progress }) }}
    </div>
  </v-timeline-item>
</template>

<script>
const statusColors = new Map([
  ['running', 'blue'],
  ['finished', 'green'],
  ['failed', 'red'],
  ['interrupted', 'red'],
]);

const statusIcons = new Map([
  ['running', 'mdi-play'],
  ['finished', 'mdi-check'],
  ['failed', 'mdi-close'],
  ['interrupted', 'mdi-close'],
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
    data() {
      return this.step?.data || {};
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
