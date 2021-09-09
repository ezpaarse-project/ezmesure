<template>
  <v-container fluid pa-0>
    <v-layout
      id="main"
      row
      wrap
      align-center
      justify-center
      fill-height
      class="text-center main-cover"
      :style="`padding-top: ${padding}px;`"
    >
      <v-flex xs12 md6>
        <img
          class="logo"
          :width="$vuetify.breakpoint.name === 'xs' ? '70%' : ''"
          alt="ezMESURE"
          src="/images/logo-ezMESURE-slogan.png"
        >
      </v-flex>
      <v-flex xs12 md6>
        <img
          width="70%"
          class="dashboard"
          alt="ezMESURE Dashboard"
          src="/images/test.png"
        >
      </v-flex>
      <v-flex xs12 style="background-color: #eeeeee;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 200">
          <path
            fill="#9c27b0"
            d="M 0 198 C 485.5 198 485.5 110 971 110 L 971 110 L 971 0 L 0 0 Z"
            stroke-width="0"
          />
          <path
            fill="#9c27b0"
            d="M 970 110 C 1445 110 1445 0 1920 0 L 1920 0 L 1920 0 L 970 0 Z"
            stroke-width="0"
          />
        </svg>
      </v-flex>
    </v-layout>

    <v-layout
      id="what-does-ezmesure"
      row
      wrap
      align-center
      justify-center
      fill-height
      style="background-color: #eeeeee;"
    >
      <v-flex xs12>
        <h3
          class="display-1 text-sm-display-4 grey--text text--darken-2 text-center mb-5"
          v-text="$t('home.whatDoesEzMESURE')"
        />
      </v-flex>

      <v-flex v-for="(feature, i) in features" :key="i" d-flex shrink>
        <!-- eslint-disable-next-line max-len -->
        <v-card class="text-center ma-5" light max-width="350px" height="310px">
          <v-img
            :alt="feature.title"
            :aspect-ratio="2.3"
            :src="feature.src"
            width="100%"
          />
          <v-card-text>
            <h2
              class="subtitle-1 font-weight-bold mb-2 text--primary"
              v-text="feature.title"
            />
            <p class="mb-2" v-text="feature.text" />
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex xs12 style="background-color: #fff;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 200">
          <path
            fill="#eeeeee"
            d="M 0 198 C 485.5 198 485.5 110 971 110 L 971 110 L 971 0 L 0 0 Z"
            stroke-width="0"
          />
          <path
            fill="#eeeeee"
            d="M 970 110 C 1445 110 1445 0 1920 0 L 1920 0 L 1920 0 L 970 0 Z"
            stroke-width="0"
          />
        </svg>
      </v-flex>
    </v-layout>

    <v-layout
      id="supported-by"
      row
      wrap
      align-center
      align-content-start
      justify-center
      fill-height
      style="min-height: 900px;"
    >
      <v-flex xs12>
        <h3
          class="display-1 grey--text text--darken-2 text-center mb-5"
          v-text="$t('home.supportedBy')"
        />
      </v-flex>

      <v-flex v-for="logo in logos" :key="logo.name" d-flex shrink>
        <v-card class="text-center ma-5 pa-5" flat light width="250px">
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
          text
          to="/partners"
          large
          class="white primary--text"
          v-text="$t('home.discoverOurPartners')"
        />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  name: 'Home',
  layout: 'home',
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
    padding() {
      switch (this.$vuetify.breakpoint.name) {
        case 'md':
        case 'lg':
        case 'xl':
          return 100;
        default:
          return 0;
      }
    },
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
  background-color: #9c27b0;
  box-sizing: border-box;
}

.logo {
  max-width: 100%;
  filter: brightness(0) invert(1);
}

.dashboard {
  border-radius: 10px;
  box-shadow: 0px 0px 20px 3px rgba(0, 0, 0, 0.2);
}
</style>
