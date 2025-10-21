<template>
  <div>
    <v-data-table-server
      v-model="selectedSushi"
      :headers="headers"
      :row-props="({ item }) => ({ class: 'bg-grey-lighten-4 text-grey' })"
      :item-selectable="(item) => !item.deletedAt"
      density="comfortable"
      show-select
      show-expand
      single-expand
      return-object
      v-bind="vDataTableOptions"
      class="mt-4"
    >
      <template #[`header.harvests`]="{ column: { title } }">
        <div>{{ title }}</div>

        <div class="d-flex justify-center align-center">
          <v-btn
            :disabled="status === 'pending'"
            color="primary"
            variant="text"
            density="comfortable"
            icon="mdi-arrow-left"
            @click="currentHarvestYear -= 1"
          />

          <span class="mx-3">
            {{ currentHarvestYear }}
          </span>

          <v-btn
            :disabled="status === 'pending' || currentHarvestYear >= maxHarvestYear"
            color="primary"
            variant="text"
            density="comfortable"
            icon="mdi-arrow-right"
            @click="currentHarvestYear += 1"
          />
        </div>
      </template>

      <template #[`item.endpoint.vendor`]="{ item }">
        <div class="my-2">
          <div>
            <nuxt-link v-if="user?.isAdmin" :to="`/admin/endpoints/${item.endpoint.id}`">
              {{ item.endpoint.vendor }}
            </nuxt-link>
            <span v-else>{{ item.endpoint.vendor }}</span>
          </div>

          <SushiEndpointVersionsChip :model-value="item.endpoint" size="small" />

          <v-chip
            v-for="tag in item.endpoint.tags ?? []"
            :key="tag"
            :text="tag"
            color="accent"
            density="comfortable"
            variant="outlined"
            size="small"
            label
            class="mr-2"
          />
        </div>
      </template>

      <template #[`item.packages`]="{ value }">
        <v-chip
          v-for="(pkg, index) in value"
          :key="index"
          :text="pkg"
          size="small"
          label
          class="mr-1"
        />
      </template>

      <template #[`item.connection`]="{ item }">
        <SushiConnectionChip
          :sushi="{ ...item, institution }"
          :disabled="isLocked"
          @update:model-value="item.connection = $event; debouncedRefresh()"
        />
      </template>

      <template #[`item.harvests`]="{ item }">
        <SushiHarvestStateChip
          v-if="item.harvests?.length > 0 && !item.deletedAt"
          :model-value="item.harvests"
          :endpoint="item.endpoint"
          :current-year="currentHarvestYear"
          @click:harvest="harvestMatrixRef?.open(item, { period: $event.period })"
        />
      </template>

      <template #[`item.deletionTask`]="{ value, item }">
        <v-progress-circular
          v-if="item.deletedAt"
          v-tooltip:top="value ? (value.error ? $t('sushi.deleting') : $t('sushi.deletingError', { ...value })) : $t('sushi.deletingWaiting')"
          :value="value?.progress * 100"
          :color="value?.canceled ? 'red' : 'primary'"
          :indeterminate="!value"
          size="35"
          width="2"
        >
          <div class="d-flex align-center justify-center">
            <v-icon icon="mdi-trash-can-outline" />
          </div>
        </v-progress-circular>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ props: menu }">
            <v-btn
              :disabled="!!item.deletedAt"
              icon="mdi-cog"
              variant="plain"
              density="compact"
              v-bind="menu"
            />
          </template>

          <v-list>
            <v-list-item
              :title="$t('unarchive')"
              :disabled="!canEdit"
              prepend-icon="mdi-archive-off"
              @click="unarchiveSushis([item])"
            />
            <v-list-item
              :title="$t('delete')"
              :disabled="!canEdit"
              prepend-icon="mdi-delete"
              @click="deleteSushis([item])"
            />

            <v-divider />

            <v-list-item
              :title="$t('institutions.sushi.checkCredentials')"
              prepend-icon="mdi-connection"
              @click="checkConnections([item])"
            />
            <v-list-item
              v-if="user?.isAdmin"
              :title="$t('institutions.sushi.resetChecks')"
              prepend-icon="mdi-restore"
              @click="resetConnections([item])"
            />
            <v-list-item
              v-if="harvestMatrixRef"
              :title="$t('sushi.harvestState')"
              prepend-icon="mdi-table-headers-eye"
              @click="harvestMatrixRef?.open(item)"
            />
            <v-list-item
              v-if="reportsRef"
              :title="$t('reports.supportedReports')"
              prepend-icon="mdi-file-search"
              @click="reportsRef?.open(item)"
            />
            <v-list-item
              v-if="filesRef"
              :title="$t('sushi.showFiles')"
              prepend-icon="mdi-file-tree"
              @click="filesRef?.open(item)"
            />
            <v-list-item
              v-if="historyRef"
              :title="$t('tasks.history')"
              prepend-icon="mdi-history"
              @click="historyRef?.open(item)"
            />
            <v-list-item
              v-if="clipboard"
              :title="$t('sushi.copyId')"
              prepend-icon="mdi-identifier"
              @click="copySushiId(item)"
            />
          </v-list>
        </v-menu>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <SushiDetails :model-value="item" />
          </td>
        </tr>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedSushi"
      :text="$t('institutions.sushi.manageN', selectedSushi.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('unarchive')"
          :disabled="!canEdit"
          prepend-icon="mdi-archive-off"
          @click="unarchiveSushis()"
        />
        <v-list-item
          :title="$t('delete')"
          :disabled="!canEdit"
          prepend-icon="mdi-delete"
          @click="deleteSushis()"
        />

        <v-divider />

        <v-list-item
          :title="$t('institutions.sushi.checkCredentials')"
          prepend-icon="mdi-connection"
          @click="checkConnections()"
        />
        <v-list-item
          v-if="user?.isAdmin"
          :title="$t('institutions.sushi.resetChecks')"
          prepend-icon="mdi-restore"
          @click="resetConnections()"
        />
      </template>
    </SelectionMenu>
    <SushiHarvestMatrixDialog ref="harvestMatrixRef" />

    <SushiHarvestFilesDialog v-if="user?.isAdmin" ref="filesRef" />

    <SushiHarvestHistoryDialog v-if="user?.isAdmin" ref="historyRef" />

    <SushiReportsDialog ref="reportsRef" />

    <SushiDeleteConfirmDialog ref="deleteConfirmRef" />
  </div>
