<template>
  <div>
    <v-container>
      <h1 class="display-1">Nos Partenaires</h1>

      <v-card class="px-2 py-4">
        <v-card-text>
          <v-layout row wrap align-center justify-space-around>
            <v-flex xs12 md3 class="text-xs-center" v-for="partner in partners" :key="partner.name">
              <a :href="partner.link">
                <img class="partner-logo mb-3" :alt="partner.name" :src="partner.logo">
              </a>
            </v-flex>
          </v-layout>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        actors: [
          {
            name: 'CNRS',
            link: 'http://www.cnrs.fr/',
            logo: '/images/logo-cnrs.jpg'
          },
          {
            name: 'Couperin',
            link: 'http://www.couperin.org',
            logo: '/images/logo-couperin.png'
          },
          {
            name: 'MENESR',
            link: 'http://www.enseignementsup-recherche.gouv.fr/cid20078/informations-pratiques-mesr.html',
            logo: '/images/logo-MENESR.jpg'
          },
          {
            name: 'BSN',
            link: 'http://www.bibliothequescientifiquenumerique.fr/',
            logo: '/images/logo-bsn.png'
          }
        ],
        partners: [
          {
            name: 'INSA Rouen',
            link: 'http://www.insa-rouen.fr/accueil?set_language=fr&cl=fr',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232163/bc84b35e-25da-11e7-9dcf-75ac42534abb.jpg'
          },
          {
            name: 'Université de Limoges',
            link: 'https://www.unilim.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232162/bc829812-25da-11e7-9a40-9cfa3013aa12.jpg'
          },
          {
            name: 'Bibliothèque inter-universitaire Montpellier',
            link: 'http://www.biu-montpellier.fr/florabium/servlet/LoginServlet',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232160/bc80f3cc-25da-11e7-94bc-35ea7555817c.png'
          },
          {
            name: 'Université Evry',
            link: 'http://www.univ-evry.fr/fr/index.html',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232165/bc910f1e-25da-11e7-9325-aae59b2185f3.png'
          },
          {
            name: 'Université de Lorraine',
            link: 'http://www.univ-lorraine.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232164/bc86a5c4-25da-11e7-990e-2909eecee3b1.png'
          },
          {
            name: 'Université de Toulouse 3',
            link: 'http://www.univ-tlse3.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232161/bc8141f6-25da-11e7-9162-8c82b32a9ff8.png'
          },
          {
            name: 'Université Sorbonne',
            link: 'https://www.utc.fr/innovation.html',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232166/bc990c64-25da-11e7-98c5-6cadd9b45b26.png'
          },
          {
            name: 'Université Rennes 2',
            link: 'https://www.univ-rennes2.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232170/bc9cbb16-25da-11e7-9945-25adea919e15.png'
          },
          {
            name: 'SciencesPo',
            link: 'http://www.sciencespo.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232167/bc9b913c-25da-11e7-8bbd-a104990e5da1.png'
          },
          {
            name: 'Université de Strasbourg',
            link: 'https://www.unistra.fr/index.php?id=accueil&utm_source=unistra_fr&utm_medium=unistra_fr_homepage',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232173/bcb272a8-25da-11e7-8fca-a9e6fdd5711e.png'
          },
          {
            name: 'Université de Franche Comté',
            link: 'http://www.univ-fcomte.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232171/bcab2cbe-25da-11e7-9101-42172f83157d.jpg'
          },
          {
            name: 'Université Montpellier',
            link: 'http://www.umontpellier.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232175/bcb3b53c-25da-11e7-8cb5-66809d9b0a54.png'
          },
          {
            name: 'Université Montpellier 3 ',
            link: 'http://www.univ-montp3.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232172/bcae60aa-25da-11e7-84ec-fd9dc0b86977.png'
          },
          {
            name: 'Université de Brest',
            link: 'https://www.univ-brest.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232177/bcb642fc-25da-11e7-8d14-205420131d80.png'
          },
          {
            name: 'Université de Grenoble',
            link: 'http://www.univ-grenoble-alpes.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232174/bcb32e96-25da-11e7-87a6-296391241f3a.png'
          },
          {
            name: 'Bibliothèque de l\'université d\'Orleans',
            link: 'https://scd.univ-orleans.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232178/bcc08032-25da-11e7-8140-0d40209ebc89.png'
          },
          {
            name: 'Université Paris 8',
            link: 'https://www.univ-orleans.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232179/bcc4c6ce-25da-11e7-999e-3ccdaa09bc31.png'
          },
          {
            name: 'Université de Polynesie Française',
            link: 'http://www.upf.pf/fr',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232182/bccae5cc-25da-11e7-8808-64e7fe9968c5.png'
          },
          {
            name: 'Université de Reims',
            link: 'http://www.univ-reims.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232181/bcca7b1e-25da-11e7-99e7-f7a57479e072.png'
          },
          {
            name: 'Sorbonne Universités',
            link: 'http://www.upmc.fr/fr/universite/sorbonne_universites.html',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232180/bcc8b36a-25da-11e7-97e1-576c5e7acc10.gif'
          },
          {
            name: 'Université Rennes 1',
            link: 'https://www.univ-rennes1.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232183/bccd2f80-25da-11e7-8373-2af6617d3d98.jpg'
          },
          {
            name: 'Université de technologie Belfort-Montbelliard',
            link: 'http://www.utbm.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25232184/bcd78bce-25da-11e7-9b6e-9b48b81b01b7.png'
          },
          {
            name: 'Université de Lyon 1',
            link: 'http://www.univ-lyon1.fr/',
            logo: 'https://cloud.githubusercontent.com/assets/5325656/25330085/a8f28800-28de-11e7-9a0d-ad86024ef1b5.png'
          },
          {
            name: 'Sciences Po Grenoble',
            link: 'http://www.sciencespo-grenoble.fr/',
            logo: 'https://user-images.githubusercontent.com/2981650/28271866-18bfde36-6b0a-11e7-9072-517b84321f65.png'
          }
        ]
      }
    }
  }
</script>

<style scoped>
  .partner-logo {
    max-width: 100%;
    max-height: 70px;
  }
</style>
