<template>
  <v-container class="mt-5">
    <v-card class="mx-auto" max-width="1400">
      <v-tabs
        v-model="activeTab"
        show-arrows
        :vertical="$vuetify.breakpoint.mdAndUp"
        color="primary"
        background-color="grey lighten-3"
      >
        <v-tab to="#tab-profile" router>
          Profil
        </v-tab>
        <v-tab to="#tab-files" router>
          Mes dépôts
        </v-tab>
        <v-tab to="#tab-kibana" router>
          Identifiants Kibana
        </v-tab>
        <v-tab to="#tab-token" router>
          Token d'authentification
        </v-tab>
        <v-tab v-if="isTester || isAdmin" to="#tab-correspondent" router>
          Informations établissement
        </v-tab>
        <v-tab v-if="isAdmin" to="#tab-admin" router>
          Administration
        </v-tab>

        <v-spacer />
        <v-divider />

        <v-tab class="red--text" href="/Shibboleth.sso/Logout?return=/logout">
          Déconnexion
        </v-tab>

        <v-tabs-items v-model="activeTab" class="h640">
          <v-tab-item id="tab-profile">
            <Profile />
          </v-tab-item>

          <v-tab-item id="tab-files">
            <Files
              :nb-selected-files="nbSelectedFiles"
              @refreshFileList="refreshFileList"
              @deleteSelectedFiles="deleteSelectedFiles"
              @deselectFiles="deselectFiles"
            />
          </v-tab-item>

          <v-tab-item id="tab-kibana">
            <Kibana :nb-selected-files="nbSelectedFiles" />
          </v-tab-item>

          <v-tab-item id="tab-token">
            <Token />
          </v-tab-item>

          <v-tab-item v-if="isTester || isAdmin" id="tab-correspondent">
            <Correspondent v-if="isTester || isAdmin" />
          </v-tab-item>

          <v-tab-item v-if="isAdmin" id="tab-admin">
            <Admin v-if="isAdmin" />
          </v-tab-item>
        </v-tabs-items>
      </v-tabs>
    </v-card>
  </v-container>
</template>

<script>
import Profile from '~/components/space/Profile';
import Files from '~/components/space/Files';
import Kibana from '~/components/space/Kibana';
import Token from '~/components/space/Token';
import Admin from '~/components/space/Admin/Index';
import Correspondent from '~/components/space/Correspondent';

export default {
  components: {
    Profile,
    Files,
    Kibana,
    Token,
    Admin,
    Correspondent,
  },
  async fetch({ store, redirect, route }) {
    await store.dispatch('auth/checkAuth');
    const { user } = store.state.auth;

    if (!user) {
      redirect('/authenticate', { origin: route.fullPath });
    } else if (!user.metadata.acceptedTerms) {
      redirect('/terms');
    }

    await store.dispatch('getEstablishment');

    if (user.roles) {
      const isAdmin = user.roles.find(role => role === 'admin');

      if (isAdmin) {
        await store.dispatch('getEstablishments');
      }
    }
  },
  data() {
    return {
      activeTab: 'tab-profile',
      selectedFiles: [],
    };
  },
  computed: {
    user() { return this.$store.state.auth.user; },
    hasRoles() { return Array.isArray(this.user.roles) && this.user.roles.length > 0; },
    isAdmin() {
      if (this.hasRoles) {
        return this.user.roles.find(role => role === 'admin');
      }
      return null;
    },
    isTester() {
      if (this.hasRoles) {
        return this.user.roles.find(role => role === 'tester');
      }
      return null;
    },
    nbSelectedFiles() { return this.selectedFiles.length; },
  },
  methods: {
    refreshFileList() {
      this.$refs.filelist.refreshFiles();
    },

    deleteSelectedFiles() {
      this.$refs.filelist.deleteSelected();
    },

    deselectFiles() {
      this.$refs.filelist.deselectAll();
    },
  },
};
</script>

<style scoped>
.h640 { min-height: 640px; }
</style>
