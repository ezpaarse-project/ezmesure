<template>
  <v-container grid-list-lg>
    <h1 class="display-1">Nos {{ partners.length }} partenaires</h1>

    <v-layout row wrap align-center>
      <v-flex xs12 md6 lg4 v-for="(partner, index) in partners" :key="index">
        <v-card>
          <v-container fluid grid-list-lg>
            <v-layout row align-center>
              <v-flex xs7>
                <div>
                  <div class="title">{{ partner.organisation.label || partner.organisation.name }}</div>
                </div>
              </v-flex>
              <v-flex xs5>
                <v-card-media
                  :src="partner.organisation.logoUrl"
                  height="100px"
                  contain
                ></v-card-media>
              </v-flex>
            </v-layout>
          </v-container>

          <v-card-text>
            <div class="body-2">Correspondants</div>
            <div>Documentaire :
              <span v-if="partner.contact.doc">{{ partner.contact.doc.lastName }} {{ partner.contact.doc.firstName }}</span>
              <span v-else>non confirmé</span>
            </div>
            <div>Technique :
              <span v-if="partner.contact.tech">{{ partner.contact.tech.lastName }} {{ partner.contact.tech.firstName }}</span>
              <span v-else>non confirmé</span>
            </div>
            <div>
              <span v-if="partner.index.count">{{ partner.index.count }} <abbr title="Événements de Consultation">ECs</abbr> chargés dans ezMESURE</span>
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
