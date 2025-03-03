<template>
  <v-card
    :title="$t('repositoryAliases.aliases')"
    :subtitle="showInstitution ? institution.name : undefined"
    prepend-icon="mdi-database-eye"
  >
    <template #append>
      <v-btn
        v-if="aliasFormDialogRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="text"
        density="comfortable"
        color="green"
        @click="aliasFormDialogRef.open({ institution })"
      />
    </template>

    <template #text>
      <div v-if="aliases.length <= 0" class="text-center text-grey pt-5">
        {{ $t('repositoryAliases.noAliases') }}
      </div>

      <v-list v-else density="compact">
        <v-list-item
          v-for="alias in sortedAliases"
          :key="alias.pattern"
          lines="two"
        >
          <template #title>
            {{ alias.pattern }}

            <v-icon v-if="!!alias.filters" icon="mdi-filter" size="small" start />
          </template>

          <template v-if="alias.repository" #subtitle>
            {{ alias.repository.pattern }}

            <RepositoryTypeChip :model-value="alias.repository" />
          </template>

          <template v-if="user.isAdmin" #append>
            <v-btn
              v-if="filtersFormDialogRef"
              v-tooltip="$t('repositoryAliases.filtersForm.editFilter')"
              icon="mdi-filter"
              variant="text"
              size="small"
              density="comfortable"
              color="blue"
              @click="openFiltersDialog(alias)"
            />

            <ConfirmPopover
              :agree-text="$t('delete')"
              :agree="() => removeAlias(alias)"
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
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>

    <RepositoryAliasFormDialog
      v-if="user.isAdmin"
      ref="aliasFormDialogRef"
      completion
      @submit="onAliasAdded($event)"
    />

    <FiltersFormDialog
      v-if="user.isAdmin"
      ref="filtersFormDialogRef"
      :title="$t('repositoryAliases.filtersForm.title')"
      @submit="onAliasUpdate($event)"
    >
      <template v-if="updatedAlias" #subtitle>
        <span class="mr-2">
          {{ updatedAlias.pattern }}
        </span>

        <RepositoryTypeChip :model-value="updatedAlias.repository" />
      </template>
    </FiltersFormDialog>
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
});

const emit = defineEmits({
  'update:modelValue': (items) => !!items,
});

const { data: user } = useAuthState();
const { t } = useI18n();
const snacks = useSnacksStore();

/** @type {Ref<object[]>} */
const aliases = ref(props.institution.repositoryAliases || []);
/** @type {Ref<object|undefined>} */
const updatedAlias = ref();

const aliasFormDialogRef = useTemplateRef('aliasFormDialogRef');
const filtersFormDialogRef = useTemplateRef('filtersFormDialogRef');

const sortedAliases = computed(
  () => aliases.value.toSorted((a, b) => a.pattern.localeCompare(b.pattern)),
);

function openFiltersDialog(alias) {
  updatedAlias.value = alias;
  filtersFormDialogRef.value?.open(alias.filters);
}

function onAliasAdded(item) {
  aliases.value.push(item);
  emit('update:modelValue', aliases.value);
}

async function removeAlias(item) {
  try {
    await $fetch(`/api/institutions/${props.institution.id}/repository-aliases/${item.pattern}`, {
      method: 'DELETE',
    });

    aliases.value = aliases.value.filter((i) => i.pattern !== item.pattern);

    emit('update:modelValue', aliases.value);
  } catch {
    snacks.error(t('anErrorOccurred'));
  }
}

async function onAliasUpdate(filters) {
  try {
    await $fetch(`/api/repository-aliases/${updatedAlias.value.pattern}`, {
      method: 'PUT',
      body: {
        target: updatedAlias.value.target,
        filters,
      },
    });

    const index = aliases.value.findIndex((i) => i.pattern === updatedAlias.value.pattern);
    if (index >= 0) {
      aliases.value[index].filters = filters;
    }

    emit('update:modelValue', aliases.value);
  } catch {
    snacks.error(t('anErrorOccurred'));
  }
}
</script>
