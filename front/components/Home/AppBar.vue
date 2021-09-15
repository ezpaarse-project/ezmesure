<template>
  <v-app-bar
    app
    clipped
    fixed
    dark
    color="primary"
    elevate-on-scroll
  >
    <v-app-bar-nav-icon
      class="d-flex d-sm-flex d-md-none"
      @click="setDrawer(!drawer)"
    />

    <v-toolbar-title class="pr-4" style="cursor: pointer;" @click="goTo('#main')">
      <v-avatar size="32">
        <v-img
          alt="Logo ezMESURE"
          src="/images/logo.png"
          contain
          transition="scale-transition"
          height="38px"
          width="38px"
          @click="goTo('#main')"
        />
      </v-avatar>
      ezMESURE
    </v-toolbar-title>

    <v-btn
      text
      class="d-none d-md-flex d-lg-flex d-xl-flex"
      @click="goTo('#what-does-ezmesure')"
      v-text="$t('home.whatDoesEzMESURE')"
    />
    <v-btn
      text
      class="d-none d-md-flex d-lg-flex d-xl-flex"
      @click="goTo('#supported-by')"
      v-text="$t('menu.partners')"
    />
    <v-btn
      text
      class="d-none d-md-flex d-lg-flex d-xl-flex"
      to="/contact-us"
      v-text="$t('menu.contact')"
    />

    <v-spacer />

    <v-btn
      text
      to="/kibana/"
      class="d-none d-md-flex d-lg-flex d-xl-flex mx-1"
      v-text="$t('menu.dashboards')"
    />

    <v-btn
      v-if="!user"
      color="primary darken-4 white--text"
      class="d-none d-md-flex d-lg-flex d-xl-flex mx-1"
      elevation="0"
      rounded
      to="/myspace"
      v-text="$t('menu.myspace')"
    />

    <v-menu
      v-else
      v-model="menu"
      bottom
      transition="scale-transition"
      origin="top left"
    >
      <template v-slot:activator="{ on }">
        <v-chip
          color="primary darken-4"
          class="d-none d-md-flex d-lg-flex d-xl-flex font-weight-medium"
          v-on="on"
        >
          <v-icon left>
            mdi-account-circle
          </v-icon>
          {{ (user.full_name || user.username).toUpperCase() }}
        </v-chip>
      </template>
      <v-list flat>
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

        <v-divider v-if="isAdmin" />
        <v-list-item v-if="isAdmin" href="/cockpit">
          <v-list-item-action>
            <v-icon>mdi-cog</v-icon>
          </v-list-item-action>
          <v-list-item-subtitle v-text="$t('administration')" />
        </v-list-item>

        <v-divider />

        <v-list-item href="/Shibboleth.sso/Logout?return=/logout">
          <v-list-item-action>
            <v-icon>mdi-logout</v-icon>
          </v-list-item-action>
          <v-list-item-subtitle v-text="$t('menu.logout')" />
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template v-slot:activator="{ on, value }">
        <v-btn
          text
          class="d-none d-md-flex d-lg-flex d-xl-flex mx-1"
          v-on="on"
        >
          {{ currentLocal }}
          <v-icon v-if="value">
            mdi-chevron-up
          </v-icon>
          <v-icon v-else>
            mdi-chevron-down
          </v-icon>
        </v-btn>
      </template>
      <v-list flat tile>
        <v-list-item
          v-for="locale in $i18n.locales"
          :key="locale.code"
          router
          ripple
          @click="$i18n.setLocale(locale.code)"
        >
          <v-img :src="require(`@/static/images/${locale.code}.png`)" width="24" class="mr-2" />
          <v-list-item-title>
            {{ locale.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { mapActions, mapState } from 'vuex';

export default {
  data: () => ({
    menu: false,
  }),
  computed: {
    ...mapState({
      drawer: state => state.home.drawer,
    }),
    user() { return this.$auth.user; },
    currentLocal() {
      return this.$i18n.locales.find(locale => locale.code === this.$i18n.locale).code;
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
  methods: {
    ...mapActions({ setDrawer: 'home/setDrawer' }),
    goTo(anchor) {
      if (this.$route.path === '/') {
        return this.$vuetify.goTo(anchor);
      }
      return this.$router.push(`/${anchor}`);
    },
  },
};
</script>
