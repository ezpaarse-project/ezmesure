<template>
  <v-navigation-drawer
    v-model="drawer"
    app
    clipped
    fixed
    color="grey lighten-3"
    width="256"
  >
    <v-list v-model="item" nav>
      <v-list-item
        v-for="link in links"
        :key="link.title"
        router
        :to="{ path: link.href }"
      >
        <v-list-item-content>
          <v-list-item-title class="grey--text text--darken-3 uppercase">
            {{ link.title }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-group
        v-if="isAdmin"
        :value="$nuxt.$route.name.indexOf(administration.title.toLowerCase()) !== -1"
      >
        <template #activator>
          <v-list-item-title
            class="grey--text text--darken-3 uppercase"
          >
            {{ administration.title }}
          </v-list-item-title>
        </template>

        <v-list-item
          v-for="child in administration.children"
          :key="child.title"
          router
          exact
          :to="{ path: `${administration.href}${child.href}` }"
          ripple
        >
          <v-list-item-title
            class="grey--text text--darken-3 uppercase pl-5"
          >
            {{ child.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list-group>
    </v-list>

    <template #append>
      <div class="pa-2">
        <v-btn
          block
          color="red lighten-2"
          dark
          :href="logoutUrl"
        >
          {{ $t('menu.logout') }}
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script>
export default {
  data() {
    return {
      item: 1,
      institution: null,
    };
  },
  computed: {
    logoutUrl() {
      return this.$config.shibbolethEnabled ? '/Shibboleth.sso/Logout?return=/logout' : '/logout';
    },
    links() {
      const links = [
        { title: this.$t('menu.profile'), href: '/myspace' },
        { title: this.$t('menu.myDeposits'), href: '/files' },
        { title: this.$t('menu.kibanIdentifiers'), href: '/kibana' },
        { title: this.$t('menu.authentificationToken'), href: '/token' },
        { title: this.$t('menu.myInstitutions'), href: '/my-institutions' },
      ];

      // Add reporting link if user have permission on at least one institution or if admin
      if (this.$auth?.user?.memberships?.some((m) => m.permissions.includes('reporting:read'))) {
        links.splice(2, 0, { title: this.$t('menu.report'), href: '/report' });
      }

      return links;
    },
    administration() {
      return {
        title: this.$t('menu.administration'),
        href: '/admin',
        children: [
          {
            title: this.$t('menu.activity'),
            href: '/activity',
          },
          {
            title: this.$t('menu.institutions'),
            href: '/institutions',
          },
          {
            title: this.$t('menu.users'),
            href: '/users',
          },
          {
            title: this.$t('menu.sushiEndpoints'),
            href: '/endpoints',
          },
          {
            title: this.$t('menu.adminReport'),
            href: '/report',
          },
        ],
      };
    },
    drawer: {
      get() { return this.$store.state.drawer; },
      set(newVal) { this.$store.dispatch('SET_DRAWER', newVal); },
    },
    isAdmin() {
      return this.$auth?.user?.isAdmin;
    },
  },
};
</script>

<style>
.uppercase {
  text-transform: uppercase !important;
  font-size: 0.8rem !important;
  font-weight: 500 !important;
}
</style>
