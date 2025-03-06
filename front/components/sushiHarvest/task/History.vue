<template>
  <v-card
    :title="$t('tasks.history')"
    prepend-icon="mdi-history"
    dark
  >
    <template v-if="showTask" #subtitle>
      <SushiSubtitle :model-value="task.credentials" />
    </template>

    <template #text>
      <v-data-table-server
        :headers="headers"
        :items="[task]"
        :items-length="1"
        :expanded="[task.id]"
        item-value="id"
        hide-default-footer
      >
        <template #[`item.createdAt`]>
          {{ createdAt }}
        </template>

        <template #[`item.runningTime`]>
          {{ runningTime }}
        </template>

        <template #[`item.status`]>
          <SushiHarvestTaskChip :model-value="task" />
        </template>

        <template #expanded-row="{ columns }">
          <tr>
            <td :colspan="columns.length">
              <SushiHarvestTaskTimeline :model-value="{ ...task, session }" />
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
  task: {
    type: Object,
    required: true,
  },
  session: {
    type: Object,
    required: true,
  },
  showTask: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();

const createdAt = useDateFormat(() => props.task.createdAt);
const runningTime = useTimeAgo(() => props.task.runningTime);

const headers = computed(() => [
  {
    title: t('date'),
    value: 'createdAt',
    align: 'start',
  },
  {
    title: t('duration'),
    value: 'runningTime',
    align: 'start',
  },
  {
    title: t('type'),
    value: 'reportType',
    align: 'end',
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
