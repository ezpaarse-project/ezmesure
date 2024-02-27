<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col>
          <div>
            <v-icon>mdi-timer-outline</v-icon>

            {{ $t('harvest.jobs.runningTime') }}
          </div>

          <div>
            <v-chip small outlined>
              {{ runningTime }}
            </v-chip>
          </div>
        </v-col>

        <v-col>
          <div>
            <v-icon>mdi-database-outline</v-icon>

            {{ $t('harvest.jobs.index') }}
          </div>

          <code>
            {{ harvest.index }}
          </code>
        </v-col>
      </v-row>

      <v-row v-if="harvest.result">
        <v-col>
          <v-row>
            <v-col>
              <div>
                <v-icon>mdi-calendar-blank</v-icon>

                {{ $t('harvest.jobs.coveredPeriods') }}
              </div>

              <div class="mt-1 d-flex flex-wrap" style="gap: 0.25rem">
                <v-chip
                  v-for="month in harvest.result.coveredPeriods"
                  :key="month"
                  outlined
                  small
                >
                  {{ month }}
                </v-chip>
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col class="d-flex justify-space-between">
              <v-tooltip

                v-for="chip in summary"
                :key="chip.key"
                top
              >
                <template #activator="{ on, attrs }">
                  <v-chip
                    v-bind="attrs"
                    :color="chip.color"

                    v-on="on"
                  >
                    <v-icon left>
                      {{ chip.icon }}
                    </v-icon>

                    {{ chip.value }}
                  </v-chip>
                </template>

                {{ chip.label }}
              </v-tooltip>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-row v-if="hasExceptions">
        <v-col>
          <v-row>
            <v-col>
              <div class="subtitle-2">
                {{ $t('reason', { reason: error || $t('indeterminate') }) }}
              </div>
              <div>{{ errorMeaning }}</div>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <p>{{ $t('sushi.messagesFromEndpoint') }}</p>
              <LogsPreview :logs="harvest.sushiExceptions" log-type="severity" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import { defineComponent } from 'vue';
import LogsPreview from '~/components/LogsPreview.vue';

export default defineComponent({
  components: {
    LogsPreview,
  },
  props: {
    harvest: {
      type: Object,
      required: true,
    },
  },
  computed: {
    summary() {
      if (!this.harvest.result) {
        return [];
      }

      return [
        {
          key: 'inserted',
          label: this.$t('harvest.jobs.inserted'),
          icon: 'mdi-file-download',
          color: 'success',
          value: this.harvest.result.inserted.toLocaleString(),
        },
        {
          key: 'updated',
          label: this.$t('harvest.jobs.updated'),
          icon: 'mdi-file-replace',
          color: 'info',
          value: this.harvest.result.updated.toLocaleString(),
        },
        {
          key: 'failed',
          label: this.$t('harvest.jobs.failed'),
          icon: 'mdi-file-alert',
          color: 'error',
          value: this.harvest.result.failed.toLocaleString(),
        },
      ];
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
    hasExceptions() {
      return Array.isArray(this.harvest.sushiExceptions) && this.harvest.sushiExceptions.length > 0;
    },
    runningTime() {
      if (!this.harvest.runningTime) {
        return '???';
      }

      return this.$dateFunctions.msToLocalDistance(
        this.harvest.runningTime,
        { includeSeconds: true },
      );
    },
  },
});
</script>
