<template>
  <v-card color="black" :tile="flat" :max-height="maxHeight" class="scrolling">
    <v-card-text class="white--text">
      <div v-for="(log, index) in coloredLogs" :key="index">
        <slot v-if="log[logDate]" name="date" :log="log" class="grey--text">
          <span>{{ log[logDate] }}</span>
        </slot>

        <slot v-if="log[logType]" name="type" :log="log">
          <span :class="log.color">{{ log[logType] }}:</span>
        </slot>

        <slot v-if="log[logMessage]" name="message" :log="log" class="message">
          <span>{{ log[logMessage] }}</span>
        </slot>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
const logColors = new Map([
  ['info', 'green--text'],
  ['verbose', 'green--text'],
  ['warn', 'orange--text'],
  ['warning', 'orange--text'],
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
    logDate: {
      type: String,
      default: () => 'date',
    },
    logType: {
      type: String,
      default: () => 'type',
    },
    logMessage: {
      type: String,
      default: () => 'message',
    },
  },
  computed: {
    coloredLogs() {
      return this.logs.map((log) => ({
        ...log,
        color: logColors.get(log[this.logType]) || 'white--text',
      }));
    },
  },
};
</script>

<style scoped>
  .scrolling {
    overflow-y: auto;
  }
  .message {
    word-break: break-word;
  }
</style>
