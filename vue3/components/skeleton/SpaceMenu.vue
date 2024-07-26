<template>
  <v-navigation-drawer v-model="isOpen" color="grey-lighten-3">
    <v-list-item
      :title="$t('menu.myDeposits')"
      to="/myspace/files"
      prepend-icon="mdi-file-upload"
      class="text-grey-darken-3"
    />
    <v-list-item
      :title="$t('menu.myInstitutions')"
      to="/myspace/institutions"
      prepend-icon="mdi-domain"
      class="text-grey-darken-3"
    />

    <template v-if="user" #append>
      <v-divider />

      <v-list-item
        :title="$t('menu.credentials')"
        :href="kibanaProfileUrl"
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
        to="/myspace/"
        prepend-icon="mdi-account"
        exact
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
import { useDrawerStore } from '@/store/drawer';
import { useCurrentUserStore } from '@/store/currentUser';

const { public: config } = useRuntimeConfig();
const { data: user, signOut } = useAuth();
const { isOpen } = storeToRefs(useDrawerStore());
const { spacesPermissions } = storeToRefs(useCurrentUserStore());

const kibanaProfileUrl = computed(() => {
  const firstSpace = spacesPermissions.value.at(0);
  if (firstSpace) {
    return `/kibana/s/${firstSpace.spaceId}/security/account`;
  }
  return '/kibana/';
});

async function logout() {
  if (config.shibbolethEnabled) {
    navigateTo('/Shibboleth.sso/Logout?return=/logout', { external: true });
    return;
  }

  await signOut({ callbackUrl: '/' });
}
</script>
