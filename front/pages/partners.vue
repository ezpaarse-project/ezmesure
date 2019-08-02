<template>
  <v-container fluid grid-list-lg>
    <h1 class="display-1 text-center my-4">
      Nos {{ partners.length }} partenaires
    </h1>

    <v-card max-width="800" class="mx-auto">
      <v-list three-line>
        <template v-for="(partner, index) in partners">
          <v-list-item :key="index">
            <v-list-item-avatar v-if="partner.organisation.logoUrl" tile size="80">
              <v-img :src="partner.organisation.logoUrl" contain />
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title>
                {{ partner.organisation.label || partner.organisation.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <v-chip v-if="partner.contact.doc" outlined label>
                  <v-icon left>
                    mdi-book
                  </v-icon>
                  {{ partner.contact.doc.lastName }} {{ partner.contact.doc.firstName }}
                </v-chip>
                <v-chip v-if="partner.contact.tech" outlined label>
                  <v-icon left>
                    mdi-wrench
                  </v-icon>
                  {{ partner.contact.tech.lastName }} {{ partner.contact.tech.firstName }}
                </v-chip>
                <v-chip v-if="partner.index.count" outlined label>
                  <v-icon left>
                    mdi-cloud-upload
                  </v-icon>
                  {{ partner.index.count | toLocaleString }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-divider :key="index" />
        </template>
      </v-list>
    </v-card>
  </v-container>
</template>

<script>
export default {
  async asyncData({ app }) {
    return {
      partners: await app.$axios.$get('/partners'),
    };
  },

  filters: {
    toLocaleString(value) {
      const n = parseInt(value, 10);
      if (Number.isNaN(n)) { return 0; }
      return n.toLocaleString();
    },
  },
};
</script>
