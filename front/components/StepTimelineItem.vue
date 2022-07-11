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
    <v-sheet
      v-if="data.url"
      class="mt-2 pa-2"
      style="word-break: break-all;"
      rounded
      elevation="1"
    >
      <div><strong>{{ $t('url') }}</strong></div>
      {{ data.url }}
      <v-btn x-small outlined color="primary" @click="copyToClipboard(data.url)">
        <v-icon small class="mr-1">
          mdi-clipboard-text
        </v-icon>
        {{ $t('clipboard.copy') }}
      </v-btn>
    </v-sheet>
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
  methods: {
    async copyToClipboard(str) {
      if (!navigator.clipboard) {
        this.$store.dispatch('snacks/error', this.$t('clipboard.unableToCopy'));
        return;
      }

      try {
        await navigator.clipboard.writeText(str);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('clipboard.unableToCopy'));
        return;
      }

      this.$store.dispatch('snacks/info', this.$t('clipboard.textCopied'));
    },
  },
};
</script>
