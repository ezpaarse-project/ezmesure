<template>
  <div>
    <v-progress-linear
      v-if="status === 'pending'"
      color="primary"
      indeterminate
    />

    <v-alert
      v-if="error"
      :text="$t('sushi.alerts.unsupportedButHarvested.error', { error: error.message })"
      type="error"
    />

    <v-empty-state
      v-if="unsupportedButHarvested.length <= 0"
      :title="$t('sushi.alerts.unsupportedButHarvested.empty')"
      icon="mdi-check"
      color="green"
    />

    <v-data-table
      v-else
      :items="unsupportedButHarvested"
      :headers="headers"
      :sort-by="[{ key: 'severity', order: 'desc' }]"
    >
      <template #[`item.severity`]="{ item }">
        <v-icon v-if="item.severity === 'low'" color="info" icon="mdi-information-outline" />
        <v-icon v-else-if="item.severity === 'medium'" color="warning" icon="mdi-alert-outline" />
        <v-icon v-else color="error" icon="mdi-alert-outline" />
      </template>

      <template #[`item.endpoint.vendor`]="{ item, value }">
        <nuxt-link :to="`/admin/endpoints/${item.endpoint.id}`">
          {{ value }}
        </nuxt-link>
      </template>

      <template #[`item.institution.name`]="{ item, value }">
        <nuxt-link :to="`/admin/institutions/${item.institution.id}/sushi`">
          {{ value }}
        </nuxt-link>
      </template>

      <template #[`item.status.key`]="{ item, value }">
        <v-chip
          :text="t(`tasks.status.${value}`)"
          :prepend-icon="item.status.icon"
          :color="item.status.color"
          density="comfortable"
          variant="outlined"
        />
      </template>

      <template #[`item.period`]="{ item }">
        {{ item.beginDate }} - {{ item.endDate }}
      </template>

      <template #[`item.actions`]="{ item }">
        <v-btn
          v-tooltip:top="$t('sushi.harvestState')"
          :disabled="!!lockActions"
          :loading="matrixLoading === item.id"
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
const PENDING_STATUS = new Set(['running', 'waiting', 'delayed']);

const SEVERITY_PER_STATUS = new Map([
  ['finished', 'low'],
  ['missing', 'medium'],
  // will defaults to "high"
]);

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
  data: harvests,
  error,
  refresh,
} = await useFetch('/api/harvests', {
  lazy: true,
  query: {
    size: 0,
    include: ['credentials'],
  },
});

// Allow parent component to refresh
onMounted(() => {
  props.defineRefresh({
    execute: refresh,
    status,
  });
});

/** Key to cache credentials data */
const credentialsIds = computed(() => Array.from(new Set(harvests.value?.map((h) => h.credentialsId))).join(','));

/** Credentials concerned by harvests grouped by id */
const credentials = computedAsync(async () => {
  if (!credentialsIds.value) {
    return undefined;
  }

  const groups = credentialsIds.value.split(',').reduce((acc, id) => {
    let current = acc.at(-1);
    if (!current || current.length > 25) {
      acc.push([]);
      current = acc.at(-1);
    }

    current.push(id);
    return acc;
  }, []);

  try {
    // TODO: move server side
    const values = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const group of groups) {
      // eslint-disable-next-line no-await-in-loop
      const res = await $fetch('/api/sushi', {
        query: {
          size: 0,
          id: group,
        },
      });
      values.push(...res);
    }

    return new Map(values.map((c) => [c.id, c]));
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
    return new Map();
  }
});

/** Key to cache endpoint data */
const endpointsIds = computed(() => Array.from(new Set(Array.from(credentials.value.values())?.map((c) => c.endpointId))).join(','));

