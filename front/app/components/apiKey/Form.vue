<template>
  <v-card
    :loading="loading && 'primary'"
    :title="isEditing ? $t('api-keys.editKey') : $t('api-keys.newKey')"
    :prepend-icon="isEditing ? 'mdi-lock-open' : 'mdi-lock-open-plus'"
  >
    <template #text>
      <v-form
        id="apiKeyForm"
        ref="formRef"
        v-model="valid"
        @submit.prevent="save()"
      >
        <v-row v-if="!isEditing && !props.institution && !props.user">
          <v-col>
            <v-card
              :title="$t('general')"
              prepend-icon="mdi-format-list-bulleted"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                A
              </template>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-card
              :title="$t('general')"
              prepend-icon="mdi-format-list-bulleted"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="apiKey.name"
                      :label="$t('name')"
                      :rules="[v => !!v || $t('fieldIsRequired')]"
                      prepend-icon="mdi-rename"
                      variant="underlined"
                      hide-details="auto"
                      required
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="apiKey.description"
                      :label="$t('description')"
                      prepend-icon="mdi-image-text"
                      variant="underlined"
                      hide-details="auto"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-menu v-model="datePickerOpen" :close-on-content-click="false" width="500">
                      <template #activator="{ props: menu }">
                        <v-text-field
                          :model-value="expiresAtFormatted"
                          :label="$t('api-keys.expiresAt')"
                          :hint="!expiresAt ? $t('never') : undefined"
                          prepend-icon="mdi-clock-alert"
                          variant="underlined"
                          hide-details="auto"
                          persistent-hint
                          clearable
                          readonly
                          v-bind="menu"
                          @click:clear.prevent="expiresAt = null"
                        />
                      </template>

                      <v-date-picker
                        v-model="expiresAt"
                        :min="now"
                        @update:model-value="datePickerOpen = false"
                      />
                    </v-menu>
                  </v-col>
                </v-row>
              </template>
            </v-card>
          </v-col>
        </v-row>

        <template v-if="!isEditing">
          <v-row>
            <v-col cols="12">
              <v-card
                :title="$t('institutions.members.institutionManagement')"
                prepend-icon="mdi-office-building"
                variant="outlined"
              >
                <template #text>
                  <v-list>
                    <MembershipPermissionItem
                      v-for="feature in features"
                      :key="feature.scope"
                      v-model="permissions"
                      :feature="feature"
                    />
                  </v-list>
                </template>
              </v-card>
            </v-col>
          </v-row>

          <v-slide-x-transition>
            <v-row v-if="selectedInstitution || selectedUser">
              <v-col cols="12">
                <v-card
                  :title="$t('repositories.repositories')"
                  :loading="repoStatus && 'primary'"
                  prepend-icon="mdi-database"
                  variant="outlined"
                >
                  <template v-if="(repositories?.length ?? 0) > 0" #text>
                    <v-list density="compact">
                      <MembershipRepositoryPermissionItem
                        v-for="repo in repositories"
                        :key="repo.pattern"
                        v-model="repositoryPermissions"
                        :repository="repo"
                      />
                    </v-list>
                  </template>

                  <template v-else-if="repoError" #text>
                    <v-alert :text="repoError" type="error" />
                  </template>

                  <template v-else #text>
                    {{ $t('repositories.noRepository') }}
                  </template>
                </v-card>
              </v-col>

              <v-col cols="12">
                <v-card
                  :title="$t('repositoryAliases.aliases')"
                  :loading="aliasesStatus && 'primary'"
                  prepend-icon="mdi-database-eye"
                  variant="outlined"
                >
                  <template v-if="(repositoryAliases?.length ?? 0) > 0" #text>
                    <v-list density="compact">
                      <MembershipRepositoryAliasPermissionItem
                        v-for="alias in repositoryAliases"
                        :key="alias.pattern"
                        v-model="repositoryAliasPermissions"
                        :alias="alias"
                      />
                    </v-list>
                  </template>

                  <template v-else-if="aliasesError" #text>
                    <v-alert :text="aliasesError" type="error" />
                  </template>

                  <template v-else #text>
                    {{ $t('repositoryAliases.noAliases') }}
                  </template>
                </v-card>
              </v-col>
            </v-row>
          </v-slide-x-transition>
        </template>
      </v-form>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" :loading="loading || saving" />

      <v-btn
        :text="!isEditing ? $t('add') : $t('save')"
        :prepend-icon="!isEditing ? 'mdi-plus' : 'mdi-content-save'"
        :disabled="!valid"
        :loading="saving"
        type="submit"
        form="apiKeyForm"
        variant="elevated"
        color="primary"
      />
    </template>
  </v-card>
</template>

<script setup>
import { addDays } from 'date-fns';

import { getErrorMessage } from '@/lib/errors';
import { featureScopes } from '@/lib/permissions/utils';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
  institution: {
    type: Object,
    default: () => undefined,
  },
  user: {
    type: Object,
    default: () => undefined,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
});

