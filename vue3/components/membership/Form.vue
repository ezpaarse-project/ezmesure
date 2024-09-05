<template>
  <v-card
    :loading="loading"
    :title="$t('institutions.members.permissionsOf', { name: modelValue.user.fullName })"
    :subtitle="subtitle"
    prepend-icon="mdi-shield"
  >
    <template #text>
      <v-row>
        <v-col cols="12">
          <v-row v-if="isLocked">
            <v-col>
              <v-alert
                :text="$t('institutions.members.notEditable')"
                type="info"
                dense
                outlined
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-card
                :title="$t('institutions.members.roles')"
                prepend-icon="mdi-tag"
                variant="outlined"
              >
                <template #text>
                  <v-checkbox
                    :model-value="roles.has('guest')"
                    :label="$t('institutions.members.roleNames.guest')"
                    :append-icon="roleColors.get('guest').icon"
                    :disabled="loading"
                    density="comfortable"
                    hide-details
                    @click="toggleRole('guest')"
                  />

                  <div class="ml-2">
                    <div class="text-subtitle-2">
                      {{ $t('institutions.members.correspondent') }}
                    </div>

                    <div class="ml-2">
                      <v-checkbox
                        :model-value="roles.has('contact:doc')"
                        :label="$t('institutions.members.documentary')"
                        :append-icon="roleColors.get('contact:doc').icon"
                        :disabled="loading"
                        density="comfortable"
                        hide-details
                        @click="toggleRole('contact:doc')"
                      />
                      <v-checkbox
                        :model-value="roles.has('contact:tech')"
                        :label="$t('institutions.members.technical')"
                        :append-icon="roleColors.get('contact:tech').icon"
                        :disabled="loading"
                        density="comfortable"
                        hide-details
                        @click="toggleRole('contact:tech')"
                      />
                    </div>
                  </div>
                </template>
              </v-card>
            </v-col>
          </v-row>

          <v-row v-if="permissions">
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
                      :readonly="!canEdit"
                      @update:model-value="save([saveMembership])"
                    />
                  </v-list>
                </template>
              </v-card>
            </v-col>
          </v-row>

          <v-row v-if="repositoryPermissions">
            <v-col cols="12">
              <v-card
                :title="$t('repositories.repositories')"
                :loading="repoStatus === 'pending'"
                prepend-icon="mdi-database"
                variant="outlined"
              >
                <template #text>
                  <v-list>
                    <MembershipRepositoryPermissionItem
                      v-for="repo in repositories"
                      :key="repo.pattern"
                      v-model="repositoryPermissions"
                      :repository="repo"
                      :readonly="!canEdit"
                      @update:model-value="save([saveRepoPermissions])"
                    />
                  </v-list>
                </template>
              </v-card>
            </v-col>
          </v-row>

          <v-row v-if="spacePermissions">
            <v-col cols="12">
              <v-card
                :title="$t('spaces.spaces')"
                :loading="spaceStatus === 'pending'"
                prepend-icon="mdi-tab"
                variant="outlined"
              >
                <template #text>
                  <v-list>
                    <MembershipSpacePermissionItem
                      v-for="space in spaces"
                      :key="space.id"
                      v-model="spacePermissions"
                      :space="space"
                      :readonly="!canEdit"
                      @update:model-value="save([saveSpacePermissions])"
                    />
                  </v-list>
                </template>
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-card
                :title="$t('institutions.institution.general')"
                prepend-icon="mdi-format-list-bulleted"
                variant="outlined"
              >
                <template #text>
                  <v-row>
                    <v-col cols="6">
                      <v-checkbox
                        v-model="locked"
                        :label="$t('institutions.members.locked')"
                        density="comfortable"
                        hide-details
                        @update:model-value="save([saveMembership])"
                      />
                    </v-col>
                  </v-row>
                </template>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
import { featureScopes, permissionLevelEnum } from '@/lib/permissions/utils';
import presets from '@/lib/permissions/presets';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  institution: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits({
  'update:modelValue': (item) => !!item,
});

const { t } = useI18n();
const { data: user } = useAuthState();
const { hasPermission } = useCurrentUserStore();
const snacks = useSnacksStore();

const loading = ref(false);
const locked = ref(props.modelValue?.locked ?? false);
/** @type {Ref<Set<string>>} */
const roles = ref(new Set(props.modelValue?.roles ?? []));
/** @type {Ref<Map<string, string>>} */
const permissions = ref(new Map());
/** @type {Ref<Map<string, string>>} */
const repositoryPermissions = ref(new Map());
/** @type {Ref<Map<string, string>>} */
const spacePermissions = ref(new Map());

/**
 * If current member is locked
 */
const isLocked = computed(() => {
  if (user.value?.isAdmin) {
    return false;
  }
  return props.modelValue.locked;
});

/**
 * If user can edit members
 */
const canEdit = computed(() => {
  if (user.value?.isAdmin) {
    return true;
  }
  return !isLocked.value && hasPermission('memberships:write', { throwOnNoMembership: true });
});

/**
 * Get spaces
 */
const {
  data: spaces,
  status: spaceStatus,
} = await useFetch(`/api/institutions/${props.institution.id}/spaces`, {
  lazy: true,
  query: {
    size: 0,
  },
});

/**
 * Get repositories
 */
const {
  data: repositories,
  status: repoStatus,
} = await useFetch(`/api/institutions/${props.institution.id}/repositories`, {
  lazy: true,
  query: {
    size: 0,
  },
});

/**
 * Subtitle of the form
 */
