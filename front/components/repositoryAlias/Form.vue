<template>
  <v-card
    :loading="loading && 'primary'"
    :title="$t('repositoryAliases.newAlias')"
    prepend-icon="mdi-eye-plus"
  >
    <template #text>
      <v-row>
        <v-col>
          <v-form
            id="aliasForm"
            ref="formRef"
            v-model="valid"
            @submit.prevent="save()"
          >
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="alias.pattern"
                  :label="`${$t('repositoryAliases.alias')} *`"
                  :rules="[
                    v => !!v || $t('fieldIsRequired'),
                    v => /^[a-z0-9_-]+$/i.test(v) || $t('invalidFormat'),
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

            <v-row>
              <v-col>
                <FiltersForm
                  v-model="alias.filters"
                  :title="$t('repositoryAliases.filtersForm.title')"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-col>

        <v-col v-if="institution" cols="12" lg="7">
          <PermissionManager v-model="permissions" :institution="institution" :levels="['none', 'read']" />
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
        form="aliasForm"
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
  const newAlias = await $fetch(`/api/institutions/${props.institution.id}/repository-aliases/${alias.value.pattern}`, {
    method: 'PUT',
    body: {
      target: repository.value.pattern,
      filters: alias.value.filters,
    },
  });

  await $fetch(`/api/institutions/${props.institution.id}/repository-aliases/${alias.value.pattern}/permissions`, {
    method: 'PUT',
    body: Array.from(permissions.value.keys()).map((username) => ({
      username,
      locked: false,
    })),
  });

  return newAlias;
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
