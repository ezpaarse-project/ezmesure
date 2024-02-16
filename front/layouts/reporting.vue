<template>
  <v-app>
    <SpaceMenu />

    <AppBar />

    <v-main>
      <ezr-provider
        :token="ezrToken"
        :namespace-logo-url="logoBaseUrl"
        :namespace-label="namespaceLabel"
        namespace-icon="mdi-domain"
        api-url="/report/api/v1/"
      >
        <v-fade-transition>
          <v-alert v-if="$fetchState.error" type="error" class="ma-2" prominent>
            <div class="d-flex align-center">
              {{ $t('anErrorOccurred') }}

              <v-spacer />

              <v-btn @click="$fetch">
                {{ $t('retry') }}
                <v-icon right>
                  mdi-reload
                </v-icon>
              </v-btn>
            </div>
          </v-alert>

          <v-overlay
            v-else-if="$fetchState.pending"
            absolute
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
          </v-overlay>

          <v-card v-else flat tile color="transparent">
            <nuxt />
          </v-card>
        </v-fade-transition>
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
  async fetch() {
    this.ezrToken = (await this.$axios.$get('/profile/reporting_token'))?.token;
  },
  data: () => ({
    ezrToken: '',
    namespaceLabel: {
      en: 'institution | institutions',
      fr: 'établissement | établissements',
    },
  }),
  computed: {
    logoBaseUrl() {
      return `${window.location.origin}/api/assets/logos/`;
    },
  },
};
</script>
