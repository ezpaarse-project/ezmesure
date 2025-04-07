<template>
  <v-navigation-drawer v-model="isOpen" width="300" color="grey-lighten-3">
    <v-list-item
      :title="$t('menu.myInstitutions')"
      to="/myspace"
      prepend-icon="mdi-domain"
      class="text-grey-darken-3"
      exact
    />

    <CurrentUserInstitutionList />

    <v-list-item
      :title="$t('menu.myDeposits')"
      to="/myspace/files"
      prepend-icon="mdi-file-upload"
      class="text-grey-darken-3"
    />

    <template v-if="user" #append>
      <v-divider />

      <v-list-item
        :title="$t('menu.credentials')"
        to="/myspace/profile"
        prepend-icon="mdi-account-key"
        class="text-grey-darken-3"
      />
      <v-list-item
        :title="$t('menu.authentificationToken')"
        to="/myspace/token"
        prepend-icon="mdi-key"
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
            :title="$t('menu.logout')"
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
const { public: config } = useRuntimeConfig();
const { data: user, signOut } = useAuth();
const { isOpen } = storeToRefs(useDrawerStore());

async function logout() {
  if (!config.shibbolethDisabled) {
    await navigateTo('/Shibboleth.sso/Logout?return=/logout', { external: true });
    return;
  }

  await signOut({ callbackUrl: '/' });
}
</script>
