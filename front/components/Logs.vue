<template>
  <v-card color="black" :tile="flat" :max-height="maxHeight" class="scrolling">
    <v-card-text class="white--text">
      <div v-for="(log, index) in coloredLogs" :key="index">
        <span v-if="log.date" class="grey--text" v-text="log.date" />
        <span v-if="log.type" :class="log.color">
          {{ log.type }} :
        </span>
        <span v-if="log.message" v-text="log.message" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
const logColors = new Map([
  ['info', 'green--text'],
  ['verbose', 'green--text'],
  ['warn', 'orange--text'],
  ['error', 'red--text'],
]);

export default {
  props: {
    logs: {
      type: Array,
      default: () => ([]),
    },
    maxHeight: {
      type: String,
      default: null,
    },
    flat: {
      type: Boolean,
      default: () => false,
    },
  },
  computed: {
    coloredLogs() {
      return this.logs.map(log => ({
        ...log,
        color: logColors.get(log.type) || 'white--text',
      }));
    },
  },
};
</script>

<style scoped>
  .scrolling {
    overflow-y: auto;
  }
</style>
