<template>
  <div>
    <v-row>
      <v-col>
        <v-row>
          <v-col>
            {{ sessionName }}

            <span class="text--secondary mx-2" style="font-size: 0.75em;">
              ({{ session.id }})
            </span>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <template v-for="tag in chips">
              <v-tooltip
                v-if="!tag.hide"
                :key="tag.key"
                :disabled="!tag.tooltip"
                top
              >
                <template #activator="{ attrs, on }">
                  <v-chip
                    outlined
                    small
                    class="mr-2"
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-icon v-if="tag.icon" left small>
                      {{ tag.icon }}
                    </v-icon>

                    {{ tag.text }}
                  </v-chip>
                </template>

                {{ tag.tooltip || '' }}
              </v-tooltip>
            </template>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="4" align-self="center">
        <v-row>
          <v-col v-if="hasStarted" class="d-flex align-center">
            <div style="width: 32px">
              <v-progress-circular
                v-if="status?.isActive"
                color="primary"
                width="2"
                indeterminate
              />
            </div>

            <v-menu
              :disabled="!metrics"
              transition="slide-y-transition"
              open-on-hover
              bottom
              offset-y
            >
              <template #activator="{ attrs, on }">
                <div style="flex: 1;" v-bind="attrs" v-on="on">
                  <ProgressLinearStack
                    :value="bars"
                    height="8"
                  />
                </div>
              </template>

              <v-simple-table>
                <template #default>
                  <tbody>
                    <template v-for="row in table">
                      <tr v-if="row.value > 0" :key="row.key">
                        <td>
                          <v-icon
                            v-if="row.header.icon"
                            :color="row.header.color"
                            class="mr-2"
                          >
                            {{ row.header.icon }}
                          </v-icon>

                          {{ row.header.text }}
                        </td>

                        <td>{{ row.value }}</td>
                      </tr>
                    </template>
                  </tbody>
                </template>
              </v-simple-table>
            </v-menu>
          </v-col>

          <v-col v-else align-self="center" style="text-align: end;">
            <v-chip color="error">
              {{ $t('harvest.sessions.notStarted') }}
            </v-chip>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { parseISO } from 'date-fns';
import ProgressLinearStack from '~/components/ProgressLinearStack.vue';

const STATUS_ICONS = {
  success: { icon: 'mdi-check', color: 'green' },
  failed: { icon: 'mdi-alert-circle-outline', color: 'red' },
  active: { icon: 'mdi-play', color: 'blue' },
  delayed: { icon: 'mdi-update', color: 'blue' },
  pending: { icon: 'mdi-clock-outline' },
};

export default defineComponent({
  components: {
    ProgressLinearStack,
  },
  props: {
    session: {
      type: Object,
      required: true,
    },
    status: {
      type: Object,
      default: () => undefined,
    },
    hasStarted: {
      type: Boolean,
      default: () => false,
    },
  },
  computed: {
    sessionName() {
      if (this.hasStarted) {
        const startedAt = this.$dateFunctions.format(parseISO(this.session.startedAt), 'PPPp');
        return this.$t('harvest.sessions.name', { startedAt });
      }
      return this.$t('harvest.sessions.pendingSession');
    },
    runningTime() {
      return this.$dateFunctions.msToLocalDistance(
        this.status?.runningTime,
        { format: ['days', 'hours', 'minutes', 'seconds'] },
      );
    },
    counts() {
      return {
        reportTypes: this.session.reportTypes.length,
        // eslint-disable-next-line no-underscore-dangle
        credentials: this.status?._count.credentials ?? {},
      };
    },
    metrics() {
      // eslint-disable-next-line no-underscore-dangle
      const count = this.status?._count;
      if (!count) {
        return undefined;
      }

      const { jobStatuses } = count;
      return {
        pending: jobStatuses.waiting ?? 0,
        success: jobStatuses.finished ?? 0,
        active: jobStatuses.running ?? 0,
        delayed: jobStatuses.delayed ?? 0,
        failed: (jobStatuses.failed ?? 0)
          + (jobStatuses.interrupted ?? 0)
          + (jobStatuses.cancelled ?? 0),
      };
    },
    table() {
      return Object.entries(this.metrics ?? {})
        .map(([name, value]) => ({
          key: name,
          header: {
            ...STATUS_ICONS[name],
            text: this.$t(`harvest.sessions.metrics.${name}`),
          },
          value,
        }));
    },
    bars() {
      if (!this.status) {
        return [
          {
            key: `${this.session.id}-unknown`,
            type: 'buffer',
            value: 1,
            color: 'primary',
          },
        ];
      }

      // eslint-disable-next-line no-underscore-dangle
      const getValue = (value) => (value / this.session._count.jobs);

      return [
        {
          key: `${this.session.id}-success`,
          color: 'success',
          value: getValue(this.metrics.success),
        },
        {
          key: `${this.session.id}-failed`,
          color: 'error',
          value: getValue(this.metrics.failed),
        },
        {
          key: `${this.session.id}-active`,
          color: 'blue',
          value: getValue(this.metrics.active),
        },
        {
          key: `${this.session.id}-delayed`,
          type: 'buffer',
          color: 'blue',
          value: getValue(this.metrics.delayed),
        },
        {
          key: `${this.session.id}-pending`,
          type: 'stream',
          color: 'grey',
          value: getValue(this.metrics.pending),
        },
      ];
    },
    chips() {
      return [
        {
          key: `${this.session.id}-period`,
          icon: 'mdi-calendar-range',
          text: `${this.session.beginDate} ~ ${this.session.endDate}`,
        },
        {
          key: `${this.session.id}-credentials`,
          icon: 'mdi-key',
          text: this.$tc(
            'harvest.sessions.counts.credentials',
            this.counts.credentials.harvestable ?? this.counts.credentials.all,
          ),
          tooltip: this.$t('harvest.sessions.credentialsTooltip', this.counts.credentials),
        },
        {
          key: `${this.session.id}-reports`,
          icon: 'mdi-file',
          text: this.$tc('harvest.sessions.counts.reportTypes', this.counts.reportTypes),
          tooltip: this.session.reportTypes.join(', ').toUpperCase(),
        },
        {
          key: `${this.session.id}-runningTime`,
          icon: 'mdi-timer-outline',
          hide: !this.status?.runningTime,
          text: this.runningTime,
        },
      ];
    },
  },
});
</script>

<style>
</style>
