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
              v-tooltip="$t('refresh')"
              :loading="status === 'pending'"
              icon="mdi-reload"
              variant="tonal"
              density="comfortable"
              color="primary"
              class="mr-2"
              @click="refresh()"
            />
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
              @click="() => {}"
            />
            <v-list-item
              :disabled="unDeletableStatus.has(item.status)"
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="() => {}"
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

    <SushiHarvestTaskHistoryDialog ref="historyRef" :session="modelValue" />
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

const historyRef = useTemplateRef('historyRef');

const {
  status,
  refresh,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/tasks',
  },
  data: {
    sortBy: [{ key: 'startedAt', order: 'desc' }],
    include: ['credentials.institution', 'credentials.endpoint', 'steps', 'logs'],
    sessionId: props.modelValue.id,
    search: undefined, // q parameter is not allowed
  },
});

const headers = computed(() => [
  {
    title: t('endpoints.vendor'),
    value: 'credentials.endpoint.vendor',
    sortable: 'true',
  },
  {
    title: t('institutions.title'),
    value: 'credentials.institution.name',
    sortable: 'true',
  },
  {
    title: t('institutions.sushi.packages'),
    value: 'credentials.packages',
  },
  {
    title: t('harvest.jobs.reportType'),
    value: 'reportType',
    align: 'center',
    sortable: 'true',
    cellProps: {
      class: ['text-uppercase'],
    },
  },
  {
    title: t('status'),
    value: 'status',
    align: 'center',
  },
  {
    title: t('harvest.jobs.startedAt'),
    value: 'startedAt',
    sortable: 'true',
  },
  {
    title: t('harvest.jobs.updatedAt'),
    value: 'updatedAt',
    sortable: 'true',
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
  } catch {
    snacks.error(t('clipboard.unableToCopy'));
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>