</template>

<script setup>
const props = defineProps({
  institution: {
    type: Object,
    required: true,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  defineTab: {
    type: Function,
    default: (tab) => tab,
  },
});

const emit = defineEmits({
  mounted: (tab) => !!tab,
  'update:institution.sushiReadySince': (value) => value === null || !!value,
  refresh: () => true,
});

const maxHarvestYear = new Date().getFullYear();

const { params } = useRoute();
const { data: user } = useAuthState();
const { t, locale } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();
const { addToCheck } = useSushiCheckQueueStore();
const snacks = useSnacksStore();

const selectedSushi = ref([]);
const activeLoadingMap = ref(new Map());
const currentHarvestYear = ref(maxHarvestYear);

const harvestMatrixRef = useTemplateRef('harvestMatrixRef');
const reportsRef = useTemplateRef('reportsRef');
const filesRef = useTemplateRef('filesRef');
const historyRef = useTemplateRef('historyRef');
const deleteConfirmRef = useTemplateRef('deleteConfirmRef');

const {
  refresh,
  itemLength,
  query,
  data: sushis,
  status,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: `/api/institutions/${params.id}/sushi`,
    query: {
      include: ['endpoint', 'harvests', 'deletionTask'],
      archived: true,
    },
  },
  data: {
    sortBy: [
      { key: 'endpoint.vendor', order: 'asc' },
      { key: 'packages', order: 'asc' },
      { key: 'archivedUpdatedAt', order: 'desc' },
    ],
  },
  async: {
    key: 'archived-sushi-table',
    deep: true,
  },
});

onMounted(() => {
  emit('mounted', {
    refresh,
    itemLength,
    query,
  });
});

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('institutions.sushi.endpoint'),
    value: 'endpoint.vendor',
    sortable: true,
    maxWidth: '350px',
  },
  {
    title: t('institutions.sushi.packages'),
    value: 'packages',
    sortable: true,
    align: 'end',
  },
  {
    title: t('status'),
    value: 'connection',
    minWidth: '200px',
    maxWidth: '200px',
    sortable: true,
    align: 'center',
  },
  {
    title: t('institutions.sushi.harvest'),
    value: 'harvests',
    align: 'center',
  },
  {
    title: t('sushi.deletionTask'),
    value: 'deletionTask',
    align: 'center',
  },
  {
    title: t('actions'),
    value: 'actions',
    align: 'center',
  },
]);
/**
 * Sushi ready formatted date
 */
