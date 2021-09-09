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

    <v-toolbar-title class="pr-4" style="cursor: pointer;" @click="$vuetify.goTo('#main')">
      <v-avatar size="32">
        <v-img
          alt="Logo ezMESURE"
          src="/images/logo.png"
          contain
          transition="scale-transition"
          height="38px"
          width="38px"
          @click="$vuetify.goTo('#main')"
        />
      </v-avatar>
      ezMESURE
    </v-toolbar-title>

    <v-btn
      text
      class="d-none d-md-flex d-lg-flex d-xl-flex"
      @click="$vuetify.goTo('#what-does-ezmesure')"
      v-text="$t('home.whatDoesEzMESURE')"
    />
    <v-btn
      text
      class="d-none d-md-flex d-lg-flex d-xl-flex"
      @click="$vuetify.goTo('#supported-by')"
      v-text="$t('menu.partners')"
    />

    <v-spacer />

    <v-btn
      text
      to="/kibana/"
      class="d-none d-md-flex d-lg-flex d-xl-flex"
      v-text="$t('menu.dashboards')"
    />

    <v-btn
      color="green white--text"
      class="d-none d-md-flex d-lg-flex d-xl-flex"
      elevation="0"
      rounded
      to="/myspace"
      v-text="$t('menu.myspace')"
    />
  </v-app-bar>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { mapActions, mapState } from 'vuex';

export default {
  computed: mapState({
    drawer: state => state.home.drawer,
  }),
  methods: {
    ...mapActions({ setDrawer: 'home/setDrawer' }),
  },
};
</script>
