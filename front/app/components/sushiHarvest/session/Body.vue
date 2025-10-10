<template>
  <div>
    <v-data-table-server
      :headers="headers"
      v-bind="vDataTableOptions"
    >
      <template #top>
        <v-toolbar :title="$t('harvest.jobs.title')" color="transparent">
          <template #append>
            <v-btn
              v-if="globalHarvestMatrixRef"
              v-tooltip="$t('sushi.globalHarvestState.title')"
              icon="mdi-table-headers-eye"
              variant="tonal"
              density="comfortable"
              color="primary"
              class="mr-2"
              @click="globalHarvestMatrixRef.open()"
            />

            <v-btn
              v-tooltip="$t('refresh')"
              :loading="status === 'pending'"
              icon="mdi-reload"
              variant="tonal"
              density="comfortable"
              color="primary"
              class="mr-2"
              @click="refresh()"
            />

            <SkeletonFilterButton
              v-model="filtersValue"
              icon
            >
              <template #panel="panel">
                <SushiHarvestSessionBodyApiFilters :session-id="modelValue.id" v-bind="panel" />
              </template>
            </SkeletonFilterButton>
          </template>
        </v-toolbar>
      </template>

      <template #[`item.credentials.endpoint.vendor`]="{ item, value }">
        <nuxt-link :to="`/admin/endpoints/${item.credentials.endpointId}`">
          {{ value }}
        </nuxt-link>
      </template>

      <template #[`item.credentials.institution.name`]="{ item, value }">
        <nuxt-link :to="`/admin/institutions/${item.credentials.institutionId}/sushi`">
          {{ value }}
        </nuxt-link>
      </template>

      <template #[`item.credentials.packages`]="{ value }">
        <v-chip
          v-for="(pkg, index) in value"
          :key="index"
          :text="pkg"
          size="small"
          label
          class="mr-1"
        />
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

      <template #[`item.period`]="{ item }">
        {{ item.beginDate }} ~ {{ item.endDate }}
      </template>

      <template #[`item.status`]="{ item }">
        <v-menu location="end center" width="400" open-on-hover>
          <template #activator="{ props: menu }">
            <SushiHarvestTaskChip :model-value="item" size="default" v-bind="menu" />
          </template>

          <SushiHarvestTaskCard :model-value="item" />
        </v-menu>
      </template>

      <template #[`item.startedAt`]="{ value }">
        <LocalDate v-if="value" :model-value="value" format="PPPpp" />
      </template>

      <template #[`item.updatedAt`]="{ value }">
        <LocalDate v-if="value" :model-value="value" format="PPPpp" />
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ props: menu }">
            <v-btn
              icon="mdi-cog"
              variant="plain"
              density="compact"
              v-bind="menu"
            />
          </template>

          <v-list>
            <v-list-item
              :title="$t('cancel')"
              :disabled="!cancellableStatus.has(item.status)"
              prepend-icon="mdi-cancel"
              @click="cancelJob(item)"
            />
            <v-list-item
              :disabled="unDeletableStatus.has(item.status)"
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="deleteJob(item)"
            />

            <v-divider />

            <v-list-item
              v-if="historyRef"
              :title="$t('tasks.history')"
              prepend-icon="mdi-history"
              @click="historyRef?.open(item)"
            />
            <v-list-item
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="mdi-identifier"
              @click="copyId(item)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>

    <SushiHarvestTaskHistoryDialog
      ref="historyRef"
      :session="modelValue"
    />

    <SushiHarvestSessionGlobalMatrixDialog
      ref="globalHarvestMatrixRef"
      :session="modelValue"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const cancellableStatus = new Set(['waiting', 'running', 'delayed']);
const unDeletableStatus = new Set(['running']);

const { t } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const snacks = useSnacksStore();
const { openConfirm } = useDialogStore();

const historyRef = useTemplateRef('historyRef');
const globalHarvestMatrixRef = useTemplateRef('globalHarvestMatrixRef');

const {
  status,
  query,
  refresh,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/tasks',
    query: {
      include: ['credentials.institution', 'credentials.endpoint', 'steps', 'logs'],
      sessionId: props.modelValue.id,
    },
  },
  data: {
    sortBy: [{ key: 'startedAt', order: 'desc' }],
    search: undefined, // q parameter is not allowed
  },
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

const filtersValue = computed({
  get: () => ({
    ...query.value,
    sessionId: undefined,
    page: undefined,
    sortBy: undefined,
    include: undefined,
  }),
  set: (v) => {
    query.value = {
      ...v,
      sessionId: query.value.sessionId,
      page: query.value.page,
      sortBy: query.value.sortBy,
      include: query.value.include,
    };
    debouncedRefresh();
  },
});

const headers = computed(() => [
  {
    title: t('endpoints.vendor'),
    value: 'credentials.endpoint.vendor',
    sortable: true,
  },
  {
    title: t('institutions.title'),
    value: 'credentials.institution.name',
    sortable: true,
  },
  {
    title: t('institutions.sushi.packages'),
    value: 'credentials.packages',
  },
  {
    title: t('harvest.jobs.reportType'),
    value: 'reportType',
    align: 'center',
    sortable: true,
    cellProps: {
      class: ['text-uppercase'],
    },
  },
  {
    title: t('endpoints.counterVersion'),
    value: 'counterVersion',
    align: 'center',
    sortable: true,
  },
  {
    title: t('harvest.jobs.period'),
    value: 'period',
    align: 'center',
  },
  {
    title: t('status'),
    value: 'status',
    align: 'center',
  },
  {
    title: t('actions'),
    value: 'actions',
  },
]);

/**
 * Put job ID into clipboard
 *
 * @param {object} param0 Job
 */
async function copyId({ id }) {
  if (!id) {
    return;
  }

  try {
    await copy(id);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}

async function cancelJob(job) {
  const confirmed = await openConfirm({
    title: t('areYouSure'),
    agreeText: t('cancel'),
    agreeIcon: 'mdi-cancel',
  });

  if (!confirmed) {
    return;
  }

  try {
    await $fetch(`/api/tasks/${job.id}/_cancel`, {
      method: 'POST',
    });
    refresh();
  } catch (err) {
    snacks.error(t('harvest.jobs.unableToStop'), err);
  }
}

async function deleteJob(job) {
  const confirmed = await openConfirm({
    title: t('areYouSure'),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
  });

  if (!confirmed) {
    return;
  }

  try {
    await $fetch(`/api/tasks/${job.id}`, {
      method: 'DELETE',
    });
    refresh();
  } catch (err) {
    snacks.error(t('harvest.jobs.unableToDelete'), err);
  }
}
</script>
