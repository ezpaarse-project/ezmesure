<template>
  <v-card
    :title="isEditing ? $t('api-keys.editKey') : $t('api-keys.newKey')"
    :prepend-icon="isEditing ? 'mdi-lock-open' : 'mdi-lock-open-plus'"
  >
    <template #text>
      <v-window v-model="windowId">
        <v-window-item value="root">
          <v-form
            id="apiKeyForm"
            ref="formRef"
            v-model="valid"
            @submit.prevent="save()"
          >
            <v-row v-if="!isEditing && !props.institution && !props.user">
              <v-col>
                <v-card
                  :title="$t('api-keys.subject')"
                  prepend-icon="mdi-link-variant"
                  variant="outlined"
                >
                  <template #text>
                    <v-row>
                      <v-col cols="12">
                        <p>
                          {{ $t('api-keys.subjectDesc') }}
                        </p>
                      </v-col>

                      <v-col cols="12">
                        <InstitutionAutoComplete
                          v-model="selectedInstitution"
                          :required="!selectedUser"
                          @update:model-value="() => { selectedUser = null }"
                        />
                      </v-col>

                      <v-col cols="12">
                        <UserAutoComplete
                          v-model="selectedUser"
                          :required="!selectedInstitution"
                          @update:model-value="() => { selectedInstitution = null }"
                        />
                      </v-col>
                    </v-row>
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
              <v-slide-x-transition>
                <v-row v-if="selectedInstitution?.id">
                  <v-col cols="12">
                    <v-card
                      :title="$t('institutions.members.institutionManagement')"
                      prepend-icon="mdi-office-building"
                      variant="outlined"
                    >
                      <template #text>
                        <v-list>
                          <MembershipPermissionItem
                            v-for="{ feature, permission } in features"
                            :key="feature.scope"
                            v-model="permissions"
                            :feature="feature"
                            :max="permission"
                          />
                        </v-list>
                      </template>
                    </v-card>
                  </v-col>

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
                            v-for="{ repository, permission } in repositories"
                            :key="repository.pattern"
                            v-model="repositoryPermissions"
                            :repository="repository"
                            :max="permission?.readonly ? 'read' : 'write'"
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
                            v-for="{ alias } in repositoryAliases"
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
        </v-window-item>

        <v-window-item value="value">
          <v-alert
            :title="$t('api-keys.created.title')"
            type="success"
          >
            <template #text>
              <div class="my-4">
                <v-code>
                  {{ apiKey.value }}

                  <v-btn
                    v-if="clipboard"
                    icon="mdi-content-copy"
                    variant="text"
                    density="comfortable"
                    size="x-small"
                    @click="copyValue()"
                  />
                </v-code>
              </div>

              <i18n-t keypath="api-keys.created.text.instructions" tag="p" class="my-2">
                <template #header>
                  <code>X-API-Key</code>
                </template>
              </i18n-t>

              <i18n-t keypath="api-keys.created.text.save" tag="p" class="my-2">
                <template #pass>
                  <a href="https://keepassxc.org/" target="_blank" rel="noopener norefferer">KeePassXC</a>
                </template>

                <template #warn>
                  <span class="font-weight-bold">{{ $t('api-keys.created.text.warning') }}</span>
                </template>
              </i18n-t>
            </template>
          </v-alert>
        </v-window-item>
      </v-window>
    </template>

    <template #actions>
      <v-spacer />

      <template v-if="windowId === 'root'">
        <slot name="actions" :loading="saving" />

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

      <v-btn
        v-if="windowId === 'value'"
        :text="$t('validate')"
        prepend-icon="mdi-check"
        variant="text"
        color="primary"
        @click="$emit('submit', apiKey)"
      />
    </template>
  </v-card>
</template>

<script setup>
import { addDays } from 'date-fns';

import { getErrorMessage } from '@/lib/errors';
import { featureScopes } from '@/lib/permissions/utils';

// Prevents to manage API keys from API keys
const FORBBIDEN_SCOPES = ['api-keys'];

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

defineEmits({
  submit: (item) => !!item,
});

const now = addDays(new Date(), 1);

const { t, locale } = useI18n();
const { data: currentUser } = useAuthState();
const { isSupported: clipboard, copy } = useClipboard();
const snacks = useSnacksStore();
const {
  memberships: currentMemberships,
  reposPermissions,
  aliasPermissions,
} = storeToRefs(useCurrentUserStore());

const saving = shallowRef(false);
const valid = shallowRef(false);
const datePickerOpen = shallowRef(false);
const windowId = shallowRef('root');
const apiKey = ref({ ...props.modelValue });

