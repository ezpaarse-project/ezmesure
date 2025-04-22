<template>
  <v-card
    :title="$t('institutions.members.accessRights')"
    :subtitle="showRole ? role.name : undefined"
    :loading="loading && 'primary'"
    prepend-icon="mdi-tag-arrow-right"
  >
    <template #text>
      <v-row>
        <v-col>
          <v-list-subheader class="d-flex align-center">
            <v-icon icon="mdi-database" start />
            {{ $t('repositories.toolbarTitle', { count: repositoryPermissions.length }) }}

            <ElasticRolePermissionsAddRepositoryMenu
              :role="role"
              @update:model-value="editRepositoryLink($event)"
            >
              <template #activator="{ props: menu }">
                <v-btn
                  v-tooltip="$t('add')"
                  icon="mdi-plus"
                  color="green"
                  size="small"
                  density="comfortable"
                  variant="text"
                  v-bind="menu"
                />
              </template>
            </ElasticRolePermissionsAddRepositoryMenu>
          </v-list-subheader>

          <div v-if="repositoryPermissions.length <= 0" class="text-center text-grey pt-5">
            {{ $t('repositories.noRepository') }}
          </div>

          <v-list v-else density="compact" lines="two">
            <v-list-item
              v-for="permission in repositoryPermissions"
              :key="permission.repositoryPattern"
              :title="permission.repositoryPattern"
            >
              <template #subtitle>
                <RepositoryTypeChip
                  v-if="permission.repository"
                  :model-value="permission.repository"
                  class="mr-2"
                />
              </template>

              <template #append>
                <PermissionSwitch
                  :model-value="permission.readonly ? 'read' : 'write'"
                  icons
                  @update:model-value="editRepositoryLink(permission, $event)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>

      <v-divider class="mt-4 mb-2" />

      <v-row>
        <v-col>
          <v-list-subheader class="d-flex align-center">
            <v-icon icon="mdi-database-eye" start />
            {{ $t('repositoryAliases.toolbarTitle', { count: aliasPermissions.length }) }}

            <ElasticRolePermissionsAddAliasMenu
              :role="role"
              @update:model-value="editAliasLink($event)"
            >
              <template #activator="{ props: menu }">
                <v-btn
                  v-tooltip="$t('add')"
                  icon="mdi-plus"
                  color="green"
                  size="small"
                  density="comfortable"
                  variant="text"
                  v-bind="menu"
                />
              </template>
            </ElasticRolePermissionsAddAliasMenu>
          </v-list-subheader>

          <div v-if="aliasPermissions.length <= 0" class="text-center text-grey pt-5">
            {{ $t('repositoryAliases.noAliases') }}
          </div>

          <v-list v-else density="compact" lines="two">
            <v-list-item
              v-for="permission in aliasPermissions"
              :key="permission.aliasPattern"
              :title="permission.aliasPattern"
            >
              <template #title>
                {{ permission.aliasPattern }}

                <v-icon v-if="!!permission.alias?.filters" icon="mdi-filter" size="small" start />
              </template>

              <template #subtitle>
                <RepositoryTypeChip
                  v-if="permission.alias?.repository"
                  :model-value="permission.alias.repository"
                  class="mr-2"
                />

                {{ $t('elasticRoles.readonly') }}
              </template>

              <template #append>
                <PermissionSwitch
                  model-value="read"
                  :levels="['none', 'read']"
                  icons
                  @update:model-value="editAliasLink(permission, $event)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>

      <v-divider class="mt-4 mb-2" />

      <v-row>
        <v-col>
          <v-list-subheader class="d-flex align-center">
            <v-icon icon="mdi-tab" start />
            {{ $t('spaces.toolbarTitle', { count: spacePermissions.length }) }}

            <ElasticRolePermissionsAddSpaceMenu
              :role="role"
              @update:model-value="editSpaceLink($event)"
            >
              <template #activator="{ props: menu }">
                <v-btn
                  v-tooltip="$t('add')"
                  icon="mdi-plus"
                  color="green"
                  size="small"
                  density="comfortable"
                  variant="text"
                  v-bind="menu"
                />
              </template>
            </ElasticRolePermissionsAddSpaceMenu>
          </v-list-subheader>

          <div v-if="spacePermissions.length <= 0" class="text-center text-grey pt-5">
            {{ $t('spaces.noSpace') }}
          </div>

          <v-list v-else density="compact" lines="two">
            <v-list-item
              v-for="permission in spacePermissions"
              :key="permission.spaceId"
              :title="permission.space?.name || permission.spaceId"
            >
              <template #subtitle>
                <RepositoryTypeChip
                  v-if="permission.space"
                  :model-value="permission.space"
                  class="mr-2"
                />
              </template>

              <template #append>
                <PermissionSwitch
                  :model-value="permission.readonly ? 'read' : 'write'"
                  icons
                  @update:model-value="editSpaceLink(permission, $event)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  role: {
    type: Object,
    required: true,
  },
  showRole: {
    type: Boolean,
    default: false,
  },
});

