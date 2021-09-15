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

      <v-list-group
        append-icon="mdi-chevron-down"
        prepend-icon="mdi-account-outline"
      >
        <template v-slot:activator>
          <v-list-item-title v-text="$t('menu.myspace')" />
        </template>

        <v-list-item
          v-for="link in links"
          :key="link.title"
          router
          :to="{ path: link.href }"
        >
          <v-list-item-action>
            <v-icon>{{ link.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-subtitle v-text="link.title" />
        </v-list-item>
      </v-list-group>

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

      <v-list-group
        append-icon="mdi-chevron-down"
        prepend-icon="mdi-translate"
      >
        <template v-slot:activator>
          <v-list-item-title>
            {{ currentLocal }}
          </v-list-item-title>
        </template>

        <v-list-item
          v-for="locale in $i18n.locales"
          :key="locale.code"
          @click="$i18n.setLocale(locale.code)"
        >
          <v-list-item-title
            class="body-2"
            v-text="locale.name"
          />
        </v-list-item>
      </v-list-group>
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
    currentLocal() {
      return this.$i18n.locales.find(locale => locale.code === this.$i18n.locale).name;
    },
    links() {
      return [
        { title: this.$t('menu.profile'), href: '/myspace', icon: 'mdi-account-circle' },
        { title: this.$t('menu.myDeposits'), href: '/files', icon: 'mdi-file-multiple' },
        { title: this.$t('menu.kibanIdentifiers'), href: '/kibana', icon: 'mdi-card-account-details-outline' },
        { title: this.$t('menu.authentificationToken'), href: '/token', icon: 'mdi-key' },
      ];
    },
    hasRoles() {
      return Array.isArray(this.$auth?.user?.roles) && this.$auth.user.roles.length > 0;
    },
    isAdmin() {
      if (this.hasRoles) {
        return this.$auth.user.roles.some(role => ['admin', 'superuser'].includes(role));
      }
      return false;
    },
  },
};
</script>
