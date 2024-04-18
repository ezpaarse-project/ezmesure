<template>
  <section>
    <ToolBar :title="$t('menu.harvest').toString()">
      <v-spacer />

      <v-btn
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
      sort-by="createdAt"
      sort-desc
      item-key="id"
      @update:options="refreshHarvests"
    >
      <template #default="{ items }">
        <v-expansion-panels>
          <v-expansion-panel
            v-for="{ item, status, hasStarted } in items"
            :key="item.id"
            :readonly="!hasStarted"
          >
            <v-expansion-panel-header
              disable-icon-rotate
              :style="{ cursor: hasStarted ? undefined : 'default' }"
            >
              <HarvestSessionHeader
                :session="item"
                :status="status"
                :has-started="hasStarted"
              />

              <template #actions="{ open }">
                <div v-if="!hasStarted" />
                <v-btn v-else icon>
                  <v-icon>
                    {{ open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </v-btn>

                <v-menu>
                  <template #activator="{ attrs, on }">
                    <v-btn icon class="ml-2" v-bind="attrs" v-on="on">
                      <v-icon>mdi-dots-horizontal</v-icon>
                    </v-btn>
                  </template>

                  <v-list>
                    <v-list-item @click="copyId(item)">
                      <v-list-item-icon>
                        <v-icon>mdi-identifier</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>
                          {{ $t('copyId') }}
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-expansion-panel-header>

            <v-expansion-panel-content>
              <HarvestJobTable
                :ref="(ref) => (tables[item.id] = ref)"
                :session-id="item.id"
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
import ToolBar from '~/components/space/ToolBar.vue';
import HarvestJobTable from '~/components/harvest/HarvestJobTable.vue';
import HarvestSessionHeader from '~/components/harvest/HarvestSessionHeader.vue';

export default defineComponent({
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    HarvestJobTable,
    HarvestSessionHeader,
  },
  data: () => ({
    refreshing: false,

    iteratorOptions: {},

    sessions: [],
    sessionsCount: 0,
    sessionStatuses: {},

    tables: {},
  }),
  computed: {
    sessionItems() {
      return this.sessions.map((item) => ({
        item,
        status: this.sessionStatuses[item.id],
        hasStarted: !!item.startedAt,
      }));
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

      if (Array.isArray(this.sessions) && this.sessions.length > 0) {
        try {
          const { data: statuses } = await this.$axios.get(
            '/harvests-sessions/status',
            { params: { harvestIds: this.sessions.map((session) => session.id) } },
          );

          const sessionStatuses = { ...this.sessionStatuses };
          // eslint-disable-next-line no-restricted-syntax
          for (const { id, status } of Object.values(statuses)) {
            sessionStatuses[id] = status;
          }
          this.sessionStatuses = statuses;
        } catch (e) {
          this.$store.dispatch('snacks/error', this.$t('harvest.sessions.unableToRetrive'));
        }
      }

      this.refreshing = false;
    },
    async copyId(item) {
      if (!navigator.clipboard) {
        this.$store.dispatch('snacks/error', this.$t('unableToCopyId'));
        return;
      }
      try {
        await navigator.clipboard.writeText(item.id);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('unableToCopyId'));
        return;
      }
      this.$store.dispatch('snacks/info', this.$t('idCopied'));
    },
  },
});
</script>
