<template>
  <v-card
    :loading="loading && 'primary'"
    :title="$t('repositoryAliases.newAlias')"
    prepend-icon="mdi-database-plus"
  >
    <template #text>
      <v-row>
        <v-col>
          <v-form
            id="repositoryForm"
            ref="formRef"
            v-model="valid"
            @submit.prevent="save()"
          >
            <v-row>
              <!-- TODO: completion -->
              <v-col cols="12">
                <v-text-field
                  v-model="alias.pattern"
                  :placeholder="institution?.namespace"
                  :label="`${$t('repositories.pattern')} *`"
                  :rules="[
                    v => !!v || $t('fieldIsRequired'),
                    v => /^[a-z0-9*_-]+$/i.test(v) || $t('invalidFormat'),
                  ]"
                  prepend-icon="mdi-form-textbox"
                  variant="underlined"
                  hide-details="auto"
                  required
                />
              </v-col>

              <v-col cols="12">
                <RepositoryAutoComplete
                  :label="`${$t('repositoryAliases.target')} *`"
                  prepend-icon="mdi-database"
                  :model-value="repository"
                  @update:model-value="applyRepository($event)"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-col>
      </v-row>

      <v-row v-if="institution">
        <v-col>
          <PermissionManager v-model="permissions" :institution="institution" />
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="alias.exist && institution ? $t('add') : $t('create')"
        :prepend-icon="alias.exist && institution ? 'mdi-plus' : 'mdi-content-save'"
        :disabled="!valid"
        :loading="loading"
        type="submit"
        form="repositoryForm"
        variant="elevated"
        color="primary"
      />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  completion: {
    type: Boolean,
    default: false,
  },
  institution: {
    type: Object,
    default: () => undefined,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const loading = ref(false);
const valid = ref(false);
const alias = ref({});
const repository = ref({});
const permissions = ref(new Map());

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

function applyRepository(item) {
  if (!item) {
    return;
  }

  if (!item || typeof item === 'string') {
    repository.value.pattern = item;
  } else {
    repository.value = item;
    formRef.value?.validate();
  }
}

function create() {
  return $fetch('/api/repository-aliases', {
    method: 'POST',
    body: {
      pattern: alias.value.pattern,
      target: repository.value.pattern,
      filters: alias.value.filters,
    },
  });
}

async function link() {
  const repo = await $fetch(`/api/institutions/${props.institution.id}/repository-aliases/${alias.value.pattern}`, {
    method: 'PUT',
    body: {
      target: repository.value.pattern,
      filters: alias.value.filters,
    },
  });

  await $fetch(`/api/institutions/${props.institution.id}/repository-aliases/${alias.value.pattern}/permissions`, {
    method: 'PUT',
    body: Array.from(permissions.value.entries()).map(([username, permission]) => ({
      username,
      readonly: permission === 'read',
      locked: false,
    })),
  });

  return repo;
}

async function save() {
  loading.value = true;

  try {
    let newAlias;
    if (props.institution?.id) {
      newAlias = await link();
    } else {
      newAlias = await create();
    }

    emit('submit', newAlias);
  } catch {
    snacks.error(t('anErrorOccurred'));
  }

  loading.value = false;
}

onMounted(() => {
  formRef.value?.validate();
});
</script>