const { cloned: selectedInstitution } = useCloned(() => props.institution ?? null);
const { cloned: selectedUser } = useCloned(() => props.user ?? null);

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
 * Map of current user permissions
 */
const reposPermissionsMap = computed(() => new Map(
  reposPermissions.value.map((perm) => [
    perm.repositoryPattern,
    { ...perm, repository: undefined },
  ]),
));
/**
 * Get repositories for selected institution
 */
const repositories = computedAsync(
  async (onCancel) => {
    if (isEditing.value) {
      return [];
    }

    if (!selectedInstitution.value?.id) {
      return [];
    }

    const abortController = new AbortController();
    onCancel(() => abortController.abort());

    repoError.value = '';
    try {
      const data = await $fetch(`/api/institutions/${selectedInstitution.value.id}/repositories`, {
        signal: abortController.signal,
        query: {
          size: 0,
        },
      });

      return data
        .map((repository) => ({
          repository,
          permission: reposPermissionsMap.value.get(repository.pattern),
        }))
        .filter(({ permission }) => (currentUser.value.isAdmin ? true : !!permission));
    } catch (err) {
      repoError.value = getErrorMessage(err, t('anErrorOccurred'));
      return [];
    }
  },
  [],
  { lazy: true, evaluating: repoStatus },
);
/**
 * Map of current user permissions
 */
const aliasPermissionsMap = computed(() => new Map(
  aliasPermissions.value.map((perm) => [
    perm.aliasPattern,
    { ...perm, alias: undefined },
  ]),
));
/**
 * Get repository aliases for selected institution
 */
const repositoryAliases = computedAsync(
  async (onCancel) => {
    if (isEditing.value) {
      return [];
    }

    if (!selectedInstitution.value?.id) {
      return [];
    }

    const abortController = new AbortController();
    onCancel(() => abortController.abort());

    aliasesError.value = '';
    try {
      const data = await $fetch(`/api/institutions/${selectedInstitution.value.id}/repository-aliases`, {
        signal: abortController.signal,
        query: {
          size: 0,
          include: ['repository'],
        },
      });

      return data
        .map((alias) => ({
          alias,
          permission: aliasPermissionsMap.value.get(alias.pattern),
        }))
        .filter(({ permission }) => (currentUser.value.isAdmin ? true : !!permission));
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
 * Map of permissions of current user for selected institution
 */
const currentUserPermissions = computed(() => {
  if (!selectedInstitution.value?.id) {
    return undefined;
  }

  const membership = currentMemberships.value.find(
    ({ institutionId }) => institutionId === selectedInstitution.value.id,
  );
  if (!membership) {
    return undefined;
  }

  return new Map(membership.permissions.map((perm) => perm.split(':', 2)));
});
/**
 * Available features
 */
const features = computed(
  () => featureScopes
    .map((scope) => ({
      feature: {
        scope,
        text: t(`institutions.members.featureLabels.${scope}`),
      },
      permission: currentUser.value.isAdmin ? 'write' : currentUserPermissions.value?.get(scope) ?? 'never',
    }))
    .filter(
      ({ feature, permission }) => !FORBBIDEN_SCOPES.includes(feature.scope) && permission !== 'never',
    ),
);

async function save() {
  saving.value = true;

  let url = '/api/api-keys';
  if (selectedInstitution.value?.id) {
    url = `/api/institutions/${selectedInstitution.value.id}/api-keys`;
  }
  if (selectedUser.value?.username) {
    url = `/api/users/${selectedUser.value.username}/api-keys`;

    if (selectedUser.value.username === currentUser.value.username) {
      url = '/api/auth/api-keys';
    }
  }

  if (isEditing.value) {
    url += `/${apiKey.value.id}`;
  }

  try {
    if (isEditing.value) {
      apiKey.value = await $fetch(url, {
        method: 'PUT',
        body: {
          name: apiKey.value.name,
          description: apiKey.value.description,
          expiresAt: apiKey.value.expiresAt,
          active: apiKey.value.active,
        },
      });
    } else {
      apiKey.value = await $fetch(url, {
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
            ([repositoryPattern, level]) => ({
              repositoryPattern,
              readonly: level === 'read',
            }),
          ),
          repositoryAliasPermissions: Array.from(repositoryAliasPermissions.value.keys()).map(
            (aliasPattern) => ({ aliasPattern }),
          ),
        },
      });
    }
    windowId.value = 'value';
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  saving.value = false;
}

/**
 * Put key value into clipboard
 */
async function copyValue() {
  if (!apiKey.value.value) {
    return;
  }

  try {
    await copy(apiKey.value.value);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}

onMounted(() => {
  formRef.value?.validate();
});
</script>
