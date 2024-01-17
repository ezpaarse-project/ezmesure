<template>
  <v-app-bar app clipped-left dark color="primary">
    <router-link
      to="/"
      :aria-label="$t('menu.homepage')"
      :title="$t('menu.homepage')"
    >
      <v-img
        alt="Logo ezMESURE"
        src="/images/logo.png"
        contain
        transition="scale-transition"
        height="38px"
        width="38px"
      />
    </router-link>

    <v-toolbar-title class="ml-3">
      ezMESURE

      <div
        v-if="currentInstance"
        class="text-overline"
        style="font-size: 0.5em !important; text-align: center; line-height: normal;"
      >
        {{ currentInstance }}
      </div>
    </v-toolbar-title>

    <v-toolbar-items class="hidden-sm-and-down">
      <v-btn text exact to="/partners">
        {{ $t('menu.partners') }}
      </v-btn>
      <v-btn text exact to="/api-reference">
        {{ $t('menu.api') }}
      </v-btn>
      <v-btn text exact to="/contact-us">
        {{ $t('menu.contact') }}
      </v-btn>
    </v-toolbar-items>

    <v-spacer />

    <v-toolbar-items class="hidden-sm-and-down">
      <v-btn text href="/kibana/">
        {{ $t('menu.dashboard') }}
      </v-btn>
      <v-btn text to="/myspace">
        {{ $t('menu.myspace') }}
      </v-btn>
      <v-btn v-if="isAdmin" text to="/admin">
        {{ $t('administration') }}
      </v-btn>

      <v-menu tile offset-y>
        <template #activator="{ on, value }">
          <v-btn
            text
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
    </v-toolbar-items>

    <v-bottom-sheet v-model="sheet">
      <template #activator="{ on }">
        <v-btn class="hidden-md-and-up" icon dark v-on="on">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-subheader>{{ $t('menu.navigateTo') }}</v-subheader>

        <v-list-item exact to="/" @click="sheet = false">
          <v-list-item-title>{{ $t('menu.home') }}</v-list-item-title>
        </v-list-item>
        <v-list-item href="/kibana/" @click="sheet = false">
          <v-list-item-title>{{ $t('menu.dashboard') }}</v-list-item-title>
        </v-list-item>
        <v-list-item exact to="/myspace" @click="sheet = false">
          <v-list-item-title>{{ $t('menu.myspace') }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="isAdmin" exact to="/admin" @click="sheet = false">
          {{ $t('administration') }}
        </v-list-item>
        <v-list-item exact to="/partners" @click="sheet = false">
          <v-list-item-title>{{ $t('menu.partners') }}</v-list-item-title>
        </v-list-item>
        <v-list-item exact to="/api-reference" @click="sheet = false">
          <v-list-item-title>{{ $t('menu.api') }}</v-list-item-title>
        </v-list-item>
        <v-list-item exact to="/contact-us" @click="sheet = false">
          <v-list-item-title>{{ $t('menu.contact') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-bottom-sheet>
  </v-app-bar>
</template>

<script>
export default {
  data() {
    return {
      sheet: false,
    };
  },
  computed: {
    isAdmin() {
      return this.$auth?.user?.isAdmin;
    },
    currentLocal() {
      return this.$i18n.locales.find((locale) => locale.code === this.$i18n.locale).name;
    },
    currentInstance() {
      return this.$config.currentInstance;
    },
  },
};
</script>
