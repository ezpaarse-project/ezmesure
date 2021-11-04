<template>
  <v-progress-circular
    v-if="loading"
    size="15"
    width="2"
    indeterminate
    color="primary"
  />
  <v-icon v-else-if="success === true" color="green" small>
    mdi-lan-connect
  </v-icon>
  <v-icon v-else-if="success === false" color="red" small>
    mdi-lan-disconnect
  </v-icon>
  <v-icon v-else color="grey" small>
    mdi-lan-pending
  </v-icon>
</template>

<script>
export default {
  props: {
    connection: {
      type: Object,
      default: () => ({}),
    },
    loading: {
      type: Boolean,
      default: () => false,
    },
  },
  data() {
    return {};
  },
  computed: {
    success() { return this.connection?.success; },
  },
};
</script>
