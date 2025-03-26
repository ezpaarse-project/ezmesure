<template>
  <div
    class="d-flex align-center mr-4"
    style="width: 30vw; gap: 2rem"
  >
    <v-progress-circular
      v-if="status?.isActive"
      color="primary"
      width="3"
      size="46"
      indeterminate
    />
    <div v-else style="width: 46px" />

    <v-menu
      :disabled="!metrics"
      location="start center"
      offset="5"
      open-delay="50"
      open-on-hover
    >
      <template #activator="{ props: menu }">
        <ProgressLinearStack
          :model-value="bars"
          height="8"
          v-bind="menu"
          class="mx-4"
        />
      </template>

      <v-sheet min-width="300">
        <v-table density="comfortable">
          <tbody>
            <template v-for="row in table">
              <tr v-if="row.value > 0" :key="row.key">
                <td>
                  <v-icon
                    v-if="row.header.icon"
                    :icon="row.header.icon"
                    :color="row.header.color"
                    start
                  />

                  {{ row.header.text }}
                </td>

                <td>{{ row.value }}</td>
              </tr>
            </template>
          </tbody>
        </v-table>
      </v-sheet>
    </v-menu>
  </div>
</template>

<script setup>

const props = defineProps({
  status: {
    type: Object,
    required: true,
  },
  jobCount: {
    type: Number,
    required: true,
  },
});

const { t } = useI18n();

const metrics = computed(() => {
  const { _count: count } = props.status;
  if (!count) {
    return undefined;
  }

  const { jobStatuses } = count;
  return {
    waiting: jobStatuses.waiting ?? 0,
    finished: jobStatuses.finished ?? 0,
    running: jobStatuses.running ?? 0,
    delayed: jobStatuses.delayed ?? 0,
    failed: (jobStatuses.failed ?? 0)
          + (jobStatuses.interrupted ?? 0)
          + (jobStatuses.cancelled ?? 0),
  };
});

const bars = computed(() => {
  if (!props.status) {
    return [
      {
        key: 'unknown',
        type: 'buffer',
        value: 1,
        color: 'grey',
      },
    ];
  }

  const getValue = (value) => (value / props.jobCount);

  return [
    {
      key: 'success',
      color: harvestStatus.get('finished')?.color,
      value: getValue(metrics.value.finished),
    },
    {
      key: 'failed',
      color: harvestStatus.get('failed')?.color,
      value: getValue(metrics.value.failed),
    },
    {
      key: 'active',
      color: harvestStatus.get('running')?.color,
      value: getValue(metrics.value.running),
    },
    {
      key: 'delayed',
      type: 'buffer',
      color: harvestStatus.get('delayed')?.color,
      value: getValue(metrics.value.delayed),
    },
    {
      key: 'pending',
      type: 'stream',
      color: harvestStatus.get('waiting')?.color,
      value: getValue(metrics.value.waiting),
    },
  ];
});

const table = computed(() => Object.entries(metrics.value ?? {})
  .map(([name, value]) => ({
    key: name,
    header: {
      ...harvestStatus.get(name),
      text: t(`harvest.sessions.metrics.${name}`),
    },
    value,
  })));
</script>
