<template>
  <SkeletonPageLoader
    v-if="!institution"
    :error="error"
    show
    show-refresh
    @click:refresh="refresh()"
  />
  <div v-else>
    <SkeletonPageBar
      v-model="query"
      :refresh="refresh"
      :omit-from-filter-count="['search', 'archived']"
      search
      @update:model-value="debouncedRefresh()"
    >
      <template #title>
        <InstitutionBreadcrumbs :institution="institution" :current="toolbarTitle" />
      </template>

      <template #filters-panel="props">
        <SushiApiFilters :institution="institution" v-bind="props" />
      </template>

      <v-btn
        v-if="sushiFormRef"
        :text="$t('add')"
        :disabled="!canEdit"
        prepend-icon="mdi-plus"
        variant="tonal"
        color="green"
        class="mr-2"
        @click="sushiFormRef.open(undefined, { institution })"
      />
    </SkeletonPageBar>

    <v-container fluid>
      <v-row>
        <v-col>
          <p>{{ $t('institutions.sushi.pageDescription') }}</p>
          <p class="font-weight-bold">
            {{ $t('institutions.sushi.pageDescription2') }}
          </p>
        </v-col>
      </v-row>

      <v-row v-if="isLocked">
        <v-col>
          <v-alert
            :title="$t('sushi.managementIsLocked')"
            :text="lockStatus?.reason ? $t('reason', { reason: lockStatus?.reason }) : undefined"
            type="info"
            icon="mdi-lock"
            variant="outlined"
            prominent
          />
        </v-col>
      </v-row>

      <v-row class="justify-space-evenly">
        <template v-if="!sushiMetrics?.statuses">
          <v-col v-for="n in 4" :key="n" cols="2">
            <v-skeleton-loader
              height="100"
              type="paragraph"
            />
          </v-col>
        </template>

        <template v-else>
          <v-col cols="2">
            <SushiMetric
              :model-value="sushiMetrics.statuses.success"
              title-key="sushi.nOperationalCredentials"
              icon="mdi-check"
              color="success"
            />
          </v-col>

          <v-col cols="2">
            <SushiMetric
              :model-value="sushiMetrics.statuses.untested"
              :action-text="$t('show')"
              title-key="sushi.nUntestedCredentials"
              icon="mdi-bell-alert"
              color="info"
              @click="query.connection = 'untested'; refresh()"
            />
          </v-col>

          <v-col cols="2">
            <SushiMetric
              :model-value="sushiMetrics.statuses.unauthorized"
              :action-text="$t('show')"
              title-key="sushi.nInvalidCredentials"
              icon="mdi-key-alert-outline"
              color="warning"
              @click="query.connection = 'unauthorized'; refresh()"
            />
          </v-col>

          <v-col cols="2">
            <SushiMetric
              :model-value="sushiMetrics.statuses.failed"
              :action-text="$t('show')"
              title-key="sushi.nProblematicEndpoints"
              icon="mdi-alert-circle"
              color="error"
              @click="query.connection = 'failed'; refresh()"
            />
          </v-col>
        </template>
      </v-row>
    </v-container>

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
      <template #top>
        <div class="d-flex px-4 mb-2">
          <v-chip
            :text="sushiReadyLabels.status.text"
            :color="sushiReadyLabels.status.color"
            size="small"
            variant="outlined"
          >
            <template v-if="!!sushiReadyLabels.status.icon" #prepend>
              <v-icon :icon="sushiReadyLabels.status.icon" start />
            </template>
          </v-chip>

          <v-spacer />

          <ConfirmPopover
            v-if="canEdit"
            :title="sushiReadyLabels.confirm.title"
            :text="sushiReadyLabels.confirm.text"
            :agree-icon="sushiReadyLabels.confirm.ok.icon"
            :agree-text="sushiReadyLabels.confirm.ok.text"
            :agree="() => toggleSushiReady()"
            :disagree-text="$t('close')"
            width="500"
          >
            <template #activator="{ props: confirm }">
              <v-btn
                :text="sushiReadyLabels.button.text"
                :color="sushiReadyLabels.button.color"
                append-icon="mdi-chevron-down"
                size="small"
                variant="flat"
                v-bind="confirm"
              />
            </template>
          </ConfirmPopover>
        </div>

        <div class="mb-2">
          <v-divider />

          <v-tabs
            v-model="currentTab"
            :items="tabs"
            color="primary"
            grow
            @update:model-value="refresh()"
          >
            <template #tab="{ item }">
              <v-tab
                :prepend-icon="item.icon"
                :text="item.text"
                :value="item.value"
              />
            </template>

            <template #item="{ item }">
              <v-tabs-window-item :value="item.value" class="pa-4">
                {{ item.description }}
              </v-tabs-window-item>
            </template>
          </v-tabs>
        </div>
      </template>

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

      <template #[`item.deletionTask`]="{ value, item }">
        <v-progress-circular
          v-if="item.deletedAt"
          v-tooltip:top="value?.error ? $t('sushi.deleting') : $t('sushi.deletingError', value)"
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
              icon="mdi-cog"
              variant="plain"
              density="compact"
              v-bind="menu"
            />
          </template>

          <v-list>
            <v-list-item
              v-if="sushiFormRef && currentTab === 'active'"
              :title="$t('modify')"
              :disabled="!canEdit || item.deletedAt"
              prepend-icon="mdi-pencil"
              @click="sushiFormRef?.open(item, { institution })"
            />
            <v-list-item
              v-if="sushiFormRef && currentTab === 'active'"
              :title="$t('duplicate')"
              :disabled="!canEdit || item.deletedAt"
              prepend-icon="mdi-content-copy"
              @click="sushiFormRef?.open({ ...item, id: null }, { institution })"
            />
            <v-list-item
              :title="item.archived ? $t('unarchive') : $t('archive')"
              :disabled="!canEdit"
              :prepend-icon="item.archived ? 'mdi-archive-off' : 'mdi-archive'"
              @click="toggleArchiveStates([item])"
            />
            <v-list-item
              v-if="currentTab === 'archived'"
              :title="$t('delete')"
              :disabled="!canEdit || item.deletedAt"
              prepend-icon="mdi-delete"
              @click="deleteSushis([item])"
            />

            <v-divider />

            <v-list-item
              :title="$t('institutions.sushi.checkCredentials')"
              :disabled="item.deletedAt"
              prepend-icon="mdi-connection"
              @click="checkConnections([item])"
            />
            <v-list-item
              v-if="user?.isAdmin"
              :title="$t('institutions.sushi.resetChecks')"
              :disabled="item.deletedAt"
              prepend-icon="mdi-restore"
              @click="resetConnections([item])"
            />
            <v-list-item
              v-if="harvestMatrixRef"
              :title="$t('sushi.harvestState')"
              :disabled="item.deletedAt"
              prepend-icon="mdi-table-headers-eye"
              @click="harvestMatrixRef?.open(item)"
            />
            <v-list-item
              v-if="reportsRef"
              :title="$t('reports.supportedReports')"
              :disabled="item.deletedAt"
              prepend-icon="mdi-file-search"
              @click="reportsRef?.open(item)"
            />
            <v-list-item
              v-if="filesRef"
              :title="$t('sushi.showFiles')"
              :disabled="item.deletedAt"
              prepend-icon="mdi-file-tree"
              @click="filesRef?.open(item)"
            />
            <v-list-item
              v-if="historyRef"
              :title="$t('tasks.history')"
              :disabled="item.deletedAt"
              prepend-icon="mdi-history"
              @click="historyRef?.open(item)"
            />
            <v-list-item
              v-if="clipboard"
              :title="$t('sushi.copyId')"
              :disabled="item.deletedAt"
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
          :title="$t('institutions.sushi.archiveSwitch')"
          :disabled="!canEdit"
          prepend-icon="mdi-archive"
          @click="toggleArchiveStates()"
        />

        <v-list-item
          v-if="currentTab === 'archived'"
          :title="$t('delete')"
          :disabled="!canEdit"
          prepend-icon="mdi-delete"
          @click="deleteSushis()"
        />

        <v-divider />

        <v-list-item
          v-if="currentTab === 'active'"
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

    <SushiDeleteConfirmDialog v-if="currentTab === 'archived'" ref="deleteConfirmRef" />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'space',
  middleware: ['sidebase-auth', 'terms'],
  alias: ['/admin/institutions/:id/sushi'],
});