const snacks = useSnacksStore();
const { t } = useI18n();

const emit = defineEmits({
  'update:modelValue': () => true,
});

const loading = ref(false);
/** @type {Ref<object[]>} */
const repositoryPermissions = ref(props.role.repositoryPermissions || []);
/** @type {Ref<object[]>} */
const aliasPermissions = ref(props.role.repositoryAliasPermissions || []);
/** @type {Ref<object[]>} */
const spacePermissions = ref(props.role.spacePermissions || []);

// ---

async function deleteRepositoryLink(item) {
  await $fetch(`/api/elastic-roles/${props.role.name}/repository-permissions/${item.repositoryPattern}`, {
    method: 'DELETE',
  });

  repositoryPermissions.value = repositoryPermissions.value.filter(
    (p) => p.repositoryPattern !== item.repositoryPattern,
  );
}

async function upsertRepositoryLink(item) {
  await $fetch(`/api/elastic-roles/${props.role.name}/repository-permissions/${item.repositoryPattern}`, {
    method: 'PUT',
    body: {
      readonly: item.readonly,
    },
  });

  const index = repositoryPermissions.value.findIndex(
    (i) => i.repositoryPattern === item.repositoryPattern,
  );
  if (index >= 0) {
    repositoryPermissions.value[index] = item;
  } else {
    repositoryPermissions.value.push(item);
  }
}

async function editRepositoryLink(item, level) {
  const permission = { ...item, readonly: level === 'read' };
  try {
    if (level === 'none') {
      await deleteRepositoryLink(permission);
    } else {
      await upsertRepositoryLink(permission);
    }

    emit('update:modelValue');
  } catch {
    snacks.error(t('anErrorOccurred'));
  }
}

// ---

async function deleteAliasLink(item) {
  await $fetch(`/api/elastic-roles/${props.role.name}/repository-alias-permissions/${item.aliasPattern}`, {
    method: 'DELETE',
  });

  aliasPermissions.value = aliasPermissions.value.filter(
    (p) => p.aliasPattern !== item.aliasPattern,
  );
}

async function createAliasLink(item) {
  await $fetch(`/api/elastic-roles/${props.role.name}/repository-alias-permissions/${item.aliasPattern}`, {
    method: 'PUT',
    body: {},
  });

  aliasPermissions.value.push(item);
}

async function editAliasLink(item, level) {
  try {
    if (level === 'none') {
      await deleteAliasLink(item);
    } else {
      await createAliasLink(item);
    }

    emit('update:modelValue');
  } catch {
    snacks.error(t('anErrorOccurred'));
  }
}

// ---

async function deleteSpaceLink(item) {
  await $fetch(`/api/elastic-roles/${props.role.name}/space-permissions/${item.spaceId}`, {
    method: 'DELETE',
  });

  spacePermissions.value = spacePermissions.value.filter(
    (p) => p.spaceId !== item.spaceId,
  );
}

async function upsertSpaceLink(item) {
  await $fetch(`/api/elastic-roles/${props.role.name}/space-permissions/${item.spaceId}`, {
    method: 'PUT',
    body: {
      readonly: item.readonly,
    },
  });

  const index = spacePermissions.value.findIndex((i) => i.spaceId === item.spaceId);
  if (index >= 0) {
    spacePermissions.value[index] = item;
  } else {
    spacePermissions.value.push(item);
  }
}

async function editSpaceLink(item, level) {
  const permission = { ...item, readonly: level === 'read' };
  try {
    if (level === 'none') {
      await deleteSpaceLink(permission);
    } else {
      await upsertSpaceLink(permission);
    }

    emit('update:modelValue');
  } catch {
    snacks.error(t('anErrorOccurred'));
  }
}
</script>
