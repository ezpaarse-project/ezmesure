<template>
  <v-navigation-drawer
    v-model="drawer"
    app
    clipped
    fixed
    color="grey lighten-3"
    width="256"
  >
    <v-list v-if="isSpaceActive" v-model="item" nav>
      <v-list-item
        v-for="link in links"
        :key="link.title"
        router
        :to="{ path: `/myspace${link.href}` }"
        :exact="link.exact"
      >
        <v-list-item-content>
          <v-list-item-title class="grey--text text--darken-3 uppercase">
            {{ link.title }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <v-list v-if="isAdminActive" v-model="item" nav>
      <v-list-item
        v-for="link in administration"
        :key="link.title"
        router
        :to="{ path: `/admin${link.href}` }"
      >
        <v-list-item-content>
          <v-list-item-title class="grey--text text--darken-3 uppercase">
            {{ link.title }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
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
    isAdminActive() {
      return this.$auth?.user?.isAdmin && /^\/admin/i.test(this.$route.path);
    },
    isSpaceActive() {
      return !this.isAdminActive;
    },
    links() {
      const links = [
        { title: this.$t('menu.profile'), href: '/', exact: true },
        { title: this.$t('menu.myDeposits'), href: '/files' },
        { title: this.$t('menu.kibanIdentifiers'), href: '/kibana' },
        { title: this.$t('menu.authentificationToken'), href: '/token' },
        { title: this.$t('menu.myInstitutions'), href: '/institutions' },
      ];

      return links;
    },
    administration() {
      return [
        {
          title: this.$t('menu.activity'),
          href: '/activity',
        },
        {
          title: this.$t('menu.institutions'),
          href: '/institutions',
        },
        {
          title: this.$t('menu.repositories'),
          href: '/repositories',
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
      ];
    },
    drawer: {
      get() { return this.$store.state.drawer; },
      set(newVal) { this.$store.dispatch('SET_DRAWER', newVal); },
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
