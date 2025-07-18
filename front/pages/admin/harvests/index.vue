<template>
  <div>
    <SkeletonPageBar
      v-model="query"
      :title="toolbarTitle"
      :refresh="refresh"
      search
      icons
      @update:model-value="debouncedRefresh()"
    />

    <v-data-iterator :items="sessionsWithStatus" items-per-page="0">
      <template #default="{ items }">
        <v-expansion-panels>
          <v-expansion-panel
            v-for="({ raw: item }) in items"
            :key="item.id"
            :readonly="!item.startedAt"
            :expand-icon="!item.startedAt ? '' : undefined"
          >
            <template #title>
              <SushiHarvestSessionHeader :model-value="item" />
            </template>

            <template #text>
              <SushiHarvestSessionBody :model-value="item" />
            </template>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>

      <template #footer>
        <div class="d-flex align-center mt-2 mx-4">
          <v-pagination rounded v-bind="vPaginationOptions" :total-visible="10" />

          <v-spacer />

          {{ $t('$vuetify.dataFooter.itemsPerPageText') }}
          <div class="ml-2" style="width: 90px;">
            <v-select
              v-model="itemsPerPage"
              :items="itemsPerPageOptions"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="refresh()"
            />
          </div>
        </div>
      </template>
    </v-data-iterator>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { t } = useI18n();

const {
  data: sessions,
  refresh,
  itemLength,
  query,
  itemsPerPage,
  itemsPerPageOptions,
  vPaginationOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/harvests-sessions',
  },
  data: {
    sortBy: [{ key: 'createdAt', order: 'desc' }],
  },
});

const sessionsIds = computed(() => sessions.value?.map((s) => s.id));

const statuses = computedAsync(
  async (onCancel) => {
    if (!sessionsIds.value?.length) {
      return {};
    }

    const abortController = new AbortController();
    onCancel(() => abortController.abort());

    return $fetch('/api/harvests-sessions/status', {
      signal: abortController.signal,
      params: {
        harvestIds: sessionsIds.value,
      },
    });
  },
  undefined,
  { lazy: true },
);

const sessionsWithStatus = computed(() => sessions.value?.map(
  (s) => ({
    ...s,
    _status: statuses.value?.[s.id],
  }),
));

/**
 * Toolbar title
 */
const toolbarTitle = computed(() => {
  let count = `${itemLength.value.current}`;
  if (itemLength.value.current !== itemLength.value.total) {
    count = `${itemLength.value.current}/${itemLength.value.total}`;
  }
  return `${t('menu.harvest.group')} / ${t('harvest.toolbarTitle', { count: count ?? '?' })}`;
});

const debouncedRefresh = useDebounceFn(refresh, 500);
</script>
