<template>
  <span>{{ localDate }}</span>
</template>

<script>
import { format, isValid } from 'date-fns';
import { fr, enGB as en } from 'date-fns/locale';

const locales = new Map([
  ['fr', fr],
  ['en', en],
]);

export default {
  props: {
    date: {
      type: String,
      default: () => '',
    },
  },
  computed: {
    localDate() {
      const localDate = new Date(this.date);
      if (!isValid(localDate)) {
        return this.$t('invalidDate');
      }

      return format(localDate, 'PPPpp', {
        locale: locales.get(this.$i18n.locale) || fr,
      });
    },
  },
};
</script>

<style scoped>
  .scrolling {
    overflow-y: auto;
  }
</style>
