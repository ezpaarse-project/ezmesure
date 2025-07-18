<template>
  <v-card
    :loading="loading && 'primary'"
    :title="$t('repositories.newRepository')"
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
              <v-col v-if="completion" cols="12">
                <RepositoryAutoComplete
                  :model-value="repository"
                  @update:model-value="applyRepository($event)"
                />
              </v-col>

              <v-col v-else cols="12">
                <v-text-field
                  v-model="repository.pattern"
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
                <v-select
                  v-model="repository.type"
                  :label="`${$t('repositories.type')} *`"
                  :items="types"
                  :rules="[
                    v => !!v || $t('fieldIsRequired'),
                  ]"
                  prepend-icon="mdi-tag"
                  variant="underlined"
                  hide-details="auto"
                  required
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
        :text="repository.exist && institution ? $t('add') : $t('create')"
        :prepend-icon="repository.exist && institution ? 'mdi-plus' : 'mdi-content-save'"
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
const repository = ref({});
const permissions = ref(new Map());

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

const types = computed(() => {
  const keys = Array.from(repoColors.keys());
  return keys.map((type) => ({
    value: type,
    title: t(`spaces.types.${type}`),
  }));
});

function applyRepository(item) {
  if (!item || typeof item === 'string') {
    repository.value.pattern = item;
    repository.value.exist = undefined;
  } else {
    repository.value = { ...item, exist: true };
    formRef.value?.validate();
  }
}

function create() {
  return $fetch('/api/repositories', {
    method: 'POST',
    body: {
      pattern: repository.value.pattern,
      type: repository.value.type,
    },
  });
}

async function link() {
  const repo = await $fetch(`/api/institutions/${props.institution.id}/repositories/${repository.value.pattern}`, {
    method: 'PUT',
    body: {
      type: repository.value.type,
    },
  });

  await $fetch(`/api/institutions/${props.institution.id}/repositories/${repository.value.pattern}/permissions`, {
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
    let newRepository;
    if (props.institution?.id) {
      newRepository = await link();
    } else {
      newRepository = await create();
    }

    emit('submit', newRepository);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  loading.value = false;
}

onMounted(() => {
  formRef.value?.validate();
});
</script>
