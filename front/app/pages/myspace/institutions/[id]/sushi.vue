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

      <v-row class="mt-4">
        <v-col>
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
        </v-col>

        <v-col class="text-end">
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
        </v-col>
      </v-row>
    </v-container>

    <v-divider />

    <div class="mb-2">
      <v-tabs
        v-model="currentTabId"
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

            <component
              :is="TABS_COMPONENTS[item.value]"
              v-if="TABS_COMPONENTS[item.value]"
              :institution="institution"
              :is-locked="lockStatus?.locked"
              :can-edit="canEdit"
              :define-tab="(tab) => { tabsData.set(item.value, tab); }"
            />
          </v-tabs-window-item>
        </template>
      </v-tabs>
    </div>

    <SushiFormDialog
      ref="sushiFormRef"
      @submit="refresh()"
      @update:model-value="refresh()"
    />
  </div>
</template>

<script setup>
import ActiveTable from '@/components/sushi/credentials/ActiveTable.vue';
import ArchivedTable from '@/components/sushi/credentials/ArchivedTable.vue';

definePageMeta({
  layout: 'space',
  middleware: ['sidebase-auth', 'terms'],
  alias: ['/admin/institutions/:id/sushi'],
});

const TABS_COMPONENTS = {
  active: ActiveTable,
  archived: ArchivedTable,
};

const { params } = useRoute();
const { t } = useI18n();
const { data: user } = useAuthState();
const { hasPermission } = useCurrentUserStore();
const snacks = useSnacksStore();

const tabsData = ref(new Map());
const currentTabId = shallowRef('');

const sushiFormRef = useTemplateRef('sushiFormRef');

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
 * Current tab
 */
const currentTabData = computed(() => tabsData.value.get(currentTabId.value));
/**
 * Current query
 */
const query = computed({
  get: () => currentTabData.value?.query ?? {},
  set: (value) => {
    if (!currentTabData.value) {
      return;
    }
    currentTabData.value.query = value;
  },
});
/**
 * Toolbar title
 */
const toolbarTitle = computed(() => {
  const itemLength = currentTabData.value?.itemLength ?? {};

  let count = itemLength.current != null ? `${itemLength.current}` : null;
  if (itemLength.current !== itemLength.total) {
    count = `${itemLength.current}/${itemLength.total}`;
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
const refresh = () => Promise.all([currentTabData.value?.refresh?.(), sushiMetricsRefresh()]);

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

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
</script>
