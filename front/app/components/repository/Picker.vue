<template>
  <v-menu
    v-model="isOpen"
    location="start center"
    min-width="300px"
  >
    <template #activator="menu">
      <slot name="activator" v-bind="menu" />
    </template>

    <v-card>
      <v-skeleton-loader v-if="pending" type="list-item-avatar-two-line" />

      <v-card-text
        v-else-if="!hasRepositories && !hasAliases"
      >
        <v-alert
          v-if="errorMessage"
          type="error"
          :text="errorMessage"
        />

        <div v-else class="text-center">
          {{ $t('dashboardCollections.noRepositories') }}
        </div>
      </v-card-text>

      <v-list v-else density="compact" slim :disabled="pending">
        <template v-if="hasRepositories">
          <v-list-subheader>
            {{ $t('repositories.repositories') }}
          </v-list-subheader>

          <v-list-item
            v-for="repository in filteredRepositories"
            :key="repository.pattern"
            :value="repository.pattern"
            :title="repository.pattern"
            prepend-icon="$mdi-database"
            rounded="md"
            @click="selectRepository(repository)"
          >
            <template #subtitle>
              <RepositoryTypeChip :model-value="repository" />
            </template>
          </v-list-item>
        </template>

        <template v-if="hasAliases">
          <v-list-subheader>
            {{ $t('repositoryAliases.aliases') }}
          </v-list-subheader>

          <v-list-item
            v-for="alias in filteredAliases"
            :key="alias.pattern"
            :value="alias.pattern"
            :title="alias.pattern"
            prepend-icon="$mdi-database"
            @click="selectAlias(alias)"
          >
            <template #subtitle>
              <RepositoryTypeChip :model-value="alias.repository" />
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const props = defineProps({
  institutionId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: () => '',
  },
});

const emit = defineEmits({
  'select:repository': (payload) => payload?.pattern,
  'select:alias': (payload) => (payload?.pattern && payload?.repository?.pattern),
});

const { t } = useI18n();

const isOpen = shallowRef(false);

const {
  data: institution,
  pending,
  error,
  refresh,
} = await useFetch(`/api/institutions/${props.institutionId}`, {
  immediate: false,
  query: {
    include: [
      'repositories',
      'repositoryAliases.repository',
    ],
  },
});

whenever(isOpen, () => refresh());

const errorMessage = computed(() => (error ? getErrorMessage(error, t('anErrorOccurred')) : null));

const filteredRepositories = computed(() => {
  const repos = institution.value?.repositories;

  if (!Array.isArray(repos)) { return []; }
  if (!props.type) { return repos; }

  return repos.filter((repo) => repo.type === props.type);
});

const filteredAliases = computed(() => {
  const aliases = institution.value?.repositoryAliases;

  if (!Array.isArray(aliases)) { return []; }
  if (!props.type) { return aliases; }

  return aliases.filter((alias) => alias.repository?.type === props.type);
});

const hasRepositories = computed(() => filteredRepositories.value.length > 0);
const hasAliases = computed(() => filteredAliases.value.length > 0);

function selectRepository(repository) {
  emit('select:repository', repository);
  isOpen.value = false;
}

function selectAlias(alias) {
  emit('select:alias', alias);
  isOpen.value = false;
}
</script>
