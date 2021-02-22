<template>
  <v-tooltip left :disabled="!connectionDate">
    <template v-slot:activator="{ on, attrs }">
      <v-chip
        :color="color"
        outlined
        label
        v-bind="attrs"
        v-on="on"
      >
        <v-icon small left>
          {{ icon }}
        </v-icon>
        {{ statusText }}
      </v-chip>
    </template>

    <div class="text-center">
      <div class="font-weight-bold" v-text="$t('sushi.connection.lastConnection')" />
      <LocalDate :date="connectionDate" />
    </div>
  </v-tooltip>
</template>

<script>
import LocalDate from '~/components/LocalDate';

export default {
  components: {
    LocalDate,
  },
  props: {
    state: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    connectionDate() {
      return this.state?.date;
    },
    statusText() {
      switch (this.state?.success) {
        case true:
          return this.$t('sushi.connection.operational');
        case false:
          return this.$t('sushi.connection.failed');
        default:
          return this.$t('sushi.connection.untested');
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
          return 'mdi-check-network-outline';
        case false:
          return 'mdi-close-network-outline';
        default:
          return 'mdi-help-network-outline';
      }
    },
  },
};
</script>