const subtitle = computed(() => {
  let { name } = props.institution;
  if (props.institution.acronym) {
    name += ` - ${props.institution.acronym}`;
  }
  return name;
});
/**
 * Available features
 */
const features = computed(() => featureScopes.map((scope) => ({
  scope,
  text: t(`institutions.members.featureLabels.${scope}`),
})));

/**
 * Map permissions from API
 */
function mapPermissions(perms, map) {
  map.clear();
  // eslint-disable-next-line no-restricted-syntax
  for (const perm of perms) {
    const [scope, value] = perm.split(':');
    const oldValue = map.get(scope);
    if (permissionLevelEnum[value] > (permissionLevelEnum[oldValue] ?? 0)) {
      map.set(scope, value);
    }
  }
}
/**
 * Map repo permissions from API
 */
function mapRepoPermissions(perms, map) {
  map.clear();
  // eslint-disable-next-line no-restricted-syntax
  for (const perm of perms) {
    map.set(perm.repositoryPattern, perm.readonly ? 'read' : 'write');
  }
}
/**
 * Map permissions from API
 */
function mapSpacePermissions(perms, map) {
  map.clear();
  // eslint-disable-next-line no-restricted-syntax
  for (const perm of perms) {
    map.set(perm.spaceId, perm.readonly ? 'read' : 'write');
  }
}
/**
 * Save membership data
 */
function saveMembership() {
  const perms = [...permissions.value].map(([scope, level]) => {
    const res = [`${scope}:read`];
    if (level === 'write') {
      res.push(`${scope}:write`);
    }
    return res;
  });

  return $fetch(`/api/institutions/${props.institution.id}/memberships/${props.modelValue.username}`, {
    method: 'PUT',
    body: {
      roles: Array.from(roles.value),
      locked: user.value?.isAdmin ? locked.value : undefined,
      permissions: perms.flat(),
    },
  });
}
/**
 * Save repository permissions
 */
function saveRepoPermissions() {
  /** @type {Map<string, string>} */
  const oldRepoPerms = new Map();
  mapRepoPermissions(props.modelValue?.repoPermissions ?? [], oldRepoPerms);

  const promises = [...repositoryPermissions.value, ...oldRepoPerms]
    .map(([pattern, level]) => {
      const url = `/api/institutions/${props.institution.id}/repositories/${pattern}/permissions/${props.modelValue.username}`;

      // If new or modified
      if (oldRepoPerms.get(pattern) !== level) {
        return $fetch(url, { method: 'PUT', body: { readonly: level === 'read' } });
      }

      // If deleted
      if (!repositoryPermissions.value.has(pattern)) {
        return $fetch(url, { method: 'DELETE' });
      }

      return null;
    })
    .filter((p) => p !== null);

  return Promise.all(promises);
}
/**
 * Save space permissions
 */
function saveSpacePermissions() {
  /** @type {Map<string, string>} */
  const oldSpacePerms = new Map();
  mapSpacePermissions(props.modelValue?.spacePermissions ?? [], oldSpacePerms);

  const promises = [...spacePermissions.value, ...oldSpacePerms]
    .map(([spaceId, level]) => {
      const url = `/api/kibana-spaces/${spaceId}/permissions/${props.modelValue.username}`;

      // If new or modified
      if (oldSpacePerms.get(spaceId) !== level) {
        return $fetch(url, { method: 'PUT', body: { readonly: level === 'read' } });
      }

      // If deleted
      if (!spacePermissions.value.has(spaceId)) {
        return $fetch(url, { method: 'DELETE' });
      }

      return null;
    })
    .filter((p) => p !== null);

  return Promise.all(promises);
}
/**
 * Save the form
 *
 * @param {(() => Promise<unknown>)[]} [actions] The actions to perform
 */
async function save(actions) {
  loading.value = true;

  const toDo = actions;
  if (!actions) {
    toDo = [saveMembership, saveRepoPermissions, saveSpacePermissions];
  }

  try {
    await Promise.all(toDo.map((action) => action()));
    emit('update:modelValue', props.modelValue);
  } catch (err) {
    snacks.error(t('anErrorOccurred'));
  }

  loading.value = false;
}
/**
 * Toggle role and apply permission preset if needed and found
 *
 * @param {string} role The role name
 */
function toggleRole(role) {
  const actions = [];

  const oldSize = roles.value.size;
  if (roles.value.has(role)) {
    roles.value.delete(role);
  } else {
    roles.value.add(role);
  }
  actions.push(saveMembership);

  // If it's the first role added, apply preset
  if (roles.value.size !== 1 || oldSize !== 0) {
    save(actions);
    return;
  }

  const preset = presets.get(role);
  if (!preset) {
    save(actions);
    return;
  }

  // Apply permissions as defined in preset
  if (preset.features) {
    permissions.value = new Map(preset.features);
    // `saveMembership` is already in actions so no need to add it
  }
  if (preset.repositories) {
    repositoryPermissions.value = new Map(
      (repositories.value ?? []).map((r) => [r.pattern, preset.repositories]),
    );
    actions.push(saveRepoPermissions);
  }
  if (preset.spaces) {
    spacePermissions.value = new Map((spaces.value ?? []).map((s) => [s.id, preset.spaces]));
    actions.push(saveSpacePermissions);
  }
  save(actions);
}

mapPermissions(props.modelValue?.permissions ?? [], permissions.value);
mapRepoPermissions(props.modelValue?.repositoryPermissions ?? [], repositoryPermissions.value);
mapSpacePermissions(props.modelValue?.spacePermissions ?? [], spacePermissions.value);

onMounted(() => {
  formRef.value?.validate();
});
</script>
