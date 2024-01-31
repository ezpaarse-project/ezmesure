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
      :items="requestsItems"
      :loading="refreshing"
      :options.sync="iteratorOptions"
      :server-items-length="requestsCount"
      item-key="id"
      @update:options="refreshHarvests"
    >
      <template #default="{ items }">
        <v-expansion-panels>
          <v-expansion-panel
            v-for="({ item, bars, runningTime, createdAtLocale }) in items"
            :key="item.id"
          >
            <v-expansion-panel-header>
              <div>
                <div class="mb-2">
                  {{ $t('harvest.requests.name', { createdAt: createdAtLocale }) }}

                  <span class="text--secondary mx-2" style="font-size: 0.75em;">
                    ({{ item.id }})
                  </span>
                </div>

                <v-chip outlined small>
                  <v-icon left small>
                    mdi-calendar-range
                  </v-icon>

                  {{ item.beginDate }} ~ {{ item.endDate }}
                </v-chip>

                <v-chip v-if="item.counts.institutions > 0" outlined small>
                  <v-icon left small>
                    mdi-domain
                  </v-icon>

                  {{ $tc('harvest.requests.counts.institutions', item.counts.institutions) }}
                </v-chip>

                <v-chip v-if="item.counts.endpoints > 0" outlined small>
                  <v-icon left small>
                    mdi-web
                  </v-icon>

                  {{ $tc('harvest.requests.counts.endpoints', item.counts.endpoints) }}
                </v-chip>

                <v-chip v-if="item.counts.reportTypes > 0" outlined small>
                  <v-icon left small>
                    mdi-file
                  </v-icon>

                  {{ $tc('harvest.requests.counts.reportTypes', item.counts.reportTypes) }}
                </v-chip>

                <v-chip v-if="item.runningTime" outlined small>
                  <v-icon left small>
                    mdi-timer-outline
                  </v-icon>

                  {{ runningTime }}
                </v-chip>
              </div>

              <v-spacer />

              <div class="d-flex align-center">
                <v-progress-circular
                  v-if="item.isActive"
                  color="primary"
                  width="2"
                  indeterminate
                />
                <div v-else style="width: 32px;" />

                <v-tooltip top>
                  <template #activator="{ attrs, on }">
                    <div
                      class="d-flex mx-4 progress-bars"
                      style="flex: 1;"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <template v-for="{ key, ...props } in bars">
                        <div
                          v-if="props.value >= 1"
                          :key="key"
                          :style="{ width: `${props.value}%` }"
                        >
                          <v-progress-linear
                            :color="props.color"
                            :stream="props.stream"
                            :value="props.stream ? 0 : 100"
                            buffer-value="0"
                            height="8"
                          />
                        </div>
                      </template>
                    </div>
                  </template>

                  {{ $t('harvest.requests.metrics', item.metrics) }}
                </v-tooltip>
              </div>
            </v-expansion-panel-header>

            <v-expansion-panel-content>
              <HarvestJobTable
                :ref="(ref) => (tables[item.id] = ref)"
                :harvest-id="item.id"
                :disabled-filters="['harvestId', 'period']"
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
import ToolBar from '~/components/space/ToolBar.vue';
import HarvestJobTable from '~/components/harvest/HarvestJobTable.vue';

export default defineComponent({
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    HarvestJobTable,
  },
  data: () => ({
    refreshing: false,

    iteratorOptions: {},

    requests: [],
    requestsCount: 0,

    tables: {},
  }),
  computed: {
    requestsItems() {
      return this.requests.map((item) => {
        const { id, metrics } = item;

        return {
          item,

          createdAtLocale: this.$dateFunctions.format(parseISO(item.createdAt), 'PPPpp'),

          runningTime: this.$dateFunctions.msToLocalDistance(
            item.runningTime,
            { format: ['days', 'hours', 'minutes', 'seconds'] },
          ),

          bars: [
            {
              key: `${id}-success`,
              color: 'success',
              value: (metrics.success / item.counts.jobs) * 100,
            },
            {
              key: `${id}-failed`,
              color: 'error',
              value: (metrics.failed / item.counts.jobs) * 100,
            },
            {
              key: `${id}-active`,
              color: 'blue',
              value: (metrics.active / item.counts.jobs) * 100,
            },
            {
              key: `${id}-pending`,
              color: 'grey',
              stream: true,
              value: (metrics.pending / item.counts.jobs) * 100,
            },
          ],
        };
      });
    },
  },
  methods: {
    async refreshHarvests() {
      this.refreshing = true;

      const params = {
        page: this.iteratorOptions.page,
        size: this.iteratorOptions.itemsPerPage,
        sort: this.iteratorOptions.sortBy[0],
        order: this.iteratorOptions.sortDesc[0] ? 'desc' : 'asc',
      };

      try {
        const { headers, data } = await this.$axios.get('/harvests-requests', { params });

        this.requests = data;
        this.requestsCount = Number.parseInt(headers['x-total-count'], 10);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('harvest.requests.unableToRetrive'));
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const table of Object.values(this.tables)) {
        table.refreshJobs();
      }

      this.refreshing = false;
    },
  },
});
</script>

<style scoped>
.progress-bars > div:first-child > div[aria-valuenow="100"] {
  border-radius: 1rem 0 0 1rem;
}
.progress-bars > div:last-child > div[aria-valuenow="100"] {
  border-radius: 0 1rem 1rem 0;
}
</style>
