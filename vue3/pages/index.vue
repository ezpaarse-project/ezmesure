<template>
  <v-container fluid class="main-cover py-4 px-0">
    <v-row class="justify-center">
      <img :src="logo" class="logo" alt="ezMESURE">
    </v-row>

    <v-container class="my-6">
      <v-row class="justify-center">
        <h3 class="text-h4 text-grey-darken-2 my-3">
          {{ t('home.whatDoesEzMESURE') }}
        </h3>
      </v-row>

      <v-row>
        <v-col v-for="(feature, i) in features" :key="i">
          <v-card class="elevation-10 text-center mx-auto" style="height: 100%;">
            <v-img
              :alt="feature.title"
              :src="feature.src"
              width="100%"
            />
            <v-card-text>
              <h2 class="text-subtitle-1 font-weight-bold mb-2">
                {{ feature.title }}
              </h2>
              <p class="mb-2">
                {{ feature.text }}
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-container class="my-6">
      <v-row class="justify-center">
        <h3 class="text-h5 text-grey-darken-2 my-3">
          {{ t('home.supportedBy') }}
        </h3>
      </v-row>

      <v-row>
        <v-col v-for="partnerLogo in logos" :key="partnerLogo.name">
          <v-card class="elevation-2 text-center mx-auto fill-height py-2">
            <!-- eslint-disable-next-line vuejs-accessibility/anchor-has-content-->
            <a :href="partnerLogo.link" :title="partnerLogo.name">
              <v-img
                :alt="partnerLogo.name"
                :src="partnerLogo.src"
                contain
                max-height="70px"
                max-width="100%"
              />
            </a>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="justify-center">
        <v-btn
          to="/partners"
          large
          class="white text-primary my-1"
        >
          {{ $t('home.discoverOurPartners') }}
        </v-btn>
      </v-row>
    </v-container>
  </v-container>
</template>

<script setup lang="ts">
import logo from '@/static/images/logo-ezMESURE-slogan.png';

const { t } = useI18n();

const logos = ref([
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
]);

const features = computed(() => [
  {
    src: '/images/pres_visualizations.svg',
    title: t('home.dynamicOnlineVisualizations'),
    text: t('home.dynamicOnlineVisualizationsText'),
  },
  {
    src: '/images/pres_centralized.svg',
    title: t('home.centralizedRepository'),
    text: t('home.centralizedRepositoryText'),
  },
  {
    src: '/images/pres_ezpaarse.svg',
    title: t('home.dataProducedByEzPAARSE'),
    text: t('home.dataProducedByEzPAARSEText'),
  },
]);
</script>

<style scoped lang="scss">
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
