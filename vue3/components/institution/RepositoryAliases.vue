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
            <v-icon v-if="!!alias.filters" icon="mdi-filter" size="small" start />

            {{ alias.pattern }}
          </template>

          <template v-if="alias.repository" #subtitle>
            {{ alias.repository.pattern }}

            <v-chip
              :text="$te(`spaces.types.${alias.repository.type}`) ? $t(`spaces.types.${alias.repository.type}`) : alias.repository.type"
              :color="repoColors.get(alias.repository.type)"
              size="x-small"
              density="comfortable"
            />
          </template>

          <template v-if="user.isAdmin" #append>
            <ConfirmPopover
              :agree-text="$t('delete')"
              :agree="() => removeRepository(alias)"
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
});

const emit = defineEmits({
  'update:modelValue': (items) => !!items,
});

const { data: user } = useAuthState();

/** @type {Ref<object[]>} */
const aliases = ref(props.institution.repositoryAliases || []);

const aliasFormDialogRef = useTemplateRef('aliasFormDialogRef');

const sortedAliases = computed(
  () => aliases.value.toSorted((a, b) => a.pattern.localeCompare(b.pattern)),
);

function onRepositoryAdded(item) {
  aliases.value.push(item);
  emit('update:modelValue', aliases.value);
}

async function removeRepository(item) {
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
</script>
