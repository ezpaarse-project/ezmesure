<template>
  <v-dialog v-model="show" width="1000">
    <v-card>
      <v-toolbar flat color="rgba(0, 0, 0, 0)">
        <v-toolbar-title>
          {{ $t('tasks.history') }}
          <div class="caption">
            {{ sushiVendor }} - {{ sushiTags }}
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
        item-key="id"
        show-expand
        single-expand
        sort-by="createdAt"
        sort-desc
        :items-per-page="10"
        :expanded="expandedRows"
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
            <v-timeline align-top dense>
              <template v-if="item.steps">
                <v-timeline-item hide-dot>
                  <div class="subtitle-1">
                    {{ $t('tasks.parameters') }}
                  </div>
                </v-timeline-item>

                <TaskParams :params="item.params" />

                <v-timeline-item hide-dot>
                  <div class="subtitle-1">
                    {{ $t('tasks.steps.title') }}
                  </div>
                </v-timeline-item>

                <StepTimelineItem
                  v-for="(step, index) in item.steps"
                  :key="index"
                  :step="step"
                />
              </template>

              <v-timeline-item hide-dot>
                <div class="subtitle-1">
                  {{ $t('tasks.logs') }}
                </div>
              </v-timeline-item>

              <v-timeline-item hide-dot class="mb-4">
                <LogsPreview :logs="item.logs" />
              </v-timeline-item>
            </v-timeline>
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
import LogsPreview from '~/components/LogsPreview.vue';
import TaskLabel from '~/components/TaskLabel.vue';
import LocalDate from '~/components/LocalDate.vue';
import LocalDuration from '~/components/LocalDuration.vue';
import StepTimelineItem from '~/components/StepTimelineItem.vue';
import TaskParams from '~/components/TaskParams.vue';

export default {
  components: {
    LogsPreview,
    TaskLabel,
    LocalDate,
    StepTimelineItem,
    LocalDuration,
    TaskParams,
  },
  data() {
    return {
      show: false,
      refreshing: false,
      institutionId: null,
      sushi: null,
      tasks: [],
      expandedRows: [],
    };
  },
  computed: {
    hasSushiItem() {
      return !!this.sushi?.id;
    },
    sushiVendor() { return this.sushi?.endpoint?.vendor; },
    sushiTags() { return this.sushi?.tags?.join?.(', '); },
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
          value: 'params.reportType',
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

      try {
        this.tasks = await this.$axios.$get(`/sushi/${this.sushi.id}/tasks`);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('tasks.failedToFetchTasks'));
      }

      this.refreshing = false;
    },
  },
};
</script>
