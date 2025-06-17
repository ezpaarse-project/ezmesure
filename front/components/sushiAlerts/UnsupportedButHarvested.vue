<template>
  <div>
    <v-progress-linear
      v-if="status === 'pending'"
      color="primary"
      indeterminate
    />

    <v-alert
      v-else-if="error"
      :text="$t('sushi.alerts.unsupportedButHarvested.error', { error: error.message })"
      type="error"
    />

    <v-empty-state
      v-else-if="alerts.length <= 0"
      :title="$t('sushi.alerts.unsupportedButHarvested.empty')"
      icon="mdi-check"
      color="green"
    />

    <v-data-table
      v-else
      :items="alerts"
      :headers="headers"
      :sort-by="[{ key: 'severity', order: 'desc' }]"
    >
      <template #[`item.severity`]="{ value }">
        <v-icon v-if="value === 'info'" color="info" icon="mdi-information-outline" />
        <v-icon v-else-if="value === 'warning'" color="warning" icon="mdi-alert-outline" />
        <v-icon v-else color="error" icon="mdi-alert-outline" />
      </template>

      <template #[`item.data.credentials.endpoint.vendor`]="{ item, value }">
        <nuxt-link :to="`/admin/endpoints/${item.data.credentials.endpoint.id}`">
          {{ value }}
        </nuxt-link>
      </template>

      <template #[`item.data.credentials.institution.name`]="{ item, value }">
        <nuxt-link :to="`/admin/institutions/${item.data.credentials.institution.id}/sushi`">
          {{ value }}
        </nuxt-link>
      </template>

      <template #[`item.data.status`]="{ value }">
        <v-chip
          :text="t(`tasks.status.${value}`)"
          :prepend-icon="harvestStatus.get(value)?.icon"
          :color="harvestStatus.get(value)?.color"
          density="comfortable"
          variant="outlined"
        />
      </template>

      <template #[`item.period`]="{ item }">
        {{ item.data.beginDate }} - {{ item.data.endDate }}
      </template>

      <template #[`item.actions`]="{ item }">
        <v-btn
          v-tooltip:top="$t('sushi.harvestState')"
          :disabled="!!lockActions"
          :loading="matrixLoading === `${item.data.reportId}:${item.data.status}:${item.data.credentialsId}`"
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
      </template>
    </v-data-table>

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

const lockActions = ref(false);
const matrixLoading = ref('');

const harvestMatrixRef = useTemplateRef('harvestMatrixRef');

const {
  status,
  data: alerts,
  error,
  refresh,
} = await useFetch('/api/sushi-alerts', {
  lazy: true,
  query: {
    type: 'harvestedButUnsupported',
  },
});

// Allow parent component to refresh
props.defineRefresh({
  execute: refresh,
  status,
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
    value: 'data.credentials.endpoint.vendor',
    sortable: true,
  },
  {
    title: t('institutions.title'),
    value: 'data.credentials.institution.name',
    sortable: true,
  },
  {
    title: t('harvest.jobs.period'),
    value: 'data.period',
    align: 'center',
  },
  {
    title: t('harvest.jobs.reportType'),
    value: 'data.reportId',
    align: 'center',
    sortable: true,
    cellProps: {
      class: ['text-uppercase'],
    },
  },
  {
    title: t('status'),
    value: 'data.status',
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

  matrixLoading.value = `${item.data.reportId}:${item.data.status}:${item.data.credentialsId}`;

  try {
    const sushiItem = await $fetch(`/api/sushi/${item.data.credentialsId}`, {
      include: ['endpoint', 'harvests'],
    });

    harvestMatrixRef.value.open(sushiItem, { period: item.data.beginDate });
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  matrixLoading.value = '';
}

function deleteHarvestedPeriod(item) {
  openConfirm({
    text: t('sushi.alerts.unsupportedButHarvested.deletePeriod', {
      reportId: item.data.reportId.toUpperCase(),
      institutionName: item.data.institution.name,
      beginDate: item.data.beginDate,
      endDate: item.data.endDate,
    }),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      lockActions.value = true;

      try {
        await $fetch('/api/harvests/_by-query', {
          method: 'DELETE',
          body: {
            credentialsId: item.data.credentialId,
            reportId: item.data.reportId,
            period: {
              from: item.data.beginDate,
              to: item.data.endDate,
            },
            status: item.data.status,
          },
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
