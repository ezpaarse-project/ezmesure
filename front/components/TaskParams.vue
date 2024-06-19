<template>
  <v-timeline-item hide-dot>
    <div v-for="(item, i) in items" :key="i">
      <strong>
        {{ item.label }}
      </strong>

      {{ item.value }}
    </div>
  </v-timeline-item>
</template>

<script>
export default {
  props: {
    task: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    session() { return this.task?.session; },
    beginDate() { return this.session?.beginDate; },
    endDate() { return this.session?.endDate; },

    period() {
      if (this.beginDate === this.endDate) {
        return this.beginDate;
      }

      return `${this.beginDate || '...'} - ${this.endDate || '...'}`;
    },

    items() {
      return [
        { label: this.$t('tasks.params.sessionId'), value: this.task?.sessionId },
        { label: this.$t('tasks.params.reportType'), value: this.task?.reportType?.toUpperCase?.() },
        { label: this.$t('tasks.params.period'), value: this.period },
        { label: this.$t('tasks.params.index'), value: this.task?.index },
      ].filter((x) => x.value);
    },
  },
};
</script>