const isSushiReady = computed(() => props.institution?.sushiReadySince || false);
/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(async () => {
  await refresh();
  emit('refresh');
}, 250);

/**
 * Put sushi ID into clipboard
 *
 * @param {object} param0 Sushi
 */
async function copySushiId({ id }) {
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

/**
 * Check connections for selected sushi
 *
 * @param {any[]} items Sushi to check, defaults to selected
 */
function checkConnections(items) {
  const toCheck = items || selectedSushi.value;
  if (toCheck.length <= 0) {
    return;
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const item of toCheck) {
    addToCheck({ ...item, institution: institution.value }, {
      onComplete: (err, connection) => {
        if (connection) {
          item.connection = connection;
          debouncedRefresh();
        }
      },
    });
  }

  if (!items) {
    selectedSushi.value = [];
  }
}

/**
 * Toggle archive states for selected sushi
 *
 * @param {any[]} items Sushi to toggle, defaults to selected
 */
async function unarchiveSushis(items) {
  const toArchive = items || selectedSushi.value;
  if (toArchive.length <= 0) {
    return;
  }

  // Show confirm if already ready
  if (!user.value.isAdmin && isSushiReady.value) {
    const shouldUnready = await openConfirm({
      title: t('institutions.sushi.resumeEntryQuestion'),
      text: t(
        'institutions.sushi.resumeEntryDesc',
        { date: dateFormat(isSushiReady.value, locale.value) },
      ),
    });

    if (!shouldUnready) {
      return;
    }

    emit('update:institution.sushiReadySince', null);
    emit('refresh');
  }

  const results = await Promise.all(
    toArchive.map(async (item) => {
      activeLoadingMap.value.set(item.id, true);
      try {
        await $fetch(`/api/sushi/${item.id}`, {
          method: 'PATCH',
          body: { archived: false },
        });

        // eslint-disable-next-line no-param-reassign
        item.active = false; // Shows as inactive to show progress
      } catch (err) {
        snacks.error(t('sushi.cannotArchiveItems', { id: item.name || item.id }), err);
      } finally {
        activeLoadingMap.value.set(item.id, false);
      }
    }),
  );

  if (!results.some((r) => !r)) {
    snacks.success(t('sushi.itemsArchived', { count: toArchive.length }));
  }

  if (!items) {
    selectedSushi.value = [];
  }

  await refresh();
  emit('refresh');
}

/**
 * Reset connections for selected sushi
 *
 * @param {any[]} items Sushi to reset, defaults to selected
 */
async function resetConnections(items) {
  let toReset = items || selectedSushi.value;
  if (toReset.length <= 0) {
    return;
  }

  toReset = toReset.filter((item) => !!item?.connection?.status);
  // No reset needed, simulate like we just did
  if (!items && toReset.length <= 0) {
    selectedSushi.value = [];
    return;
  }

  openConfirm({
    text: t(
      'institutions.sushi.resetNbChecks',
      toReset.length,
    ),
    agreeText: t('reset'),
    agreeIcon: 'mdi-restore',
    onAgree: async () => {
      await Promise.all(
        toReset.map(
          (item) => $fetch(`/api/sushi/${item.id}/connection`, { method: 'DELETE' })
            .catch((err) => {
              snacks.error(t('institutions.sushi.cannotResetCheck', { id: item.endpoint?.vendor || item.id }), err);
              return null;
            }),
        ),
      );

      if (!items) {
        selectedSushi.value = [];
      }

      await refresh();
      emit('refresh');
    },
  });
}
/**
 * Delete selected sushi
 *
 * @param {any[]} items Sushi to delete, defaults to selected
 */
async function deleteSushis(items) {
  const toDelete = items || selectedSushi.value;
  if (toDelete.length <= 0) {
    return;
  }

  deleteConfirmRef.value?.openConfirm({
    toDelete,
    onAgree: async () => {
      if (!items) {
        selectedSushi.value = [];
      }

      await refresh();
      emit('refresh');
    },
  });
}

watchOnce(
  sushis,
  (v) => {
    const harvests = v
      .flatMap((s) => s.harvests || [])
      .sort((a, b) => a.period.localeCompare(b.period));

    const lastYear = harvests.at(-1)?.period?.replace(/(-[0-9]{2})*$/, '');
    if (lastYear) {
      currentHarvestYear.value = Number.parseInt(lastYear, 10);
    }
  },
);
</script>
