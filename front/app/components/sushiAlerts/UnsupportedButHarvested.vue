<template>
  <div>
    <v-alert
      v-if="error"
      :text="$t('sushi.alerts.unsupportedButHarvested.error', { error: error.message })"
      type="error"
    />

    <v-empty-state
      v-else-if="itemLength.total <= 0"
      :title="$t('sushi.alerts.unsupportedButHarvested.empty')"
      icon="mdi-check"
      color="green"
    />

    <v-data-table-server
      v-else
      :headers="headers"
      v-bind="vDataTableOptions"
    >
      <template #[`item.severity`]="{ value }">
        <v-icon v-if="value === 'info'" color="info" icon="mdi-information-outline" />
        <v-icon v-else-if="value === 'warning'" color="warning" icon="mdi-alert-outline" />
        <v-icon v-else color="error" icon="mdi-alert-outline" />
      </template>

      <template #[`item.context.credentials.endpoint.vendor`]="{ item, value }">
        <nuxt-link :to="`/admin/endpoints/${item.context.credentials.endpoint.id}`">
          {{ value }}
        </nuxt-link>
      </template>

      <template #[`item.context.credentials.institution.name`]="{ item, value }">
        <nuxt-link :to="`/admin/institutions/${item.context.credentials.institution.id}/sushi`">
          {{ value }}
        </nuxt-link>
      </template>

      <template #[`item.context.status`]="{ value }">
        <v-chip
          :text="t(`tasks.status.${value}`)"
          :prepend-icon="harvestStatus.get(value)?.icon"
          :color="harvestStatus.get(value)?.color"
          density="comfortable"
          variant="outlined"
        />
      </template>

      <template #[`item.period`]="{ item }">
        {{ item.context.beginDate }} ~ {{ item.context.endDate }}
      </template>

      <template #[`item.actions`]="{ item }">
        <div class="d-flex">
          <v-btn
            v-tooltip:top="$t('sushi.harvestState')"
            :disabled="!!lockActions"
            :loading="matrixLoading === `${item.context.reportId}:${item.context.status}:${item.context.credentialsId}`"
            icon="mdi-table-headers-eye"
            color="grey-darken-1"
            variant="text"
            density="comfortable"
            @click="openHarvestMatrix(item)"
          />
          <v-btn
            v-tooltip:top="$t('delete')"
            :disabled="!!lockActions"
            icon="mdi-delete"
            color="red"
            variant="text"
            density="comfortable"
            @click="deleteHarvestedPeriod(item)"
          />
        </div>
      </template>
    </v-data-table-server>

    <SushiHarvestMatrixDialog ref="harvestMatrixRef" />
  </div>
</template>

<script setup>
const props = defineProps({
  defineRefresh: {
    type: Function,
    default: () => {},
  },
});

const { t } = useI18n();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const lockActions = shallowRef(false);
const matrixLoading = shallowRef('');

const harvestMatrixRef = useTemplateRef('harvestMatrixRef');

const {
  status,
  error,
  refresh,
  itemLength,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/sushi-alerts',
    query: {
      type: 'HARVESTED_BUT_UNSUPPORTED',
    },
  },
  data: {
    sortBy: [{ key: 'severity', order: 'desc' }],
    search: undefined,
  },
  async: {
    lazy: true,
  },
});

// Allow parent component to refresh
onMounted(() => {
  props.defineRefresh({
    execute: refresh,
    status,
  });
});

const headers = computed(() => [
  {
    title: t('sushi.alerts.unsupportedButHarvested.severity'),
    value: 'severity',
    align: 'center',
    sortable: true,
  },
  {
    title: t('institutions.sushi.endpoint'),
    value: 'context.credentials.endpoint.vendor',
    sortable: true,
  },
  {
    title: t('institutions.title'),
    value: 'context.credentials.institution.name',
    sortable: true,
  },
  {
    title: t('harvest.jobs.period'),
    value: 'period',
    align: 'center',
  },
  {
    title: t('harvest.jobs.reportType'),
    value: 'context.reportId',
    align: 'center',
    sortable: true,
    cellProps: {
      class: ['text-uppercase'],
    },
  },
  {
    title: t('status'),
    value: 'context.status',
    align: 'center',
    sortable: true,
  },
  {
    title: t('actions'),
    value: 'actions',
  },
]);

async function openHarvestMatrix(item) {
  if (!harvestMatrixRef.value) {
    return;
  }

  matrixLoading.value = `${item.context.reportId}:${item.context.status}:${item.context.credentialsId}`;

  try {
    const sushiItem = await $fetch(`/api/sushi/${item.context.credentialsId}`, {
      include: ['endpoint', 'harvests'],
    });

    harvestMatrixRef.value.open(sushiItem, { period: item.context.beginDate });
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  matrixLoading.value = '';
}

function deleteHarvestedPeriod(item) {
  openConfirm({
    text: t('sushi.alerts.unsupportedButHarvested.deletePeriod', {
      reportId: item.context.reportId.toUpperCase(),
      institutionName: item.context.credentials.institution.name,
      beginDate: item.context.beginDate,
      endDate: item.context.endDate,
    }),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      lockActions.value = true;

      try {
        await $fetch('/api/harvests/_by-query', {
          method: 'DELETE',
          body: {
            credentialsId: item.context.credentialsId,
            reportId: item.context.reportId,
            period: {
              from: item.context.beginDate,
              to: item.context.endDate,
            },
            status: item.context.status,
          },
        });

        await $fetch(`/api/sushi-alerts/${item.id}`, {
          method: 'DELETE',
        });

        refresh();
      } catch (err) {
        snacks.error(t('anErrorOccurred'), err);
      }

      lockActions.value = false;
    },
  });
}
</script>
