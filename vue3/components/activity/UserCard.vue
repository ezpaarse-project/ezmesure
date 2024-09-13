<template>
  <v-card
    :title="user.name"
    prepend-icon="mdi-account-circle"
  >
    <template #text>
      <v-list lines="2" density="compact">
        <v-list-item :subtitle="$t('users.user.roles')" prepend-icon="mdi-shield">
          <template #title>
            <v-chip
              v-for="role in otherRoles"
              :key="role"
              :text="role"
              size="small"
              label
              class="mr-1"
            />
          </template>
        </v-list-item>

        <v-list-item :subtitle="$t('repositories.repositories')" prepend-icon="mdi-database">
          <template #title>
            <v-chip
              v-for="role in repositoryRoles"
              :key="role"
              :text="role"
              size="small"
              label
              class="mr-1"
            />
          </template>
        </v-list-item>

        <v-list-item :subtitle="$t('spaces.spaces')" prepend-icon="mdi-tab">
          <template #title>
            <v-chip
              v-for="role in spaceRoles"
              :key="role"
              :text="role"
              size="small"
              label
              class="mr-1"
            />
          </template>
        </v-list-item>
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

const roles = computed(() => props.user.roles ?? []);

// subset of roles with only the ones starting with "repository." with a regex
const repositoryRoles = computed(() => roles.value.filter((role) => /^repository/.test(role)));
const spaceRoles = computed(() => roles.value.filter((role) => /^space/.test(role)));
const otherRoles = computed(() => {
  const allRoles = new Set(roles.value);
  const rRoles = new Set(repositoryRoles.value);
  const sRoles = new Set(spaceRoles.value);
  return allRoles.difference(rRoles).difference(sRoles);
});
</script>
