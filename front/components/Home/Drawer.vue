<template>
  <v-navigation-drawer
    v-model="drawer"
    app
    clipped
    temporary
    width="300px"
  >
    <v-list nav>
      <v-list-item exact link @click="drawer = !drawer; $vuetify.goTo('#what-does-ezmesure')">
        <v-list-item-icon>
          <v-icon>mdi-help-circle-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-title v-text="$t('home.whatDoesEzMESURE')" />
      </v-list-item>

      <v-list-item exact link @click="drawer = !drawer; $vuetify.goTo('#supported-by')">
        <v-list-item-icon>
          <v-icon>mdi-charity</v-icon>
        </v-list-item-icon>
        <v-list-item-title v-text="$t('menu.partners')" />
      </v-list-item>

      <v-list-item exact link href="/kibana/">
        <v-list-item-icon>
          <v-icon>mdi-view-dashboard-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-title v-text="$t('menu.dashboards')" />
      </v-list-item>

      <v-list-item exact link to="/myspace">
        <v-list-item-icon>
          <v-icon>mdi-account-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-title v-text="$t('menu.myspace')" />
      </v-list-item>

      <v-list-item exact link to="/contact-us">
        <v-list-item-icon>
          <v-icon>mdi-email-edit-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-title v-text="$t('menu.contact')" />
      </v-list-item>

      <v-list-item exact link to="/api-reference">
        <v-list-item-icon>
          <v-icon>mdi-api</v-icon>
        </v-list-item-icon>
        <v-list-item-title v-text="$t('menu.api')" />
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
export default {
  computed: {
    drawer: {
      get() { return this.$store.state.home.drawer; },
      set(newVal) { this.$store.dispatch('home/setDrawer', newVal); },
    },
  },
};
</script>
