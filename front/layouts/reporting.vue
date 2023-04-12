<template>
  <v-app>
    <SpaceMenu />

    <AppBar />

    <v-main>
      <ezr-provider
        :api-url="'/report/api/v1/'"
        :token="debugToken"
        :namespace-logo-url="logoBaseUrl"
        :namespace-label="namespaceLabel"
      >
        <v-card flat tile color="transparent">
          <nuxt />
        </v-card>
      </ezr-provider>
    </v-main>

    <AppSnackbar />
  </v-app>
</template>

<script>
import AppBar from '~/components/AppBar.vue';
import AppSnackbar from '~/components/AppSnackbar.vue';
import SpaceMenu from '~/components/space/SpaceMenu.vue';

export default {
  components: {
    AppBar,
    AppSnackbar,
    SpaceMenu,
  },
  head() {
    return this.$nuxtI18nHead({
      addDirAttribute: true,
      addSeoAttributes: true,
    });
  },
  data: () => ({
    debugToken: '',
    logoBaseUrl: '/api/assets/logos/',
    namespaceLabel: {
      en: 'institution | institutions',
      fr: 'établissement | établissements',
    },
  }),
};
</script>
