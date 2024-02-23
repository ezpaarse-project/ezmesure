<template>
  <section>
    <ToolBar :title="$t('menu.harvest').toString()">
      <v-spacer />

      <v-btn
        color="primary"
        text
        :loading="refreshing"
        @click.stop="refreshHarvests"
      >
        <v-icon left>
          mdi-refresh
        </v-icon>
        {{ $t('refresh') }}
      </v-btn>
    </ToolBar>

    <v-data-iterator
      :items="sessionItems"
      :loading="refreshing"
      :options.sync="iteratorOptions"
      :server-items-length="sessionsCount"
      item-key="id"
      @update:options="refreshHarvests"
    >
      <template #default="{ items }">
        <v-expansion-panels>
          <v-expansion-panel
            v-for="item in items"
            :key="item.data.id"
            :readonly="item.data._count.jobs <= 0"
          >
            <v-expansion-panel-header>
              <div style="flex: 1">
                <div class="mb-2">
                  {{ $t('harvest.sessions.name', { createdAt: item.createdAtLocale }) }}

                  <span class="text--secondary mx-2" style="font-size: 0.75em;">
                    ({{ item.data.id }})
                  </span>
                </div>

                <div class="d-flex flex-wrap" style="gap: 0.5rem">
                  <v-tooltip
                    v-for="tag in sessionChips[item.data.id]"
                    :key="tag.key"
                    :disabled="!tag.tooltip"
                    bottom
                  >
                    <template #activator="{ attrs, on }">
                      <v-chip
                        outlined
                        small
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
                </div>
              </div>

              <div
                class="d-flex align-center flex-row-reverse mr-2"
                style="flex: 0.4"
              >
                <div v-if="!item.hasStarted" style="text-align: end;">
                  <v-chip color="error">
                    {{ $t('harvest.sessions.notStarted') }}
                  </v-chip>
                </div>
                <template v-else>
                  <v-menu
                    :disabled="!item.status.metrics"
                    transition="slide-y-transition"
                    nudge-bottom="2"
                    open-on-hover
                    bottom
                    offset-y
                  >
                    <template #activator="{ attrs, on }">
                      <div style="flex: 1;" v-bind="attrs" v-on="on">
                        <ProgressLinearStack
                          :value="item.bars"
                          height="8"
                        />
                      </div>
                    </template>

                    <v-simple-table>
                      <template #default>
                        <tbody>
                          <template
                            v-for="([name, count]) in Object.entries(item.status.metrics ?? {})"
                          >
                            <tr
                              v-if="count > 0"
                              :key="name"
                            >
                              <td>
                                <v-icon
                                  v-if="statusIcons[name]"
                                  :color="statusIcons[name].color"
                                  class="mr-2"
                                >
                                  {{ statusIcons[name].icon }}
                                </v-icon>
                                {{ $t(`harvest.sessions.metrics.${name}`) }}
                              </td>
                              <td>{{ count }}</td>
                            </tr>
                          </template>
                        </tbody>
                      </template>
                    </v-simple-table>
                  </v-menu>

                  <v-progress-circular
                    v-if="item.status.isActive"
                    color="primary"
                    width="2"
                    indeterminate
                  />
                  <div v-else style="width: 32px;" />
                </template>
              </div>
            </v-expansion-panel-header>

            <v-expansion-panel-content>
              <HarvestJobTable
                :ref="(ref) => (tables[item.data.id] = ref)"
                :session-id="item.data.id"
                :disabled-filters="['harvestId']"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </v-data-iterator>
  </section>
</template>

<script>
import { defineComponent } from 'vue';
import { parseISO } from 'date-fns';
import ProgressLinearStack from '~/components/ProgressLinearStack.vue';
import ToolBar from '~/components/space/ToolBar.vue';
import HarvestJobTable from '~/components/harvest/HarvestJobTable.vue';

