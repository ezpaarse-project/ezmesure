<template>
  <v-timeline align-top dense>
    <v-timeline-item hide-dot>
      <div class="subtitle-1">
        {{ $t('tasks.parameters') }}
      </div>
    </v-timeline-item>

    <TaskParams :task="task" />

    <v-timeline-item hide-dot>
      <div class="subtitle-1">
        {{ $t('tasks.steps.title') }}
      </div>
    </v-timeline-item>

    <StepTimelineItem
      v-for="(step, index) in steps"
      :key="index"
      :step="step"
    />

    <v-timeline-item hide-dot>
      <div class="subtitle-1">
        {{ $t('tasks.logs') }}
      </div>
    </v-timeline-item>

    <v-timeline-item hide-dot class="mb-4">
      <LogsPreview :logs="logs" log-type="level" />
    </v-timeline-item>
  </v-timeline>
</template>

<script>
import { defineComponent } from 'vue';

import LogsPreview from '~/components/LogsPreview.vue';
import StepTimelineItem from '~/components/StepTimelineItem.vue';
import TaskParams from '~/components/TaskParams.vue';

export default defineComponent({
  components: {
    LogsPreview,
    StepTimelineItem,
    TaskParams,
  },
  props: {
    task: {
      type: Object,
      required: true,
    },
  },
  computed: {
    steps() {
      return this.task.steps || [];
    },
    logs() {
      return this.task.logs || [];
    },
  },
});
</script>

<style>
</style>