const now = addDays(new Date(), 1);

const { t, locale } = useI18n();
const snacks = useSnacksStore();

const loading = shallowRef(false);
const saving = shallowRef(false);
const valid = shallowRef(false);
const datePickerOpen = shallowRef(false);
const apiKey = ref({ ...props.modelValue });

const { cloned: selectedInstitution } = useCloned(() => props.institution ?? {});
const { cloned: selectedUser } = useCloned(() => props.user ?? {});

/** @type {Ref<Map<string, string>>} */
const permissions = ref(new Map());

const repoStatus = shallowRef(false);
const repoError = shallowRef('');
/** @type {Ref<Map<string, string>>} */
const repositoryPermissions = ref(new Map());

const aliasesStatus = shallowRef(false);
const aliasesError = shallowRef('');
/** @type {Ref<Map<string, string>>} */
const repositoryAliasPermissions = ref(new Map());

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

/**
 * Is editing an api key or creating a new one
 */
const isEditing = computed(() => !!props.modelValue?.id);
/**
 * Get repositories
 */
const repositories = computedAsync(
  async (onCancel) => {
    if (isEditing.value) {
      return [];
    }

    let url = '/api/repositories';
    if (selectedInstitution.value?.id) {
      url = `/api/institutions/${selectedInstitution.value.id}/repositories`;
    }
    if (selectedUser.value?.username) {
      url = `/api/users/${selectedUser.value.username}/repositories`;
    }

    const abortController = new AbortController();
    onCancel(() => abortController.abort());

    try {
      return $fetch(url, {
        signal: abortController.signal,
        query: {
          size: 0,
        },
      });
    } catch (err) {
      repoError.value = getErrorMessage(err, t('anErrorOccurred'));
      return [];
    }
  },
  [],
  { lazy: true, evaluating: repoStatus },
);
/**
 * Get repository aliases
 */
const repositoryAliases = computedAsync(
  async (onCancel) => {
    if (isEditing.value) {
      return [];
    }

    let url = '/api/repository-aliases';
    if (selectedInstitution.value?.id) {
      url = `/api/institutions/${selectedInstitution.value.id}/repository-aliases`;
    }
    if (selectedUser.value?.username) {
      url = `/api/users/${selectedUser.value.username}/repository-aliases`;
    }

    const abortController = new AbortController();
    onCancel(() => abortController.abort());

    try {
      return $fetch(url, {
        signal: abortController.signal,
        query: {
          size: 0,
          include: ['repository'],
        },
      });
    } catch (err) {
      aliasesError.value = getErrorMessage(err, t('anErrorOccurred'));
      return [];
    }
  },
  [],
  { lazy: true, evaluating: aliasesStatus },
);
/**
 * Date object around expiresAt property
 */
const expiresAt = computed({
  get: () => apiKey.value.expiresAt && new Date(apiKey.value.expiresAt),
  set: (v) => { apiKey.value.expiresAt = v?.toISOString() ?? null; },
});
/**
 * expiresAt formatted as a localized string
 */
const expiresAtFormatted = computed(() => {
  if (!expiresAt.value) {
    return null;
  }
  return dateFormat(expiresAt.value, locale.value, 'PPP');
});
/**
 * Available features
 */
const features = computed(
  () => featureScopes
    .filter((scope) => !['api-keys'].includes(scope)) // Prevents to manage API keys from API keys
    .map((scope) => ({
      scope,
      text: t(`institutions.members.featureLabels.${scope}`),
    })),
);

async function save() {
  saving.value = true;

  let url = '/api/api-keys';
  if (selectedInstitution.value?.id) {
    url = `/api/institutions/${selectedInstitution.value.id}/api-keys`;
  }
  if (selectedUser.value?.username) {
    url = `/api/users/${selectedUser.value.username}/api-keys`;
  }

  if (isEditing.value) {
    url += `/${apiKey.value.id}`;
  }

  try {
    let newKey;
    if (isEditing.value) {
      newKey = await $fetch(url, {
        method: 'PUT',
        body: {
          name: apiKey.value.name,
          description: apiKey.value.description,
          expiresAt: apiKey.value.expiresAt,
          active: apiKey.value.active,
        },
      });
    } else {
      newKey = await $fetch(url, {
        method: 'POST',
        body: {
          name: apiKey.value.name,
          description: apiKey.value.description,
          expiresAt: apiKey.value.expiresAt,
          active: true,
          permissions: Array.from(permissions.value.entries()).map(
            ([scope, level]) => `${scope}:${level}`,
          ),
          repositoryPermissions: Array.from(repositoryPermissions.value.entries()).map(
            ([pattern, level]) => ({
              pattern,
              readonly: level === 'read',
            }),
          ),
          repositoryAliasPermissions: Array.from(repositoryAliasPermissions.value.keys()).map(
            (aliasPattern) => ({ aliasPattern }),
          ),
        },
      });
    }
    emit('submit', newKey);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  saving.value = false;
}

onMounted(() => {
  formRef.value?.validate();
});
</script>