const maxHarvestYear = new Date().getFullYear();

const { params } = useRoute();
const { data: user } = useAuthState();
const { t, locale } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();
const { hasPermission } = useCurrentUserStore();
const { addToCheck } = useSushiCheckQueueStore();
const snacks = useSnacksStore();

const currentTab = ref('');
const selectedSushi = ref([]);
const activeLoadingMap = ref(new Map());
const currentHarvestYear = ref(maxHarvestYear);

const sushiFormRef = useTemplateRef('sushiFormRef');
const harvestMatrixRef = useTemplateRef('harvestMatrixRef');
const reportsRef = useTemplateRef('reportsRef');
const filesRef = useTemplateRef('filesRef');
const historyRef = useTemplateRef('historyRef');
const deleteConfirmRef = useTemplateRef('deleteConfirmRef');

const {
  error,
  data: institution,
  refresh: institutionRefresh,
} = await useFetch(`/api/institutions/${params.id}`);

const {
  data: lockStatus,
} = await useFetch('/api/sushi/_lock');

const {
  data: sushiMetrics,
  refresh: sushiMetricsRefresh,
} = await useFetch(`/api/institutions/${params.id}/sushi/_metrics`, {
  lazy: true,
});

const {
  refresh: sushisRefresh,
  itemLength,
  query,
  data: sushis,
  status,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: `/api/institutions/${params.id}/sushi`,
  },
  data: {
    sortBy: [{ key: 'endpoint.vendor', order: 'asc' }],
    include: ['endpoint', 'harvests', 'deletionTask'],
    archived: computed(() => currentTab.value === 'archived'),
  },
});

