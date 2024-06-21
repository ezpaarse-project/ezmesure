<template>
  <section>
    <ToolBar :title="$t('harvest.jobs.title')">
      <v-spacer />

      <v-btn
        text
        @click="showFiltrerDrawer = true"
      >
        <v-badge
          :value="filtersCount > 0"
          :content="filtersCount"
          overlap
          left
        >
          <v-icon>
            mdi-filter
          </v-icon>
        </v-badge>
        {{ $t('filter') }}
      </v-btn>

      <v-btn
        text
        :loading="refreshing"
        @click.stop="refreshJobs()"
      >
        <v-icon left>
          mdi-refresh
        </v-icon>
        {{ $t('refresh') }}
      </v-btn>
    </ToolBar>

    <v-data-table
      :headers="tableHeaders"
      :items="jobs"
      :loading="refreshing"
      :options.sync="tableOptions"
      :server-items-length="jobsCount"
      item-key="id"
      sort-by="startedAt"
      sort-desc
      @update:options="refreshJobs()"
    >
      <template #[`item.credentials.institution.name`]="{ item, value }">
        <nuxt-link :to="`/admin/institutions/${item.credentials.institutionId}/sushi`">
          {{ value }}
        </nuxt-link>
      </template>

      <template #[`item.credentials.packages`]="{ value }">
        <v-chip
          v-for="(pkg, index) in value"
          :key="index"
          label
          small
          class="ml-1"
        >
          {{ pkg }}
        </v-chip>
      </template>

      <template #[`item.reportType`]="{ value }">
        <v-chip color="primary" style="text-transform: uppercase" outlined>
          {{ value }}
        </v-chip>
      </template>

      <template #[`item.status`]="{ item, value }">
        <v-menu
          :disabled="!status[value]?.ended"
          :close-on-click="false"
          top
          left
          offset-y
          max-width="400"
          open-on-hover
          offset-overflow
        >
          <template #activator="{ on, attrs }">
            <v-chip
              :color="status[value]?.color"
              :style="{
                color: status[value]?.text || 'white',
              }"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon small left>
                {{ status[value]?.icon }}
              </v-icon>

              <template v-if="$te(`tasks.status.${value}`)">
                {{ $t(`tasks.status.${value}`) }}
              </template>
              <template v-else>
                {{ value }}
              </template>
            </v-chip>
          </template>

          <HarvestJobCard :harvest="item" />
        </v-menu>
      </template>

      <template #[`item.startedAt`]="{ value }">
        <LocalDate v-if="value" :date="value" format="PPPpp" />
      </template>

      <template #[`item.updatedAt`]="{ value }">
        <LocalDate v-if="value" :date="value" format="PPPpp" />
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>
                mdi-cog
              </v-icon>
            </v-btn>
          </template>

          <v-list>
            <v-list-item :disabled="!cancellableStatus.has(item.status)" @click="cancelJob(item)">
              <v-list-item-icon>
                <v-icon>mdi-cancel</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('cancel') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item :disabled="unDeletableStatus.has(item.status)" @click="deleteJob(item)">
              <v-list-item-icon>
                <v-icon>mdi-delete</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('delete') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-divider />

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
    </v-data-table>

    <HarvestJobFilters
      v-model="filters"
      :show.sync="showFiltrerDrawer"
      :disabled-filters="disabledFilters"
      :session-ids="meta?.sessionIds ?? []"
      :vendors="meta?.vendors ?? []"
      :institutions="meta?.institutions ?? []"
      :report-types="meta?.reportTypes ?? []"
      :tags="meta?.tags ?? []"
      :packages="meta?.packages ?? []"
      :statuses="meta?.statuses ?? []"
      @input="refreshJobs(1)"
    />

    <ConfirmDialog ref="confirmDialog" />
  </section>
</template>

<script>
import { defineComponent } from 'vue';

import ConfirmDialog from '~/components/ConfirmDialog.vue';
import ToolBar from '~/components/space/ToolBar.vue';
import HarvestJobCard from '~/components/harvest/HarvestJobCard.vue';
import LocalDate from '~/components/LocalDate.vue';
import HarvestJobFilters from '~/components/harvest/HarvestJobFilters.vue';

