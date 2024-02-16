<template>
  <v-menu
    offset-y
    open-on-hover
    close-delay="200"
    v-on="$listeners"
  >
    <template #activator="{ on, attrs }">
      <v-avatar
        :color="color"
        :size="36"
        v-bind="attrs"
        v-on="on"
      >
        <v-icon dark>
          {{ icon }}
        </v-icon>
      </v-avatar>
    </template>

    <v-card min-width="350px" max-width="500px">
      <v-card-title primary-title>
        {{ statusText }}
      </v-card-title>

      <v-card-subtitle>
        {{ harvestedAt }}
      </v-card-subtitle>

      <v-divider />

      <v-card-text>
        <p>{{ statusDescription }}</p>

        <i18n v-if="insertedItems" path="sushi.insertedItems">
          <template #count>
            <strong>{{ insertedItems }}</strong>
          </template>
        </i18n>
        <i18n v-if="updatedItems" path="sushi.updatedItems">
          <template #count>
            <strong>{{ updatedItems }}</strong>
          </template>
        </i18n>
        <i18n v-if="failedItems" path="sushi.failedItems">
          <template #count>
            <strong>{{ failedItems }}</strong>
          </template>
        </i18n>

        <template v-if="status === 'failed'">
          <div class="subtitle-2">
            {{ $t('reason', { reason: error || $t('indeterminate') }) }}
          </div>
          <div>{{ errorMeaning }}</div>
        </template>
      </v-card-text>

      <template v-if="hasExceptions">
        <v-divider />

        <v-card-text>
          <p>{{ $t('sushi.messagesFromEndpoint') }}</p>
          <LogsPreview :logs="sushiExceptions" log-type="severity" />
        </v-card-text>
      </template>
    </v-card>
  </v-menu>
</template>

<script>
import LogsPreview from '~/components/LogsPreview.vue';

const colors = new Map([
  ['waiting', 'grey'],
  ['running', 'blue'],
  ['finished', 'green'],
  ['failed', 'red'],
  ['interrupted', 'red'],
  ['cancelled', 'red'],
  ['delayed', 'blue'],
]);

const icons = new Map([
  ['waiting', 'mdi-clock-outline'],
  ['running', 'mdi-play'],
  ['finished', 'mdi-check'],
  ['failed', 'mdi-exclamation'],
  ['interrupted', 'mdi-progress-close'],
  ['cancelled', 'mdi-cancel'],
  ['delayed', 'mdi-update'],
]);

export default {
  components: {
    LogsPreview,
  },
  props: {
    harvest: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    status() { return this.harvest?.status; },
    color() { return colors.get(this.status) || 'grey'; },
    icon() { return icons.get(this.status); },
    insertedItems() { return this.harvest?.insertedItems || 0; },
    updatedItems() { return this.harvest?.updatedItems || 0; },
    failedItems() { return this.harvest?.failedItems || 0; },
    hasExceptions() {
      return Array.isArray(this.sushiExceptions) && this.sushiExceptions.length > 0;
    },
    harvestedAt() {
      const localDate = new Date(this.harvest?.harvestedAt);

      if (!this.$dateFunctions.isValid(localDate)) {
        return this.$t('invalidDate');
      }

      return this.$dateFunctions.format(localDate, 'PPPp');
    },
    error() {
      const errorCode = this.harvest?.errorCode;
      const key = `tasks.status.exceptions.${errorCode}`;

      return (errorCode && this.$te(key)) ? this.$t(key) : undefined;
    },
    errorMeaning() {
      const errorCode = this.harvest?.errorCode;
      const key = `tasks.status.exceptionMeaning.${errorCode}`;
      return (errorCode && this.$te(key)) ? this.$t(key) : undefined;
    },
    sushiExceptions() {
      return this.harvest?.sushiExceptions;
    },
    statusText() {
      const key = `tasks.status.${this.status}`;
      if (this.$te(key)) {
        return this.$t(key);
      }
      return this.status;
    },
    statusDescription() {
      const key = `tasks.statusDescriptions.${this.status}`;
      if (this.$te(key)) {
        return this.$t(key);
      }
      return '';
    },
  },
};
</script>
