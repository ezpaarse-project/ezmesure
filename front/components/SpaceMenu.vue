<template>
  <v-navigation-drawer
    permanent
  >
    <v-list
      nav
      dense
    >
      <v-list-item to="/myspace/profile">
        <v-list-item-title>Profil</v-list-item-title>
      </v-list-item>

      <v-list-item to="/myspace/files">
        <v-list-item-title>Mes dépôts</v-list-item-title>
      </v-list-item>

      <v-list-item to="/myspace/kibana">
        <v-list-item-title>Identifiants Kibana</v-list-item-title>
      </v-list-item>

      <v-list-item to="/myspace/token">
        <v-list-item-title>Token d'authentification</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
export default {
  data() {
    return {
      sheet: false,
    };
  },
};
</script>
