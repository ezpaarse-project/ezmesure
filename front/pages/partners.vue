<template>
  <v-container grid-list-lg>
    <h1 class="display-1">Nos Partenaires</h1>

    <v-layout row wrap align-center>
      <v-flex xs12 md6 lg4 v-for="(partner, index) in partners" :key="index">
        <v-card>
          <v-container fluid grid-list-lg>
            <v-layout row align-center>
              <v-flex xs7>
                <div>
                  <div class="title">{{ partner.organisme }}</div>
                </div>
              </v-flex>
              <v-flex xs5>
                <v-card-media
                  :src="partner.logo"
                  height="100px"
                  contain
                ></v-card-media>
              </v-flex>
            </v-layout>
          </v-container>

          <v-card-text>
            <div class="body-2">Correspondants</div>
            <div>Documentaire :
              <span v-if="partner.correspondantDocumentaireNom">{{ partner.correspondantDocumentaireNom }} {{ partner.correspondantDocumentairePrenom }}</span>
              <span v-else>aucun</span>
            </div>
            <div>Technique :
              <span v-if="partner.correspondantTechniqueNom">{{ partner.correspondantTechniqueNom }} {{ partner.correspondantTechniquePrenom }}</span>
              <span v-else>aucun</span>
            </div>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  export default {
    async asyncData ({ app }) {
      return {
        partners: await app.$axios.$get('/partners')
      }
    }
  }
</script>
