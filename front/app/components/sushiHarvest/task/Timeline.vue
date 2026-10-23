<template>
  <div>
    <v-timeline density="comfortable">
      <v-timeline-item hide-dot>
        <div class="text-body-large mb-4">
          {{ $t('tasks.parameters') }}
        </div>

        <div>
          <span class="text-title-small">{{ $t('tasks.params.sessionId') }}</span>
          {{ modelValue.sessionId || '...' }}
        </div>
        <div>
          <span class="text-title-small">{{ $t('tasks.params.reportType') }}</span>
          {{ modelValue.reportType?.toUpperCase() || '...' }}
        </div>
        <div>
          <span class="text-title-small">{{ $t('tasks.params.period') }}</span>
          {{ period }}
        </div>
        <div>
          <span class="text-title-small">{{ $t('tasks.params.index') }}</span>
          <code class="ml-1">{{ modelValue.index || '...' }}</code>
        </div>

        <div class="text-body-large mt-4">
          {{ $t('tasks.steps.title') }}
        </div>
      </v-timeline-item>

      <SushiHarvestTaskTimelineStep
        v-for="(step, index) in (modelValue.steps ?? [])"
        :key="index"
        :model-value="step"
      />

      <v-timeline-item hide-dot width="100%">
        <div class="text-body-large mb-4">
          {{ $t('tasks.logs') }}
        </div>

        <SushiHarvestLogs :model-value="modelValue.logs" item-value="level" />
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const period = computed(() => {
  const beginDate = props.modelValue.session?.beginDate;
  const endDate = props.modelValue.session?.endDate;

  if (beginDate === endDate) {
    return beginDate || '...';
  }

  return `${beginDate || '...'} - ${endDate || '...'}`;
});
</script>