export default defineComponent({
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ProgressLinearStack,
    ToolBar,
    HarvestJobTable,
  },
  data: () => ({
    refreshing: false,

    iteratorOptions: {},

    sessions: [],
    sessionsCount: 0,
    sessionStatuses: {},

    tables: {},
    openedTooltips: {},

    statusIcons: {
      success: { icon: 'mdi-check', color: 'green' },
      failed: { icon: 'mdi-alert-circle-outline', color: 'red' },
      active: { icon: 'mdi-play', color: 'blue' },
      delayed: { icon: 'mdi-update', color: 'blue' },
      pending: { icon: 'mdi-clock-outline' },
    },
  }),
  computed: {
    sessionItems() {
      return this.sessions.map((item) => {
        const status = this.sessionStatuses[item.id];

        return {
          data: item,
          status: status ?? {},
          // eslint-disable-next-line no-underscore-dangle
          hasStarted: Object.keys(status?._count.jobStatuses ?? {}).length > 0,

          counts: this.computeCounts(item),
          bars: this.computeBars(item),

          createdAtLocale: this.$dateFunctions.format(parseISO(item.createdAt), 'PPPpp'),

          runningTime: this.$dateFunctions.msToLocalDistance(
            status?.runningTime,
            { format: ['days', 'hours', 'minutes', 'seconds'] },
          ),

        };
      });
    },
    sessionChips() {
      const chipsPerSession = {};

      // eslint-disable-next-line no-restricted-syntax
      for (const item of this.sessionItems) {
        chipsPerSession[item.data.id] = [
          {
            key: `${item.data.id}-period`,
            icon: 'mdi-calendar-range',
            text: `${item.data.beginDate} ~ ${item.data.endDate}`,
          },
          {
            key: `${item.data.id}-institutions`,
            icon: 'mdi-domain',
            text: this.$tc('harvest.sessions.counts.institutions', item.counts.institutions),
          },
          {
            key: `${item.data.id}-endpoints`,
            icon: 'mdi-web',
            text: this.$tc('harvest.sessions.counts.endpoints', item.counts.endpoints),
          },
          {
            key: `${item.data.id}-credentials`,
            icon: 'mdi-key',
            text: this.$tc(
              'harvest.sessions.counts.credentials',
              item.counts.credentials.harvestable || item.counts.credentials.total,
            ),
            tooltip: this.$t('harvest.sessions.credentialsTooltip', item.counts.credentials),
          },
          {
            key: `${item.data.id}-reports`,
            icon: 'mdi-file',
            text: this.$tc('harvest.sessions.counts.reportTypes', item.counts.reportTypes),
          },
          {
            key: `${item.data.id}-runningTime`,
            icon: 'mdi-timer-outline',
            text: item.runningTime,
          },
        ];
      }

      return chipsPerSession;
    },
  },
  methods: {
    computeMetrics(session) {
      // eslint-disable-next-line no-underscore-dangle
      const { jobStatuses } = this.sessionStatuses[session.id]._count;
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
    computeBars(session) {
      const status = this.sessionStatuses[session.id];
      if (!status) {
        return [
          {
            key: `${session.id}-unknown`,
            type: 'buffer',
            value: 1,
            color: 'primary',
          },
        ];
      }

      const metrics = this.computeMetrics(session);

      // eslint-disable-next-line no-underscore-dangle
      const getValue = (value) => (value / session._count.jobs);

      return [
        {
          key: `${session.id}-success`,
          color: 'success',
          value: getValue(metrics.success),
        },
        {
          key: `${session.id}-failed`,
          color: 'error',
          value: getValue(metrics.failed),
        },
        {
          key: `${session.id}-active`,
          color: 'blue',
          value: getValue(metrics.active),
        },
        {
          key: `${session.id}-delayed`,
          type: 'buffer',
          color: 'blue',
          value: getValue(metrics.delayed),
        },
        {
          key: `${session.id}-pending`,
          type: 'stream',
          color: 'grey',
          value: getValue(metrics.pending),
        },
      ];
    },

    computeCounts(session) {
      const status = this.sessionStatuses[session.id];

      const institutionIds = new Set();
      const endpointIds = new Set();

      // eslint-disable-next-line no-restricted-syntax
      for (const credential of session.credentials) {
        institutionIds.add(credential.institutionId);
        endpointIds.add(credential.endpointId);
      }

      return {
        institutions: institutionIds.size,
        endpoints: endpointIds.size,
        reportTypes: session.reportTypes.length,
        credentials: {
          // eslint-disable-next-line no-underscore-dangle
          harvestable: status?._count.harvestableCredentials,
          // eslint-disable-next-line no-underscore-dangle
          total: session._count.credentials,
        },
      };
    },

    async refreshHarvests() {
      this.refreshing = true;

      const params = {
        include: ['credentials'],
        page: this.iteratorOptions.page,
        size: this.iteratorOptions.itemsPerPage,
        sort: this.iteratorOptions.sortBy[0],
        order: this.iteratorOptions.sortDesc[0] ? 'desc' : 'asc',
      };

      try {
        const { headers, data } = await this.$axios.get('/harvests-sessions', { params });

        this.sessions = data;
        this.sessionsCount = Number.parseInt(headers['x-total-count'], 10);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('harvest.sessions.unableToRetrive'));
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const table of Object.values(this.tables)) {
        table.refreshJobs();
      }

      try {
        const statuses = await Promise.all(
          this.sessions.map((session) => this.$axios.get(`/harvests-sessions/${session.id}/status`)),
        );

        this.sessionStatuses = {
          ...this.sessionStatuses,
          ...Object.fromEntries(statuses.map(({ data: { id, ...status } }) => [id, status])),
        };
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('harvest.sessions.unableToRetrive'));
      }

      this.refreshing = false;
    },
  },
});
</script>