export default defineComponent({
  components: {
    ToolBar,
    LocalDate,
    HarvestJobCard,
    HarvestJobFilters,
    ConfirmDialog,
  },
  props: {
    sessionId: {
      type: String,
      default: '',
    },
    disabledFilters: {
      type: Array,
      default: () => [],
    },
  },
  data: () => ({
    showFiltrerDrawer: false,
    filters: {
      sessionId: undefined,
      vendor: undefined,
      institution: undefined,
      tags: undefined,
      packages: undefined,
      reportType: undefined,
      status: undefined,
    },

    jobs: [],
    meta: {},
    jobsCount: 0,

    tableOptions: {},

    refreshing: false,

    cancellableStatus: new Set(['waiting', 'running', 'delayed']),
    unDeletableStatus: new Set(['running']),
  }),
  computed: {
    tableHeaders() {
      return [
        {
          text: this.$t('endpoints.vendor'),
          value: 'credentials.endpoint.vendor',
        },
        {
          text: this.$t('institutions.title'),
          value: 'credentials.institution.name',
        },
        {
          text: this.$t('institutions.sushi.packages'),
          value: 'credentials.packages',
        },
        {
          text: this.$t('harvest.jobs.reportType'),
          value: 'reportType',
          align: 'center',
          width: 0,
        },
        {
          text: this.$t('status'),
          value: 'status',
          align: 'center',
        },
        {
          text: this.$t('harvest.jobs.startedAt'),
          value: 'startedAt',
        },
        {
          text: this.$t('harvest.jobs.updatedAt'),
          value: 'updatedAt',
        },
        {
          text: this.$t('actions'),
          value: 'actions',
          width: 0,
        },
      ];
    },
    status() {
      return {
        waiting: {
          color: 'grey',
          icon: 'mdi-clock-outline',
        },
        running: {
          color: 'blue',
          icon: 'mdi-play',
        },
        finished: {
          color: 'green',
          icon: 'mdi-check',
          ended: true,
        },
        failed: {
          color: 'red',
          icon: 'mdi-exclamation',
          ended: true,
        },
        interrupted: {
          color: 'red',
          icon: 'mdi-progress-close',
          ended: true,
        },
        cancelled: {
          color: 'red',
          icon: 'mdi-cancel',
          ended: true,
        },
        delayed: {
          color: 'blue',
          icon: 'mdi-update',
        },
      };
    },
    filtersCount() {
      return Object.values(this.filters)
        .reduce(
          (prev, filter) => {
            // skipping if undefined or empty
            if (filter == null || filter === '') {
              return prev;
            }
            // skipping if empty array
            if (Array.isArray(filter) && filter.length <= 0) {
              return prev;
            }

            return prev + 1;
          },
          0,
        );
    },
  },
  methods: {
    async refreshJobs(page) {
      this.refreshing = true;
      if (page != null) {
        this.tableOptions = {
          ...this.tableOptions,
          page,
        };
      }

      const sessionId = this.sessionId || this.filters.sessionId;
      const params = {
        include: ['credentials.institution', 'credentials.endpoint'],
        sessionId,

        status: this.filters.status,
        reportType: this.filters.reportType,
        endpointId: this.filters.vendor,
        institutionId: this.filters.institution,
        tags: this.filters.tags,
        packages: this.filters.packages,

        page: this.tableOptions.page,
        size: this.tableOptions.itemsPerPage,
        sort: this.tableOptions.sortBy[0],
        order: this.tableOptions.sortDesc[0] ? 'desc' : 'asc',
      };

      try {
        this.meta = await this.$axios.$get('/tasks/_meta', { params: { sessionId, size: 0 } });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('harvest.jobs.unableToRetriveMeta'));
      }

      try {
        const { headers, data } = await this.$axios.get('/tasks', { params });

        this.jobs = data;
        this.jobsCount = Number.parseInt(headers['x-total-count'], 10);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('harvest.jobs.unableToRetrive'));
      }

      this.refreshing = false;
    },
    async cancelJob(item) {
      const confirmed = await this.$refs.confirmDialog?.open({
        title: this.$t('areYouSure'),
        agreeText: this.$t('cancel'),
        agreeIcon: 'mdi-cancel',
      });

      if (!confirmed) {
        return;
      }

      this.refreshing = true;
      try {
        const { data } = await this.$axios.post(`/tasks/${item.id}/_cancel`, {});
        if (data.status === item.status) {
          throw new Error("Cancellation wasn't successful");
        }
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('harvest.jobs.unableToStop'));
      }

      this.refreshJobs();
    },
    async deleteJob(item) {
      const confirmed = await this.$refs.confirmDialog?.open({
        title: this.$t('areYouSure'),
        agreeText: this.$t('delete'),
        agreeIcon: 'mdi-delete',
      });

      if (!confirmed) {
        return;
      }

      this.refreshing = true;
      try {
        await this.$axios.delete(`/tasks/${item.id}`, {});
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('harvest.jobs.unableToDelete'));
      }

      this.refreshJobs();
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