/** Endpoints concerned by harvests grouped by id */
const endpoints = computedAsync(async () => {
  if (!endpointsIds.value) {
    return undefined;
  }

  const groups = credentialsIds.value.split(',').reduce((acc, id) => {
    let current = acc.at(-1);
    if (!current || current.length > 25) {
      acc.push([]);
      current = acc.at(-1);
    }

    current.push(id);
    return acc;
  }, []);

  try {
    // TODO: move server side
    const values = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const group of groups) {
      // eslint-disable-next-line no-await-in-loop
      const res = await $fetch('/api/sushi-endpoints', {
        query: {
          size: 0,
          id: group,
        },
      });
      values.push(...res);
    }

    return new Map(values.map((e) => [e.id, e]));
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
    return new Map();
  }
});

/** Key to cache institution data */
const institutionsIds = computed(() => Array.from(new Set(Array.from(credentials.value.values())?.map((c) => c.institutionId))).join(','));

/** Institutions concerned by harvests grouped by id */
const institutions = computedAsync(async () => {
  if (!institutionsIds.value) {
    return undefined;
  }

  try {
    const values = await $fetch('/api/institutions', {
      query: {
        size: 0,
        id: institutionsIds.value.split(','),
      },
    });

    return new Map(values.map((e) => [e.id, e]));
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
    return new Map();
  }
});

const unsupportedButHarvested = computed(() => {
  if (!harvests.value || !endpoints.value || !institutions.value) {
    return [];
  }

  const map = new Map();

  // eslint-disable-next-line no-restricted-syntax
  for (const harvest of harvests.value) {
    // Ignore pending harvests
    if (PENDING_STATUS.has(harvest.status)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const creds = credentials.value?.get(harvest.credentialsId);
    const endpoint = endpoints.value.get(creds.endpointId);
    // Ignore supported harvests
    if (!endpoint || endpoint.supportedData?.[harvest.reportId]?.supported?.value) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const key = `${harvest.credentialsId}:${harvest.reportId}:${harvest.status}`;

    const group = map.get(key) ?? {
      id: key,

      reportId: harvest.reportId,
      status: {
        ...harvestStatus.get(harvest.status),
        key: harvest.status,
      },
      severity: SEVERITY_PER_STATUS.get(harvest.status) || 'high',

      beginDate: harvest.period,
      endDate: harvest.period,

      credentials: creds,
      endpoint,
      institution: institutions.value.get(creds.institutionId),
    };

    // TODO: what if missing one ?
    if (group.beginDate >= harvest.period) {
      group.beginDate = harvest.period;
    }
    if (group.endDate <= harvest.period) {
      group.endDate = harvest.period;
    }

    map.set(key, group);
  }

  return Array.from(map.values());
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
    value: 'endpoint.vendor',
    sortable: true,
  },
  {
    title: t('institutions.title'),
    value: 'institution.name',
    sortable: true,
  },
  {
    title: t('harvest.jobs.period'),
    value: 'period',
    align: 'center',
  },
  {
    title: t('harvest.jobs.reportType'),
    value: 'reportId',
    align: 'center',
    sortable: true,
    cellProps: {
      class: ['text-uppercase'],
    },
  },
  {
    title: t('status'),
    value: 'status.key',
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

  matrixLoading.value = item.id;

  try {
    const sushiItem = await $fetch(`/api/sushi/${item.credentials.id}`, {
      include: ['endpoint', 'harvests'],
    });

    harvestMatrixRef.value.open(sushiItem, { period: item.beginDate });
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  matrixLoading.value = '';
}

function deleteHarvestedPeriod(item) {
  openConfirm({
    text: t('sushi.alerts.unsupportedButHarvested.deletePeriod', {
      reportId: item.reportId.toUpperCase(),
      institutionName: item.institution.name,
      beginDate: item.beginDate,
      endDate: item.endDate,
    }),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      lockActions.value = true;

      try {
        await $fetch('/api/harvests/_by-query', {
          method: 'DELETE',
          body: {
            credentialsId: item.credentials.id,
            reportId: item.reportId,
            period: {
              from: item.beginDate,
              to: item.endDate,
            },
            status: item.status.key,
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
