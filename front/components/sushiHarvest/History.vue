<template>
  <v-card
    :title="$t('tasks.history')"
    :loading="status === 'pending' && 'primary'"
    prepend-icon="mdi-history"
  >
    <template v-if="showSushi" #subtitle>
      <SushiSubtitle :model-value="sushi" />
    </template>

    <template #append>
      <v-btn
        :text="$t('refresh')"
        :loading="status === 'pending'"
        prepend-icon="mdi-reload"
        variant="tonal"
        color="primary"
        class="mr-2"
        @click="refresh()"
      />
    </template>

    <template #text>
      <v-data-table-server
        :headers="headers"
        :items="tasks"
        :loading="status === 'pending' && 'primary'"
        show-expand
        single-expand
        v-bind="vDataTableOptions"
      >
        <template #[`item.createdAt`]="{ value }">
          <LocalDate :model-value="value" />
        </template>

        <template #[`item.runningTime`]="{ value }">
          <LocalDuration v-if="value" :model-value="value" />
        </template>

        <template #[`item.counterVersion`]="{ value }">
          <v-chip
            v-tooltip:top="$t('harvest.jobs.counterVersionTooltip', { version: value })"
            :text="value"
            :color="counterVersionsColors.get(value) || 'secondary'"
            variant="flat"
            size="small"
            label
          />
        </template>

        <template #[`item.status`]="{ item }">
          <SushiHarvestTaskChip :model-value="item" />
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length">
              <SushiHarvestTaskTimeline :model-value="item" />
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />
      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  sushi: {
    type: Object,
    required: true,
  },
  showSushi: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();

const {
  refresh,
  status,
  data: tasks,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/tasks',
  },
  data: {
    credentialsId: props.sushi.id,
    sortBy: [{ key: 'createdAt', order: 'desc' }],
    include: ['steps', 'logs', 'session'],
    search: undefined,
  },
});

const headers = computed(() => [
  {
    title: t('date'),
    value: 'createdAt',
    align: 'start',
    sortable: true,
  },
  {
    title: t('duration'),
    value: 'runningTime',
    align: 'start',
    sortable: true,
  },
  {
    title: t('endpoints.counterVersion'),
    value: 'counterVersion',
    align: 'center',
  },
  {
    title: t('type'),
    value: 'reportType',
    align: 'end',
    sortable: true,
    width: '80px',
    cellProps: { class: ['text-uppercase'] },
  },
  {
    title: t('status'),
    value: 'status',
    align: 'start',
    width: '150px',
  },
]);
</script>
