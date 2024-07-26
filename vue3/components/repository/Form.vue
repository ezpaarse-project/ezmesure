<template>
  <v-card
    :loading="loading"
    :title="$t('repositories.newRepository')"
    prepend-icon="mdi-database"
  >
    <template #text>
      <v-form
        id="repositoryForm"
        ref="formRef"
        v-model="valid"
        @submit.prevent="save()"
      >
        <v-row>
          <v-col v-if="withCompletion" cols="12">
            <v-combobox
              :value="repository.pattern"
              :label="`${$t('repositories.pattern')} *`"
              :items="availableRepositories"
              :rules="[
                () => !!repository.pattern || $t('fieldIsRequired'),
                () => /^[a-z0-9*_-]+$/i.test(repository.pattern) || $t('invalidFormat'),
              ]"
              :error="!!error"
              :error-messages="error?.message"
              no-filter
              item-title="pattern"
              prepend-icon="mdi-form-textbox"
              variant="underlined"
              hide-details="auto"
              required
              return-object
              @update:model-value="applyRepository($event)"
              @update:search="refresh()"
            >
              <template #item="{ item: { raw: item }, props: listItem }">
                <v-list-item
                  :title="item.pattern"
                  lines="two"
                  v-bind="listItem"
                >
                  <template #subtitle>
                    <v-chip
                      :text="item.type"
                      :color="repoColors.get(item.type)"
                      size="x-small"
                      density="comfortable"
                      class="ml-2"
                    />
                  </template>
                </v-list-item>
              </template>
            </v-combobox>
          </v-col>

          <v-col v-else cols="12">
            <v-text-field
              v-model="repository.pattern"
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
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="repository.exist && institutionId ? $t('add') : $t('create')"
        :prepend-icon="repository.exist && institutionId ? 'mdi-plus' : 'mdi-content-save'"
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
import { debounce } from 'lodash';

const props = defineProps({
  completion: {
    type: Boolean,
    default: false,
  },
  institutionId: {
    type: String,
    default: () => undefined,
  },
});

const emit = defineEmits({
  'update:modelValue': (item) => !!item,
});

const types = Array.from(repoColors.keys());

const { t } = useI18n();
const snacks = useSnacksStore();

const withCompletion = ref(false);
const loading = ref(false);
const valid = ref(false);
const repository = ref({});
const permissions = ref(new Map());

/** @type {Ref<Object | null>} */
const formRef = ref(null);

// Fetching repositories only if completion is enabled
// Note: Not using top-level await because `defineExpose`
//       shouldn't be used after a `await` keyword
/** @type {Ref<Error | null>} */
let error = ref(null);
let availableRepositories = ref([]);
let refresh = () => {};
if (props.completion) {
  (async () => {
    const ctx = await useAsyncData(
      '/api/repositories',
      () => $fetch('/api/repositories', {
        query: {
          q: repository.value?.pattern,
          sort: 'pattern',
        },
      }),
    );

    refresh = debounce(() => ctx.refresh(), 250);
    availableRepositories = ctx.data || [];
    error = ctx.error;
  })();
}

function init(opts) {
  repository.value = {};

  withCompletion.value = !!opts?.withCompletion;

  if (formRef.value) {
    formRef.value?.validate();
  }
}

function applyRepository(item) {
  if (!item) {
    return;
  }

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
  const repo = await $fetch(`/api/institutions/${props.institutionId}/repositories/${repository.value.pattern}`, {
    body: {
      type: repository.value.type,
    },
  });

  await $fetch(`/api/institutions/${props.institutionId}/repositories/${repository.value.pattern}/permissions`, {
    body: Array.from(permissions.value.entries()).map(([username, permission]) => ({
      username,
      ...permission,
    })),
  });

  return repo;
}

async function save() {
  loading.value = true;

  try {
    let newRepository;
    if (props.institutionId) {
      newRepository = await link();
    } else {
      newRepository = await create();
    }

    emit('update:modelValue', newRepository);
  } catch (err) {
    snacks.error(t('anErrorOccurred'));
  }

  loading.value = false;
}

defineExpose({
  init,
});
</script>
