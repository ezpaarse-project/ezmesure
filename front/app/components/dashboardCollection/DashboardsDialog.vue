<template>
  <v-dialog
    v-model="show"
    :width="initialLoading ? 200 : 800"
    scrollable
  >
    <LoaderCard v-if="initialLoading" />

    <v-card v-else-if="errorMessage">
      <v-empty-state
        :icon="errorIcon"
        :title="errorMessage"
      >
        <template #actions>
          <v-btn
            :text="$t('close')"
            variant="text"
            @click="show = false"
          />

          <v-btn
            :text="$t('retry')"
            :loading="loading"
            variant="elevated"
            color="secondary"
            @click="refresh"
          />
        </template>
      </v-empty-state>
    </v-card>

    <v-card
      v-else
      :title="title"
      :subtitle="subtitle"
      :loading="loading"
    >
      <template #append>
        <DashboardAddMenu
          v-model:open="addMenuOpened"
          :model-value="dashboards"
          :title="$t('dashboardCollections.addADashboard')"
          :loading-items="loadingDashboards"
          @add-dashboard="addDashboard($event)"
          @update:model-value="refresh()"
        >
          <template #activator="{ props: menu }">
            <v-btn
              v-tooltip="$t('add')"
              icon="$mdi-plus"
              variant="text"
              color="success"
              density="comfortable"
              v-bind="menu"
            />
          </template>
        </DashboardAddMenu>
      </template>

      <v-empty-state
        v-if="!hasDashboards"
        :title="$t('dashboardCollections.dashboardsDialog.empty.title')"
        :text="$t('dashboardCollections.dashboardsDialog.empty.text')"
      >
        <template #actions>
          <v-btn
            :text="$t('dashboardCollections.dashboardsDialog.empty.action')"
            size="small"
            variant="tonal"
            prepend-icon="$mdi-view-grid-plus"
            @click="addMenuOpened = true"
          />
        </template>
      </v-empty-state>

      <v-list v-else class="px-2 pt-0">
        <v-list-item
          v-for="dashboard in dashboards"
          :key="dashboard.id"
          :title="dashboard.name"
          :subtitle="dashboard.description"
          class="mt-2 rounded bg-surface-light"
          lines="two"
        >
          <template #title>
            <div>
              {{ dashboard.name }}
            </div>
            <div class="d-flex flex-wrap ga-1 py-1">
              <v-chip
                v-for="tag in dashboard.tags"
                :key="tag.id"
                v-tooltip:top="tag.attributes.description"
                :text="tag.attributes.name"
                :color="tag.attributes.color"
                variant="flat"
                size="x-small"
                label
              />
            </div>
          </template>

          <template #append>
            <v-btn
              v-tooltip="$t('delete')"
              color="red"
              density="comfortable"
              icon="$mdi-delete"
              size="small"
              variant="text"
              :loading="loadingDashboards.has(dashboard.id)"
              @click="removeDashboard(dashboard)"
            />
          </template>
        </v-list-item>
      </v-list>

      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="show = false"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: undefined,
  },
  subtitle: {
    type: String,
    default: undefined,
  },
});

const show = defineModel({ type: Boolean, default: false });

const addMenuOpened = shallowRef(false);

const snacks = useSnacksStore();
const { t } = useI18n();

const {
  data: collectionData,
  error,
  refresh,
  pending: loading,
} = await useFetch(computed(() => `/api/dashboard-collections/${props.collectionId}`), {
  query: { include: ['dashboards'] },
  lazy: true,
  dedupe: 'defer',
});

const dashboards = computed(() => collectionData.value?.dashboards ?? []);
const hasDashboards = computed(() => dashboards.value.length > 0);

const title = computed(() => props.title ?? t('dashboards.toolbarTitle', dashboards.value.length));
const subtitle = computed(() => props.subtitle ?? collectionData.value.name);

const errorMessage = computed(() => (error.value ? getErrorMessage(error.value) : undefined));
const errorIcon = computed(() => (error?.value?.status === 404 ? '$mdi-ghost-outline' : '$mdi-alert-circle'));

const initialLoading = shallowRef(true);
whenever(() => loading.value === false, () => {
  initialLoading.value = false;
});

whenever(show, () => {
  initialLoading.value = true;
  refresh();
});

const loadingDashboards = ref(new Set());

async function addDashboard(dashboard) {
  if (!dashboard?.id || loadingDashboards.value.has(dashboard.id)) {
    return;
  }

  loadingDashboards.value.add(dashboard.id);

  try {
    await $fetch(`/api/dashboard-templates/${dashboard.id}`, {
      method: 'PATCH',
      body: { collectionId: props.collectionId },
    });
    refresh();
  } catch (err) {
    snacks.error(getErrorMessage(err, t('anErrorOccurred')));
  }

  loadingDashboards.value.delete(dashboard.id);
}

async function removeDashboard(dashboard) {
  if (!dashboard?.id || loadingDashboards.value.has(dashboard.id)) {
    return;
  }

  loadingDashboards.value.add(dashboard.id);

  try {
    await $fetch(`/api/dashboard-templates/${dashboard.id}`, {
      method: 'PATCH',
      body: { collectionId: null },
    });
    refresh();
  } catch (err) {
    snacks.error(getErrorMessage(err, t('anErrorOccurred')));
  }

  loadingDashboards.value.delete(dashboard.id);
}

</script>
