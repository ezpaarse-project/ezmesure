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

      <template #[`item.context.endpoint.vendor`]="{ item, value }">
        <nuxt-link :to="`/admin/endpoints/${item.context.endpoint.id}`">
          {{ value }}
        </nuxt-link>
      </template>

      <template #[`item.context.counterVersion`]="{ value }">
        <v-chip
          :text="value"
          :color="counterVersionsColors.get(value) || 'secondary'"
          density="comfortable"
          variant="flat"
          label
          class="mr-1"
        />
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
      type: 'ENDPOINT',
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
    title: t('sushi.alerts.severity'),
    value: 'severity',
    align: 'center',
    sortable: true,
  },
  {
    title: t('institutions.sushi.endpoint'),
    value: 'context.endpoint.vendor',
    sortable: true,
  },
  {
    title: t('sushi.alerts.endpoint.message'),
    value: 'context.message',
  },
  {
    title: t('endpoints.counterVersion'),
    value: 'context.counterVersion',
    align: 'center',
  },
]);
</script>
