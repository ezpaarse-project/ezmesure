<template>
  <v-navigation-drawer v-model="isOpen" width="300" color="grey-lighten-3">
    <v-list-item
      :title="$t('menu.myspace.institutions')"
      to="/myspace"
      prepend-icon="mdi-domain"
      class="text-grey-darken-3"
      exact
    />

    <CurrentUserInstitutionList />

    <v-list-item
      :title="$t('menu.myspace.deposits')"
      to="/myspace/files"
      prepend-icon="mdi-file-upload"
      class="text-grey-darken-3"
    />

    <template v-if="foreignSpacesPermissions.length > 0">
      <v-list-item
        :title="$t('menu.myspace.foreignAccess')"
        prepend-icon="mdi-tab-plus"
        class="text-grey-darken-3"
      />

      <v-list variant="flat" lines="two" density="compact" class="py-0">
        <v-list-item
          v-for="{ space } in foreignSpacesPermissions"
          :key="space.id"
          v-tooltip="space.name"
          :title="space.name"
          :href="`/kibana/s/${space.id}`"
          append-icon="mdi-open-in-app"
          @click.prevent="openInTab(`/kibana/s/${space.id}`, space.id)"
        >
          <template #subtitle>
            <RepositoryTypeChip
              :model-value="space"
              size="small"
              density="compact"
            />
          </template>
        </v-list-item>
      </v-list>
    </template>

    <template v-if="user" #append>
      <v-divider />

      <v-list-item
        :title="$t('menu.myspace.credentials')"
        to="/myspace/profile"
        prepend-icon="mdi-account-key"
        class="text-grey-darken-3"
      />

      <v-list-item
        :title="$t('menu.myspace.settings')"
        to="/myspace/settings"
        prepend-icon="mdi-cog"
        class="text-grey-darken-3"
      />

      <v-list-item
        :title="user.fullName"
        :subtitle="user.username"
        lines="two"
        prepend-icon="mdi-account"
      >
        <template #append>
          <v-btn
            :title="$t('menu.myspace.logout')"
            icon="mdi-logout"
            size="small"
            color="red"
            variant="tonal"
            @click="logout()"
          />
        </template>
      </v-list-item>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
const { data: user } = useAuth();
const { isOpen } = storeToRefs(useDrawerStore());
const { foreignSpacesPermissions } = storeToRefs(useCurrentUserStore());
const { openInTab } = useSingleTabLinks('kibanaSpaces');

async function logout() {
  await navigateTo(
    { path: '/api/auth/oauth/logout' },
    { external: true },
  );
}
</script>
