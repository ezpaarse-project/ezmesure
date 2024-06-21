<template>
  <v-dialog v-model="show" width="1000">
    <v-card>
      <v-toolbar flat color="rgba(0, 0, 0, 0)">
        <v-toolbar-title>
          {{ $t('tasks.history') }}
          <div class="caption">
            {{ sushiVendor }} - {{ sushiPackages }}
          </div>
        </v-toolbar-title>

        <v-spacer />

        <v-btn text color="primary" :loading="refreshing" @click="refreshSushiTasks">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>
      </v-toolbar>

      <v-data-table
        :headers="tableHeaders"
        :items="tasks"
        :loading="refreshing"
        :options.sync="tableOptions"
        :server-items-length="totalTasks"
        :expanded="expandedRows"
        show-expand
        single-expand
        @update:options="refreshSushiTasks()"
        @update:expanded="onExpandedChange"
      >
        <template #[`item.createdAt`]="{ item }">
          <LocalDate :date="item.createdAt" />
        </template>

        <template #[`item.runningTime`]="{ item }">
          <LocalDuration :ms="item.runningTime" />
        </template>

        <template #[`item.status`]="{ item }">
          <TaskLabel :task="item" />
        </template>

        <template #expanded-item="{ headers, item }">
          <td :colspan="headers.length">
            <HarvestTimeline :task="item" />
          </td>
        </template>
      </v-data-table>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          {{ $t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import TaskLabel from '~/components/TaskLabel.vue';
import LocalDate from '~/components/LocalDate.vue';
import LocalDuration from '~/components/LocalDuration.vue';
import HarvestTimeline from '~/components/harvest/HarvestTimeline.vue';

export default {
  components: {
    TaskLabel,
    LocalDate,
    LocalDuration,
    HarvestTimeline,
  },
  data() {
    return {
      show: false,
      refreshing: false,
      institutionId: null,
      sushi: null,
      expandedRows: [],
      tasks: [],
      totalTasks: 0,
      tableOptions: {
        itemsPerPage: 10,
        sortBy: ['createdAt'],
        sortDesc: [true],
      },
    };
  },
  computed: {
    hasSushiItem() {
      return !!this.sushi?.id;
    },
    sushiVendor() { return this.sushi?.endpoint?.vendor; },
    sushiPackages() { return this.sushi?.packages?.join?.(', '); },
    tableHeaders() {
      return [
        {
          align: 'left',
          text: this.$t('date'),
          value: 'createdAt',
        },
        {
          align: 'left',
          text: this.$t('duration'),
          value: 'runningTime',
        },
        {
          text: this.$t('type'),
          value: 'reportType',
          align: 'right',
          width: '80px',
          cellClass: 'text-uppercase',
        },
        {
          align: 'left',
          text: this.$t('status'),
          value: 'status',
          width: '150px',
        },
        {
          text: '',
          value: 'data-table-expand',
        },
      ];
    },
  },
  methods: {
    showSushiItem(sushiData = {}, opts = {}) {
      this.sushi = sushiData;
      this.tasks = [];
      this.expandedRows = [];
      this.show = true;

      this.refreshSushiTasks().then(() => {
        const idToExpand = opts?.openLatest && sushiData?.latestImportTask?.id;

        if (idToExpand) {
          this.expandedRows = this.tasks.filter((task) => task.id === idToExpand);
        }
      });
    },

    onExpandedChange(value) {
      this.expandedRows = value;
    },

    async refreshSushiTasks() {
      if (!this.hasSushiItem) { return; }

      this.refreshing = true;

      const params = {
        credentialsId: this.sushi.id,
        include: ['steps', 'logs', 'session'],

        page: this.tableOptions.page,
        size: this.tableOptions.itemsPerPage,
        sort: this.tableOptions.sortBy[0],
        order: this.tableOptions.sortDesc[0] ? 'desc' : 'asc',
      };

      try {
        const { data, headers } = await this.$axios.get('/tasks', { params });

        this.totalTasks = headers['x-total-count'];
        this.tasks = data;
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('tasks.failedToFetchTasks'));
      }

      this.refreshing = false;
    },
  },
};
</script>
