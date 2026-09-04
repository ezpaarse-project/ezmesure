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
        <DashboardCollectionAddMenu
          v-model:open="addMenuOpened"
          :model-value="collections"
          :title="$t('dashboards.addCollection')"
          :dashboard-id="spaceId"
          :loading-items="loadingCollections"
          :repository-patterns="repositoryPatterns"
          @add-collection="addCollection($event)"
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
        </DashboardCollectionAddMenu>
      </template>

      <v-empty-state
        v-if="!hasCollections"
        :title="$t('spaces.collectionsDialog.empty.title')"
        :text="$t('spaces.collectionsDialog.empty.text')"
      >
        <template #actions>
          <v-btn
            :text="$t('spaces.collectionsDialog.empty.action')"
            size="small"
            variant="tonal"
            prepend-icon="$mdi-folder-plus"
            @click="addMenuOpened = true"
          />
        </template>
      </v-empty-state>

      <v-list v-else class="px-2 pt-0">
        <v-list-item
          v-for="spaceCol in spaceData.dashboardCollections ?? []"
          :key="spaceCol.collection.id"
          :title="spaceCol.collection.name"
          :subtitle="spaceCol.collection.description"
          class="mt-2 rounded bg-surface-light"
          lines="two"
        >
          <template #title>
            <div class="d-flex align-center ga-2">
              {{ spaceCol.collection.name }}
              <v-chip
                :text="spaceCol.repositoryPattern"
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
              :loading="loadingCollections.has(spaceCol.collection.id)"
              @click="removeCollection(spaceCol)"
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
  spaceId: {
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
  data: spaceData,
  status,
  error,
  refresh,
} = await useFetch(computed(() => `/api/kibana-spaces/${props.spaceId}`), {
  query: { include: ['dashboardCollections.collection', 'institution.repositories'] },
  lazy: true,
  dedupe: 'defer',
});

const repositoryPatterns = computed(() => (
  spaceData.value.institution?.repositories?.map((repository) => repository.pattern)
));

const collections = computed(
  () => spaceData.value?.dashboardCollections?.map((c) => c.collection) ?? [],
);

const hasCollections = computed(() => collections.value.length > 0);

const title = computed(() => props.title ?? t('dashboardCollections.toolbarTitle', collections.value.length));
const subtitle = computed(() => props.subtitle ?? spaceData.value.name);

const loading = computed(() => status.value === 'pending');
const errorMessage = computed(() => (error.value ? getErrorMessage(error.value) : undefined));
const errorIcon = computed(() => (error?.value?.statusCode === 404 ? '$mdi-ghost-outline' : '$mdi-alert-circle'));

const initialLoading = shallowRef(true);
whenever(() => loading.value === false, () => {
  initialLoading.value = false;
});

whenever(() => show.value, () => {
  initialLoading.value = true;
  refresh();
});

const loadingCollections = ref(new Set());

async function addCollection({ collection, pattern }) {
  if (!collection?.id || loadingCollections.value.has(collection.id)) {
    return;
  }

  loadingCollections.value.add(collection.id);

  try {
    await $fetch(`/api/dashboard-collections/${collection.id}/spaces/${props.spaceId}`, {
      method: 'PUT',
      body: {
        repositoryPattern: pattern,
      },
    });

    refresh();
  } catch (err) {
    snacks.error(t('dashboards.cannotAddToCollection'), err);
  }

  loadingCollections.value.delete(collection.id);
}

async function removeCollection(spaceCollection) {
  const collectionId = spaceCollection?.collection?.id;
  const repositoryPattern = spaceCollection?.repositoryPattern;

  if (!collectionId || loadingCollections.value.has(collectionId)) {
    return;
  }

  loadingCollections.value.add(collectionId);

  try {
    await $fetch(`/api/dashboard-collections/${collectionId}/spaces/${props.spaceId}`, {
      method: 'DELETE',
      body: {
        repositoryPattern,
      },
    });

    refresh();
  } catch (e) {
    snacks.error(t('dashboards.cannotRemoveFromCollection'), e);
  }

  loadingCollections.value.delete(collectionId);
}

</script>
