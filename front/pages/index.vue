<template>
  <v-container fluid class="pa-0">
    <v-container fluid class="main-page">
      <v-layout
        fill-height
        align-center
        justify-center
        column
      >
        <img class="logo" alt="ezMESURE" src="/images/logo-ezMESURE-slogan.png">

        <v-layout
          :justify-center="$vuetify.breakpoint.mdAndDown"
          pa-4
          wrap
          shrink
        >
          <v-btn class="ma-2" outlined large color="primary" href="/kibana/">
            Tableaux de bord
          </v-btn>
          <v-btn class="ma-2" outlined large color="primary" exact to="/myspace">
            Mon compte
          </v-btn>
        </v-layout>
      </v-layout>
    </v-container>

    <v-container grid-list-xl class="my-6">
      <h3 class="display-1 grey--text text--darken-2 text-center my-3">
        Qu'est-ce qu'ezMESURE ?
      </h3>

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

    <h3 class="headline grey--text text--darken-2 text-center">
      Ce service est soutenu par :
    </h3>

    <v-container grid-list-lg class="my-4">
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
          <v-btn to="/partners" large class="white primary--text">
            Découvrez nos partenaires
          </v-btn>
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
      features: [
        {
          src: '/images/pres_visualizations.svg',
          title: 'Visualisations dynamiques en ligne',
          text: 'Les tableaux de bord dynamiques propulsés par Kibana facilitent la fouille et l\'analyse des données d\'usage.',
        },
        {
          src: '/images/pres_centralized.svg',
          title: 'Dépôt centralisé',
          text: 'ezMESURE est un entrepôt national centralisant les statistiques d\'usage de la documentation numérique des établissements de l\'enseignement supérieur et de la recherche (ESR).',
        },
        {
          src: '/images/pres_ezpaarse.svg',
          title: 'Données produites par ezPAARSE',
          text: 'Les données sont produites par les différentes installations d\'ezPAARSE dans les établissements de l\'ESR avant d\'être agrégées dans ezMESURE.',
        },
      ],
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
};
</script>


<style scoped>
.main-page {
  background-image: url('/images/dashboard_r10_light.jpg');
  background-size: cover;
  height: 100vh;
}
.logo {
  max-width: 100%
}
</style>
