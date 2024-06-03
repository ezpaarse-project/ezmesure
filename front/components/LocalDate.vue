<template>
  <span>{{ localDate }}</span>
</template>

<script>
export default {
  props: {
    date: {
      type: [String, Number, Date],
      default: () => '',
    },
    format: {
      type: String,
      default: () => '',
    },
  },
  computed: {
    localDate() {
      const localDate = new Date(this.date);

      if (!this.$dateFunctions.isValid(localDate)) {
        return this.$t('invalidDate');
      }

      return this.$dateFunctions.format(localDate, this.format || 'PPPpp');
    },
  },
};
</script>