/**
 * If sushi edition is locked
 */
const isLocked = computed(() => {
  if (user.value?.isAdmin) {
    return false;
  }
  return lockStatus.value?.locked;
});
/**
 * If user can edit members
 */
const canEdit = computed(() => {
  if (user.value?.isAdmin) {
    return true;
  }
  return !isLocked.value && hasPermission(params.id, 'sushi:write', { throwOnNoMembership: true });
});
/**
 * Tabs
 */
const tabs = computed(() => [
  {
    text: t('sushi.tabs.active.title'),
    description: t('sushi.tabs.active.description'),
    value: 'active',
    icon: 'mdi-key-wireless',
  },
  {
    text: t('sushi.tabs.archived.title'),
    description: t('sushi.tabs.archived.description'),
    value: 'archived',
    icon: 'mdi-archive',
  },
]);
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
    hide: currentTab.value !== 'active',
  },
  {
    title: t('sushi.deletionTask'),
    value: 'deletionTask',
    align: 'center',
    hide: currentTab.value !== 'archived',
  },
  {
    title: t('actions'),
    value: 'actions',
    align: 'center',
  },
].filter((h) => h.hide !== true));
/**
 * Toolbar title
 */
const toolbarTitle = computed(() => {
  let count = `${itemLength.value.current}`;
  if (itemLength.value.current !== itemLength.value.total) {
    count = `${itemLength.value.current}/${itemLength.value.total}`;
  }
  return t('institutions.sushi.title', { count: count ?? '?' });
});
/**
 * Sushi ready formatted date
 */
const sushiReadySince = useDateFormat(() => institution.value?.sushiReadySince, 'P');
/**
 * Sushi ready labels
 */
const sushiReadyLabels = computed(() => {
  if (institution.value?.sushiReadySince) {
    // Is ready
    return {
      status: {
        icon: 'mdi-checkbox-marked-circle-outline',
        color: 'success',
        text: t('institutions.sushi.entryCompletedOn', { date: sushiReadySince.value }),
      },
      button: {
        color: 'secondary',
        text: t('institutions.sushi.resumeMyEntry'),
      },
      confirm: {
        title: t('institutions.sushi.resumeMyEntry'),
        text: t('institutions.sushi.readyPopup.completed', { date: sushiReadySince.value }),
        ok: {
          icon: 'mdi-text-box-edit-outline',
          text: t('institutions.sushi.resumeMyEntry'),
        },
      },
    };
  }
  // Is not ready
  return {
    status: {
      text: t('institutions.sushi.entryInProgress'),
    },
    button: {
      color: 'primary',
      text: t('institutions.sushi.validateMyCredentials'),
    },
    confirm: {
      title: t('institutions.sushi.validateMyCredentials'),
      text: t('institutions.sushi.readyPopup.inProgress'),
      ok: {
        icon: 'mdi-text-box-check-outline',
        text: t('institutions.sushi.validateMyCredentials'),
      },
    },
  };
});

/**
 * Refresh sushis
 */
const refresh = () => Promise.all([sushisRefresh(), sushiMetricsRefresh()]);

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
 * Toggle sushi ready status
 */
async function toggleSushiReady() {
  if (!institution.value) {
    return Promise.reject();
  }

  const value = institution.value.sushiReadySince ? null : new Date();
  try {
    await $fetch(`/api/institutions/${institution.value.id}/sushiReadySince`, {
      method: 'PUT',
      body: { value },
    });
    return institutionRefresh();
  } catch (err) {
    snacks.error(t('errors.generic'), err);
  }
  return Promise.resolve();
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
async function toggleArchiveStates(items) {
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
            const archived = !item.archived;
            await $fetch(`/api/sushi/${item.id}`, {
              method: 'PATCH',
              body: { archived },
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
        toReset.map((item) => {
          try {
            return $fetch(`/api/sushi/${item.id}/connection`, { method: 'DELETE' });
          } catch (err) {
            snacks.error(t('institutions.sushi.cannotResetCheck', { id: item.endpoint?.vendor || item.id }), err);
            return Promise.resolve(null);
          }
        }),
      );

      if (!items) {
        selectedSushi.value = [];
      }

      await refresh();
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
