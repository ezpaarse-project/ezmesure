<template>
  <v-dialog v-model="show" width="1000">
    <v-card>
      <v-toolbar flat color="rgba(0, 0, 0, 0)">
        <v-toolbar-title>
          {{ $t('tasks.oneHistory') }}

          <div v-if="task" class="caption">
            {{ sushi.endpoint?.vendor || '...' }} - {{ sushiPackages }}
          </div>
        </v-toolbar-title>

        <v-spacer />

        <div style="text-align: end;">
          <v-btn text color="primary" :loading="refreshing" @click="refreshSushiTasks">
            <v-icon left>
              mdi-refresh
            </v-icon>
            {{ $t('refresh') }}
          </v-btn>
        </div>
      </v-toolbar>

      <template v-if="task">
        <v-divider />

        <v-toolbar dense style="font-size: .875rem;">
          <LocalDate :date="task.startedAt" />

          <v-spacer />

          <LocalDuration :ms="task.runningTime" />

          <v-spacer />

          <div class="text-uppercase">
            {{ task.reportType }}
          </div>

          <v-spacer />

          <TaskLabel :task="task" />
        </v-toolbar>

        <div class="px-4" style="font-size: .875rem;">
          <HarvestTimeline :task="task" />
        </div>
      </template>

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
import HarvestTimeline from '~/components/harvest/HarvestTimeline.vue';
import LocalDate from '~/components/LocalDate.vue';
import LocalDuration from '~/components/LocalDuration.vue';
import TaskLabel from '~/components/TaskLabel.vue';

export default {
  components: {
    HarvestTimeline,
    LocalDate,
    LocalDuration,
    TaskLabel,
  },
  data() {
    return {
      show: false,
      refreshing: false,
      expandedRows: [],
      sushi: undefined,
      task: undefined,
    };
  },
  computed: {
    sushiPackages() { return this.sushi?.packages?.join?.(', ') || '...'; },
  },
  methods: {
    open(task = {}) {
      this.show = true;

      this.sushi = task.credentials;
      this.refreshTask(task);
    },

    onExpandedChange(value) {
      this.expandedRows = value;
    },

    async refreshTask(task) {
      this.refreshing = true;

      const params = {
        include: ['steps', 'logs', 'session'],
      };

      try {
        this.task = await this.$axios.$get(`/tasks/${task.id}`, { params });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('tasks.failedToFetchTasks'));
      }

      this.refreshing = false;
    },
  },
};
</script>
