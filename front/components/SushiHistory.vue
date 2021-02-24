<template>
  <v-dialog v-model="show" width="800">
    <v-card>
      <v-toolbar flat color="rgba(0, 0, 0, 0)">
        <v-toolbar-title v-text="$t('history')" />

        <v-spacer />

        <v-btn text color="primary" :loading="refreshing" @click="refreshSushiTasks">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>
      </v-toolbar>

      <v-data-table
        :headers="headers"
        :items="tasks"
        :loading="refreshing"
        item-key="id"
        show-expand
        sort-by="createdAt"
        sort-desc
        :items-per-page="5"
      >
        <template v-slot:item.createdAt="{ item }">
          <LocalDate :date="item.createdAt" />
        </template>

        <template v-slot:item.runningTime="{ item }">
          <LocalDuration :ms="item.runningTime" />
        </template>

        <template v-slot:item.status="{ item }">
          <TaskLabel :status="item.status" />
        </template>

        <template v-slot:expanded-item="{ headers, item }">
          <td :colspan="headers.length" class="pa-0">
            <Logs flat :logs="item.logs" />
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
import Logs from '~/components/Logs';
import TaskLabel from '~/components/TaskLabel';
import LocalDate from '~/components/LocalDate';
import LocalDuration from '~/components/LocalDuration';

export default {
  components: {
    Logs,
    TaskLabel,
    LocalDate,
    LocalDuration,
  },
  data() {
    return {
      show: false,
      refreshing: false,
      institutionId: null,
      sushi: null,
      tasks: [],
    };
  },
  computed: {
    hasSushiItem() {
      return !!this.sushi?.id;
    },
    sushiVendor() { return this.sushi?.vendor; },
    sushiPackage() { return this.sushi?.package; },
    headers() {
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
    showSushiItem(sushiData = {}) {
      this.sushi = sushiData;
      this.tasks = [];
      this.show = true;
      this.refreshSushiTasks();
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
