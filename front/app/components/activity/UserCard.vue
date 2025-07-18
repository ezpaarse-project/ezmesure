<template>
  <v-card
    :title="user.name || user.username"
    prepend-icon="mdi-account-circle"
  >
    <template #text>
      <v-list lines="2" density="compact">
        <v-list-item v-if="otherRoles.length > 0" :subtitle="$t('users.user.roles')" prepend-icon="mdi-shield">
          <template #title>
            <v-chip
              v-for="role in otherRoles"
              :key="role.name"
              :text="role.name"
              size="small"
              density="comfortable"
              label
              class="mr-1 mb-1"
            />
          </template>
        </v-list-item>

        <v-list-item v-if="repositoryRoles.length > 0" :subtitle="$t('repositories.repositories')" prepend-icon="mdi-database">
          <template #title>
            <v-chip
              v-for="role in repositoryRoles"
              :key="role.repositoryPattern"
              :text="role.repositoryPattern"
              :append-icon="role.readonly ? 'mdi-book' : 'mdi-book-edit'"
              size="small"
              density="comfortable"
              label
              class="mr-1 mb-1"
            />
          </template>
        </v-list-item>

        <v-list-item v-if="aliasRoles.length > 0" :subtitle="$t('repositoryAliases.alias')" prepend-icon="mdi-database-eye">
          <template #title>
            <v-chip
              v-for="role in aliasRoles"
              :key="role.aliasPattern"
              :text="role.aliasPattern"
              append-icon="mdi-book"
              size="small"
              density="comfortable"
              label
              class="mr-1 mb-1"
            />
          </template>
        </v-list-item>

        <v-list-item v-if="spaceRoles.length > 0" :subtitle="$t('spaces.spaces')" prepend-icon="mdi-tab">
          <template #title>
            <v-chip
              v-for="role in spaceRoles"
              :key="role.spaceId"
              :text="role.spaceId"
              :append-icon="role.readonly ? 'mdi-book' : 'mdi-book-edit'"
              size="small"
              density="comfortable"
              label
              class="mr-1 mb-1"
            />
          </template>
        </v-list-item>

        <v-list-item
          v-if="isUserAdmin"
          :title="$t('yes')"
          :subtitle="$t('users.user.isAdmin')"
          prepend-icon="mdi-security"
        />
      </v-list>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

function parseRoleName(role) {
  const matches = /^(?<type>repository|space|alias)\.(?<name>.+)\.(?<access>readonly|all)?/.exec(role);
  if (!matches?.groups) {
    return {
      name: role,
      readonly: false,
    };
  }

  return {
    type: matches.groups.type,
    name: matches.groups.name,
    readonly: matches.groups.access === 'readonly',
  };
}

const roles = computed(() => props.user.roles ?? []);

const isUserAdmin = computed(() => props.user.isAdmin ?? roles.value.includes('superuser'));

const repositoryRoles = computed(() => {
  if (!props.user.memberships) {
    // subset of roles with only the ones starting with "repository." with a regex
    return roles.value.filter((role) => /^repository/.test(role))
      .map((role) => {
        const parsed = parseRoleName(role);
        return {
          role,
          repositoryPattern: parsed.name,
          readonly: parsed.readonly,
        };
      });
  }

  return props.user.memberships.reduce((acc, m) => [
    ...acc,
    ...m.repositoryPermissions ?? [],
  ], []);
});
const spaceRoles = computed(() => {
  if (!props.user.memberships) {
    // subset of roles with only the ones starting with "space." with a regex
    return roles.value.filter((role) => /^space/.test(role))
      .map((role) => {
        const parsed = parseRoleName(role);
        return {
          role,
          spaceId: parsed.name,
          readonly: parsed.readonly,
        };
      });
  }

  return props.user.memberships.reduce((acc, m) => [
    ...acc,
    ...m.spacePermissions ?? [],
  ], []);
});
const aliasRoles = computed(() => {
  if (!props.user.memberships) {
    // subset of roles with only the ones starting with "alias." with a regex
    return roles.value.filter((role) => /^alias./.test(role))
      .map((role) => {
        const parsed = parseRoleName(role);
        return {
          role,
          aliasPattern: parsed.name,
          readonly: true,
        };
      });
  }

  return props.user.memberships.reduce((acc, m) => [
    ...acc,
    ...m.repositoryAliasPermissions ?? [],
  ], []);
});
const otherRoles = computed(() => {
  if (!props.user.memberships) {
    let other = new Set(roles.value);
    const exclude = (rs) => { other = other.difference(new Set(rs.map(({ role }) => role))); };

    if (isUserAdmin.value) { other.delete('superuser'); }
    exclude(repositoryRoles.value);
    exclude(spaceRoles.value);
    exclude(aliasRoles.value);

    return Array.from(other).map((name) => ({ name }));
  }

  return props.user.elasticRoles;
});
</script>
