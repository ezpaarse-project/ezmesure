<template>
  <v-menu
    v-model="isOpen"
    :close-on-content-click="false"
    width="500"
  >
    <template #activator="menu">
      <slot name="activator" v-bind="menu" />
    </template>

    <v-card
      :title="props.title"
      :subtitle="props.subtitle"
      :loading="status === 'pending' && 'primary'"
      prepend-icon="$mdi-folder-plus"
      min-height="250"
    >
      <template #append>
        <v-btn variant="text" icon="$mdi-close" @click="isOpen = false" />
      </template>

      <template #text>
        <v-text-field
          v-model="search"
          :label="$t('search')"
          prepend-inner-icon="$mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          autofocus
        />

        <v-empty-state
          v-if="!spaces || spaces.length <= 0"
          icon="$mdi-magnify"
          :title="$t('spaces.search.empty')"
        />

        <v-list
          v-else
          class="px-0"
          density="compact"
        >
          <v-list-item
            v-for="space in spaces"
            :key="space.id"
            :title="space.name"
            :subtitle="space.description"
            :disabled="selectedSpaces.has(space.id)"
            class="rounded bg-surface-light border-thin mt-2"
            :style="{ borderColor: repoColors.get(space.type), borderWidth: '1px' }"
            lines="two"
          >
            <template #subtitle>
              <SpaceSubtitle :model-value="space" />
            </template>

            <template v-if="!selectedSpaces.has(space.id)" #append>
              <RepositoryPicker
                :institution-id="space.institutionId"
                :type="space.type"
                @select:repository="addSpace(space, { repository: $event })"
                @select:alias="addSpace(space, { alias: $event })"
              >
                <template #activator="{ props: menuProps }">
                  <v-btn
                    :loading="props.loadingItems.has(space.id)"
                    icon="$mdi-folder-plus"
                    color="primary"
                    variant="tonal"
                    size="small"
                    v-bind="menuProps"
                  />
                </template>
              </RepositoryPicker>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </v-card>
  </v-menu>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const props = defineProps({
  title: {
    type: String,
    default: undefined,
  },
  subtitle: {
    type: String,
    default: undefined,
  },
  loadingItems: {
    type: Set,
    default: () => new Set(),
  },
});

const affectedSpaces = defineModel({ type: Array, default: () => [] });

const snacks = useSnacksStore();
const { t } = useI18n();

const emit = defineEmits({
  'add-space': (payload) => (
    payload?.space?.id && (payload?.repositoryPattern ?? payload?.aliasPattern)
  ),
});

const isOpen = defineModel('open', { type: Boolean, default: false });

const search = shallowRef('');
const debouncedSearch = refDebounced(search, 250);

const selectedSpaces = computed(() => new Set(affectedSpaces.value.map((i) => i.id)));

const {
  data: spaces,
  status,
  refresh,
  clear,
} = await useFetch('/api/kibana-spaces', {
  enabled: isOpen,
  query: {
    q: debouncedSearch,
  },
  onResponseError({ response }) {
    const { _data: data } = response;
    snacks.error(getErrorMessage({ data }, t('anErrorOccurred')));
  },
  lazy: true,
});

watch(isOpen, (isVisible) => {
  if (isVisible) {
    refresh();
  } else {
    clear();
  }
});

/**
 * @param {object} space - The space to add
 * @param {object} repoOptions - The repository options
 * @param {string} [repoOptions.repository] - The repository to use
 * @param {string} [repoOptions.alias] - The alias to use
 */
function addSpace(space, { repository, alias }) {
  emit('add-space', {
    space,
    repositoryPattern: repository?.pattern,
    aliasPattern: alias?.pattern,
  });
}
</script>
