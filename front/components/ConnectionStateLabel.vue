<template>
  <v-chip
    :color="color"
    outlined
    label
  >
    <v-icon small left>
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
