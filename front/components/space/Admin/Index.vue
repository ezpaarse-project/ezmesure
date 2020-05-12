<template>
  <section>
    <v-toolbar dense flat>
      <v-toolbar-title>
        Administration
      </v-toolbar-title>

      <v-spacer />

      <v-btn text @click="refreshAdminData">
        <v-icon left>
          mdi-refresh
        </v-icon>
        Actualiser
      </v-btn>
    </v-toolbar>

    <v-tabs v-model="activeTab" grow>
      <v-tab to="#tab-admin-establishment" router>
        Établissements
      </v-tab>
      <v-tab to="#tab-admin-users" router>
        Utlisateurs
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="activeTab">
      <v-tab-item id="tab-admin-establishment">
        <v-card flat>
          <v-card-text>
            <Establishments @refreshAdminData="refreshAdminData" />
          </v-card-text>
        </v-card>
      </v-tab-item>

      <v-tab-item id="tab-admin-users">
        <v-card flat>
          <v-card-text>users</v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </section>
</template>

<script>
import Establishments from '~/components/space/Admin/Establishments';

export default {
  components: {
    Establishments,
  },
  data() {
    return {
      activeTab: 'tab-admin-establishment',
    };
  },
  computed: {
    user() { return this.$store.state.auth.user; },
    establishments() { return this.$store.state.establishments; },
    hasRoles() { return Array.isArray(this.user.roles) && this.user.roles.length > 0; },
    isAdmin() {
      if (this.hasRoles) {
        return this.user.roles.find(role => role === 'admin');
      }
      return null;
    },
  },
  methods: {
    async refreshAdminData() {
      if (this.isAdmin) {
        await this.$store.dispatch('getEstablishments');
      }
    },
  },
};
</script>
