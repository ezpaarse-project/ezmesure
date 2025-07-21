<template>
  <div>
    <v-data-table-server
      v-model="selectedSushi"
      :headers="headers"
      :row-props="({ item }) => ({ class: !(item.active && item.endpoint.active) && 'bg-grey-lighten-4 text-grey' })"
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
            <nuxt-link v-if="user?.isAdmin" :to="`/admin/endpoints/${item.endpoint.id}`" :class="[!item.active ? 'text-grey' : '']">
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

      <template #[`item.active`]="{ item }">
        <div class="d-flex align-center">
          <v-switch
            v-tooltip:left="$t(`endpoints.${item.active ? 'activeSince' : 'inactiveSince'}`, { date: dateFormat(item.activeUpdatedAt, locale) })"
            :model-value="item.active"
            :label="item.active ? $t('endpoints.active') : $t('endpoints.inactive')"
            :loading="activeLoadingMap.get(item.id)"
            :readonly="!canEdit"
            density="compact"
            color="primary"
            hide-details
            class="mt-0"
            style="transform: scale(0.8);"
            @update:model-value="toggleActiveStates([item])"
          />

          <v-spacer />

          <v-icon
            v-if="!item.endpoint.active"
            v-tooltip="$t('endpoints.inactiveDescription')"
            icon="mdi-api-off"
            color="warning"
          />
        </div>
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
              v-if="sushiFormRef"
              :title="$t('modify')"
              :disabled="!canEdit"
              prepend-icon="mdi-pencil"
              @click="sushiFormRef?.open(item, { institution })"
            />
            <v-list-item
              v-if="sushiFormRef"
              :title="$t('duplicate')"
              :disabled="!canEdit"
              prepend-icon="mdi-content-copy"
              @click="sushiFormRef?.open({ ...item, id: null }, { institution })"
            />
            <v-list-item
              :title="$t('archive')"
              :disabled="!canEdit"
              prepend-icon="mdi-archive"
              @click="archiveSushis([item])"
            />
            <v-list-item
              v-if="currentTab === 'archived'"
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
          :title="$t('archive')"
          :disabled="!canEdit"
          prepend-icon="mdi-archive"
          @click="archiveSushis()"
        />

        <v-divider />

        <v-list-item
          :title="$t('institutions.sushi.activeSwitch')"
          :disabled="!canEdit"
          prepend-icon="mdi-toggle-switch"
          @click="toggleActiveStates()"
        />
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

    <SushiFormDialog
      ref="sushiFormRef"
      @submit="refresh()"
      @update:model-value="onSushiUpdate($event)"
    />

    <SushiHarvestMatrixDialog ref="harvestMatrixRef" />

    <SushiHarvestFilesDialog v-if="user?.isAdmin" ref="filesRef" />

    <SushiHarvestHistoryDialog v-if="user?.isAdmin" ref="historyRef" />

    <SushiReportsDialog ref="reportsRef" />
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

const maxHarvestYear = new Date().getFullYear();

const { data: user } = useAuthState();
const { t, locale } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();
const { addToCheck } = useSushiCheckQueueStore();
const snacks = useSnacksStore();

const selectedSushi = ref([]);
const activeLoadingMap = ref(new Map());
const currentHarvestYear = ref(maxHarvestYear);

const sushiFormRef = useTemplateRef('sushiFormRef');
const harvestMatrixRef = useTemplateRef('harvestMatrixRef');
const reportsRef = useTemplateRef('reportsRef');
const filesRef = useTemplateRef('filesRef');
const historyRef = useTemplateRef('historyRef');

const {
  refresh,
  itemLength,
  query,
  data: sushis,
  status,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: `/api/institutions/${props.institution.id}/sushi`,
    query: {
      include: ['endpoint', 'harvests', 'deletionTask'],
      archived: false,
    },
  },
  data: {
    sortBy: [{ key: 'endpoint.vendor', order: 'asc' }],
  },
});

onMounted(() => {
  props.defineTab?.({
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
    title: t('endpoints.active'),
    value: 'active',
    align: 'center',
    minWidth: '130px',
    sortable: true,
  },
  {
    title: t('actions'),
    value: 'actions',
    align: 'center',
  },
]);

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

function onSushiUpdate(item) {
  const index = sushis.value.findIndex((sushi) => sushi.id === item.id);
  if (index < 0) {
    return;
  }

  sushis.value[index] = item;
}

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
    addToCheck({ ...item, institution: props.institution }, {
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
 * Toggle active states for selected sushi
 *
 * @param {any[]} items Sushi to toggle, defaults to selected
 */
async function toggleActiveStates(items) {
  const toToggle = items || selectedSushi.value;
  if (toToggle.length <= 0) {
    return;
  }

  await Promise.all(
    toToggle.map(async (item) => {
      activeLoadingMap.value.set(item.id, true);
      try {
        const active = !item.active;
        // eslint-disable-next-line no-await-in-loop
        await $fetch(`/api/sushi/${item.id}`, {
          method: 'PATCH',
          body: { active },
        });

        // eslint-disable-next-line no-param-reassign
        item.active = active;
        return item;
      } catch (err) {
        snacks.error(t('sushi.unableToUpdate'), err);
        return null;
      } finally {
        activeLoadingMap.value.set(item.id, false);
      }
    }),
  );

  if (!items) {
    selectedSushi.value = [];
  }
}

/**
 * Toggle archive states for selected sushi
 *
 * @param {any[]} items Sushi to toggle, defaults to selected
 */
async function archiveSushis(items) {
  const toArchive = items || selectedSushi.value;
  if (toArchive.length <= 0) {
    return;
  }

  openConfirm({
    text: t(
      'sushi.archiveNbCredentials',
      toArchive.length,
    ),
    agreeText: t('archive'),
    agreeIcon: 'mdi-archive',
    onAgree: async () => {
      const results = await Promise.all(
        toArchive.map(async (item) => {
          activeLoadingMap.value.set(item.id, true);
          try {
            await $fetch(`/api/sushi/${item.id}`, {
              method: 'PATCH',
              body: { archived: true },
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
    },
  });
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
