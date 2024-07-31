<template>
  <v-card :title="$t('repositories.repositories')" prepend-icon="mdi-database">
    <template v-if="showInstitution" #subtitle>
      {{ institution.name }}
    </template>

    <template #append>
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
      <div v-if="repositories.length <= 0" class="text-center text-grey pt-5">
        {{ $t('repositories.noRepository') }}
      </div>

      <v-list v-else>
        <v-list-item
          v-for="repository in sortedRepositories"
          :key="repository.pattern"
          :title="repository.pattern"
        >
          <template #subtitle>
            <v-chip
              :text="repository.type"
              :color="repoColors.get(repository.type)"
              size="x-small"
              density="comfortable"
            />
          </template>

          <template #append>
            <ConfirmPopover
              :text="$t('areYouSure')"
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
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>

    <RepositoryFormDialog
      ref="repositoryFormDialogRef"
      completion
      @update:model-value="onRepositoryAdded($event)"
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

/** @type {Ref<object[]>} */
const repositories = ref(props.institution.repositories || []);

/** @type {Ref<object | null>} Vue ref of the repository form */
const repositoryFormDialogRef = ref(null);

const sortedRepositories = computed(
  () => repositories.value.toSorted((a, b) => a.pattern.localeCompare(b.pattern)),
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
    snacks.error(t('anErrorOccurred'));
  }
}
</script>
