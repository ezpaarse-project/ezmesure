<template>
  <v-container fluid class="px-0 py-4 main-cover">
    <v-container fluid>
      <v-layout justify-center>
        <img class="logo" alt="ezMESURE" src="/images/logo-ezMESURE-slogan.png">
      </v-layout>
    </v-container>

    <v-container grid-list-xl class="my-6">
      <h3
        class="display-1 grey--text text--darken-2 text-center my-3"
        v-text="$t('home.whatDoesEzMESURE')"
      />

      <v-layout justify-center wrap>
        <v-flex v-for="(feature, i) in features" :key="i" d-flex shrink>
          <v-card class="elevation-10 overflow-hidden text-center mx-auto" light max-width="350px">
            <v-img
              :alt="feature.title"
              :aspect-ratio="2.3"
              :src="feature.src"
              width="100%"
            />
            <v-card-text>
              <h2 class="subtitle-1 font-weight-bold mb-2 text--primary" v-text="feature.title" />
              <p class="mb-2" v-text="feature.text" />
            </v-card-text>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>

    <h3
      class="headline grey--text text--darken-2 text-center"
      v-text="$t('home.supportedBy')"
    />

    <v-container grid-list-lg class="mt-4">
      <v-layout justify-center wrap>
        <v-flex v-for="logo in logos" :key="logo.name" d-flex shrink>
          <v-card width="250px" class="pa-3">
            <a :href="logo.link" :title="logo.name">
              <v-img
                :alt="logo.name"
                :src="logo.src"
                class="partner-logo"
                contain
                max-height="70px"
                max-width="100%"
              />
            </a>
          </v-card>
        </v-flex>

        <v-flex xs12 class="text-center">
          <v-btn
            :to="localePath('/partners')"
            large
            class="white primary--text"
            v-text="$t('home.discoverOurPartners')"
          />
        </v-flex>
      </v-layout>
    </v-container>
  </v-container>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      logos: [
        {
          name: 'CNRS',
          src: '/images/logo-cnrs.svg',
          link: 'http://www.cnrs.fr/',
        },
        {
          name: 'Couperin',
          src: '/images/logo-couperin.png',
          link: 'http://www.couperin.org/',
        },
        {
          name: 'MESRI',
          src: '/images/logo-mesri.jpg',
          link: 'http://www.enseignementsup-recherche.gouv.fr/',
        },
        {
          name: 'BSN',
          src: '/images/logo-bsn.png',
          link: 'http://www.bibliothequescientifiquenumerique.fr/',
        },
      ],
    };
  },
  computed: {
    features() {
      return [
        {
          src: '/images/pres_visualizations.svg',
          title: this.$t('home.dynamicOnlineVisualizations'),
          text: this.$t('home.dynamicOnlineVisualizationsText'),
        },
        {
          src: '/images/pres_centralized.svg',
          title: this.$t('home.centralizedRepository'),
          text: this.$t('home.centralizedRepositoryText'),
        },
        {
          src: '/images/pres_ezpaarse.svg',
          title: this.$t('home.dataProducedByEzPAARSE'),
          text: this.$t('home.dataProducedByEzPAARSEText'),
        },
      ];
    },
  },
};
</script>


<style scoped>
.main-cover {
  background-image: url('/images/dashboard_r10_light.jpg');
  background-size: initial;
  background-position-x: center;
  background-position-y: top;
  background-repeat: repeat;
}
.logo {
  max-width: 100%
}
</style>
