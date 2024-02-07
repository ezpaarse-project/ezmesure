<template>
  <v-menu
    v-model="showPopover"
    open-on-hover
    offset-x
    :close-on-content-click="false"
    bottom
    left
    nudge-width="300"
    max-width="600"
  >
    <template #activator="{ on, attrs }">
      <v-chip
        small
        outlined
        :color="color"
        v-bind="attrs"
        v-on="on"
        @click="() => !loading && !disabled && $emit('checkConnection')"
      >
        <v-avatar v-if="loading" left>
          <v-icon v-if="state === 'queued'" small>
            mdi-dots-horizontal
          </v-icon>
          <v-progress-circular
            v-else
            indeterminate
            size="14"
            width="2"
          />
        </v-avatar>

        <v-icon v-else small left>
          {{ icon }}
        </v-icon>

        {{ chipText }}

        <v-icon small right>
          mdi-chevron-down
        </v-icon>
      </v-chip>
    </template>

    <v-card>
      <v-list>
        <v-list-item>
          <v-list-item-avatar>
            <v-icon :color="color">
              {{ icon }}
            </v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>
              {{ $t(`institutions.sushi.${titleKey}`) }}
            </v-list-item-title>

            <v-list-item-subtitle v-if="date">
              {{ $t('institutions.sushi.testedOn', { date: localDate }) }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-card-text>
        {{ $t(`institutions.sushi.${titleKey}Desc`) }}
      </v-card-text>

      <v-card-text v-if="error">
        <div class="subtitle-2">
          {{ $t('reason', { reason: error || $t('indeterminate') }) }}
        </div>
        <div>{{ errorMeaning }}</div>
      </v-card-text>

      <v-card-text v-if="hasExceptions">
        <p>{{ $t('sushi.messagesFromEndpoint') }}</p>
        <LogsPreview
          :logs="exceptions"
          log-type="Severity"
          log-message="Message"
        >
          <template #message="{ log }">
            <span>{{ log.Message }}</span>
            <span v-if="log.Data" class="grey--text">({{ log.Data }})</span>
            <v-btn
              v-if="log.Help_URL"
              :href="log.Help_URL"
              target="_blank"
              color="accent"
              x-small
            >
              {{ $t('sushi.openHelpPage') }}
              <v-icon right>
                mdi-open-in-new
              </v-icon>
            </v-btn>
          </template>
        </LogsPreview>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          small
          color="primary"
          text
          :disabled="disabled"
          :loading="loading"
          @click="$emit('checkConnection')"
        >
          <v-icon left>
            mdi-connection
          </v-icon>
          {{ $t('institutions.sushi.checkCredentials') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import LogsPreview from './LogsPreview.vue';

export default {
  props: {
    connection: {
      type: Object,
      default: () => ({}),
    },
    state: {
      type: String,
      default: () => undefined,
    },
    disabled: {
      type: Boolean,
      default: () => false,
    },
  },
  components: {
    LogsPreview,
  },
  data() {
    return {
      showPopover: false,
    };
  },
  computed: {
    loading() { return ['loading', 'queued'].includes(this.state); },
    untested() { return !this.connection; },
    status() { return this.connection?.status; },
    success() { return this.status === 'success'; },
    failed() { return this.status === 'failed'; },
    unauthorized() { return this.status === 'unauthorized'; },
    date() { return this.connection?.date; },
    exceptions() { return this.connection?.exceptions; },
    hasExceptions() { return Array.isArray(this.exceptions) && this.exceptions.length > 0; },
    localDate() {
      const localDate = new Date(this.connection?.date);

      if (!this.$dateFunctions.isValid(localDate)) {
        return this.$t('invalidDate');
      }

      return this.$dateFunctions.format(localDate, 'PPPpp');
    },
    icon() {
      if (this.success) { return 'mdi-check'; }
      if (this.failed) { return 'mdi-close'; }
      if (this.unauthorized) { return 'mdi-key-alert-outline'; }
      return 'mdi-lan-pending';
    },
    color() {
      if (this.success) { return 'green'; }
      if (this.failed) { return 'red'; }
      if (this.unauthorized) { return 'orange'; }
      return 'grey';
    },
    error() {
      const errorCode = this.connection?.errorCode;
      const key = `tasks.status.exceptions.${errorCode}`;

      return (errorCode && this.$te(key)) ? this.$t(key) : undefined;
    },
    errorMeaning() {
      const errorCode = this.connection?.errorCode;
      const key = `tasks.status.exceptionMeaning.${errorCode}`;
      return (errorCode && this.$te(key)) ? this.$t(key) : undefined;
    },
    chipText() {
      if (this.success) { return this.$t('institutions.sushi.operational'); }
      if (this.failed) { return this.$t('error'); }
      if (this.unauthorized) { return this.$t('institutions.sushi.invalidCredentials'); }
      return this.$t('institutions.sushi.untested');
    },
    titleKey() {
      if (this.success) { return 'connectionSuccessful'; }
      if (this.failed) { return 'connectionFailed'; }
      if (this.unauthorized) { return 'connectionUnauthorized'; }
      return 'connectionUntested';
    },
  },
};
</script>
