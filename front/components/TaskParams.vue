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
    params: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    harvestId() { return this.params?.harvestId; },
    reportType() { return this.params?.reportType?.toUpperCase?.(); },
    index() { return this.params?.index; },
    beginDate() { return this.params?.beginDate; },
    endDate() { return this.params?.endDate; },

    period() {
      if (this.beginDate === this.endDate) {
        return this.beginDate;
      }

      return `${this.beginDate || '...'} - ${this.endDate || '...'}`;
    },

    items() {
      return [
        { label: this.$t('tasks.params.harvestId'), value: this.params?.harvestId },
        { label: this.$t('tasks.params.reportType'), value: this.params?.reportType?.toUpperCase?.() },
        { label: this.$t('tasks.params.period'), value: this.period },
        { label: this.$t('tasks.params.index'), value: this.params?.index },
      ].filter((x) => x.value);
    },
  },
};
</script>
