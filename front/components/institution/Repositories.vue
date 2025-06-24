<template>
  <v-card
    :title="$t('repositories.repositories')"
    :subtitle="showInstitution ? institution.name : undefined"
    prepend-icon="mdi-database"
  >
    <template v-if="!userSpaced" #append>
      <v-btn
        v-if="repositoryFormDialogRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="text"
        density="comfortable"
        color="green"
        @click="repositoryFormDialogRef.open({ institution })"
      />
    </template>

    <template #text>
      <div v-if="repositoryCount <= 0" class="text-center text-grey pt-5">
        {{ $t('repositories.noRepository') }}
      </div>

      <template v-else>
        <v-list v-if="sortedRepositories.length > 0" density="compact">
          <v-list-subheader v-if="sortedForeignRepositories.length > 0">
            <v-icon icon="mdi-database" start />
            {{ $t('repositories.ownedRepositories') }}
          </v-list-subheader>

          <v-list-item
            v-for="repository in sortedRepositories"
            :key="repository.pattern"
            :title="repository.pattern"
            lines="two"
          >
            <template #subtitle>
              <RepositoryTypeChip :model-value="repository" />
            </template>

            <template v-if="!userSpaced" #append>
              <ConfirmPopover
                v-if="user.isAdmin"
                :agree-text="$t('delete')"
                :agree="() => removeRepository(repository)"
                location="end"
              >
                <template #activator="{ props: confirm }">
                  <v-btn
                    v-tooltip="$t('delete')"
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    density="comfortable"
                    color="red"
                    v-bind="confirm"
                  />
                </template>
              </ConfirmPopover>
            </template>
          </v-list-item>
        </v-list>

        <v-divider v-if="sortedRepositories.length > 0 && sortedForeignRepositories.length > 0" />

        <v-list v-if="sortedForeignRepositories.length > 0" density="compact">
          <v-list-subheader>
            <v-icon icon="mdi-database-plus" start />
            {{ $t('repositories.foreignRepositories') }}
          </v-list-subheader>

          <v-list-item
            v-for="repository in sortedForeignRepositories"
            :key="repository.pattern"
            :title="repository.pattern"
            lines="two"
          >
            <template #subtitle>
              <RepositoryTypeChip :model-value="repository" />
            </template>

            <template v-if="!userSpaced" #append>
              <v-chip
                v-tooltip:left="$t('elasticRoles.grantedBy')"
                :text="repository.elasticRole.name"
                append-icon="mdi-account-tag"
                color="secondary"
                variant="outlined"
                size="small"
                label
              />
            </template>
          </v-list-item>
        </v-list>
      </template>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>

    <RepositoryFormDialog
      v-if="user.isAdmin"
      ref="repositoryFormDialogRef"
      completion
      @submit="onRepositoryAdded($event)"
    />
  </v-card>
</template>

<script setup>
const props = defineProps({
  institution: {
    type: Object,
    required: true,
  },
  showInstitution: {
    type: Boolean,
    default: false,
  },
  userSpaced: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  'update:modelValue': (items) => !!items,
});

const { data: user } = useAuthState();

/** @type {Ref<object[]>} */
const repositories = ref(props.institution.repositories || []);
/** @type {Ref<object[]>} */
const elasticRoles = ref(props.institution.elasticRoles || []);

const repositoryFormDialogRef = useTemplateRef('repositoryFormDialogRef');

const sortedRepositories = computed(
  () => repositories.value.toSorted((a, b) => a.pattern.localeCompare(b.pattern)),
);

const sortedForeignRepositories = computed(() => {
  const data = elasticRoles.value.flatMap(
    (r) => r.repositoryPermissions.map(
      (p) => ({ ...p.repository, elasticRole: r }),
    ),
  );
  return data.toSorted((a, b) => a.pattern.localeCompare(b.pattern));
});

const repositoryCount = computed(
  () => sortedRepositories.value.length + sortedForeignRepositories.value.length,
);

function onRepositoryAdded(item) {
  repositories.value.push(item);
  emit('update:modelValue', repositories.value);
}

async function removeRepository(item) {
  try {
    await $fetch(`/api/institutions/${props.institution.id}/repositories/${item.pattern}`, {
      method: 'DELETE',
    });

    repositories.value = repositories.value.filter((i) => i.pattern !== item.pattern);

    emit('update:modelValue', repositories.value);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
}
</script>
