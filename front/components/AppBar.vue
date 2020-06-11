<template>
  <v-app-bar app clipped-left dark color="primary">
    <router-link
      :to="localePath('/')"
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
    </v-toolbar-title>

    <v-spacer />

    <v-toolbar-items class="hidden-sm-and-down">
      <v-btn text exact :to="localePath('/')" v-text="$t('menu.home')" />
      <v-btn text href="/kibana/" v-text="$t('menu.dashboard')" />
      <v-btn text :to="localePath('/myspace')" v-text="$t('menu.myspace')" />
      <v-btn text exact :to="localePath('/partners')" v-text="$t('menu.partners')" />
      <v-btn text exact :to="localePath('/api')" v-text="$t('menu.api')" />

      <v-menu tilev-model="chooseLanguage" offset-y>
        <template v-slot:activator="{ on, value }">
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
            :to="switchLocalePath(locale.code)"
            ripple
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
      <template v-slot:activator="{ on }">
        <v-btn class="hidden-md-and-up" icon dark v-on="on">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-subheader v-text="$t('menu.navigateTo')" />

        <v-list-item exact :to="localePath('/')" @click="sheet = false">
          <v-list-item-title v-text="$t('menu.home')" />
        </v-list-item>
        <v-list-item href="/kibana/" @click="sheet = false">
          <v-list-item-title v-text="$t('menu.dashboard')" />
        </v-list-item>
        <v-list-item exact :to="localePath('/myspace')" @click="sheet = false">
          <v-list-item-title v-text="$t('menu.myspace')" />
        </v-list-item>
        <v-list-item exact :to="localePath('/partners')" @click="sheet = false">
          <v-list-item-title v-text="$t('menu.partners')" />
        </v-list-item>
        <v-list-item exact :to="localePath('/api')" @click="sheet = false">
          <v-list-item-title v-text="$t('menu.api')" />
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
    currentLocal() {
      return this.$i18n.locales.find(locale => locale.code === this.$i18n.locale).name;
    },
  },
};
</script>
