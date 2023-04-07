<template>
  <v-app>
    <SpaceMenu />

    <AppBar />

    <v-main>
      <ezr-provider
        :api-url="'/report/api/v1/'"
        :token="debugToken"
        :namespace-logo-url="logoUrl"
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
    debugToken: 'eDh26HWmlXz33DRA1z/DQgmsYH5e8n93lZdk8+ip4EtKGRbIy8EebIQhtRk1H7NcTo4neV4Ce00Awdz52K+R3sigN8UM55NFt1A5OnslnHmBn0293fD/e6ylTUR2jFKH5jg58f8NTSLkYVm5sBPySn+hSi37F/ix1plo6Q==',
    logoUrl: 'https://ezmesure.couperin.org/api/assets/logos/',
  }),
  computed: {
    namespaceLabel() {
      return {
        en: 'institution | institutions',
        fr: 'établissement | établissements',
      };
    },
  },
};
</script>
