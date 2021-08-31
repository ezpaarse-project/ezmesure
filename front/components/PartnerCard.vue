<template>
  <v-card width="350" height="100%" class="flexCard">
    <v-card-text class="text-center grow">
      <v-img
        v-if="partner.logoId"
        :src="`/api/assets/logos/${partner.logoId}`"
        contain
        height="100"
        class="mb-3"
      />

      <v-img
        v-else
        contain
        height="100"
        class="mb-3"
      />

      <div class="title">
        {{ partner.name }}
      </div>
      <div class="body-2">
        {{ indexCount }} <abbr :title="$t('partners.ecs')">ECs</abbr> {{ $t('partners.ecsLoaded') }}
      </div>
    </v-card-text>

    <v-divider />

    <v-card-text class="text-center">
      <div class="subtitle-1" v-text="$t('partners.correspondents')" />

      <template v-if="hasContacts">
        <div v-for="contact in contacts" :key="contact.name">
          <v-tooltip right>
            <template v-slot:activator="{ on }">
              <v-chip class="mb-1" :color="contact.color" outlined v-on="on">
                <v-icon small left>
                  {{ contact.icon }}
                </v-icon>
                {{ contact.name }}
              </v-chip>
            </template>

            <span>{{ contact.label }}</span>
          </v-tooltip>
        </div>
      </template>

      <div v-else class="font-italic">
        {{ $t('partners.noContacts') }}
      </div>
    </v-card-text>

    <v-divider />

    <v-card-text class="text-center">
      <div class="subtitle-1" v-text="$t('partners.automated')" />

      <template v-if="hasAutomation">
        <v-chip
          v-for="auto in automations"
          :key="auto.label"
          :color="auto.color"
          small
          label
          dark
          class="mr-1 mb-1"
        >
          {{ $t(`partners.auto.${auto.label}`) }}
        </v-chip>
      </template>

      <div v-else class="font-italic">
        {{ $t('partners.noAutomations') }}
      </div>
    </v-card-text>

    <v-divider />

    <v-card-text class="text-center">
      <div class="subtitle-1" v-text="$t('partners.links')" />

      <template v-if="hasLinks">
        <v-btn
          v-for="link in links"
          :key="link.icon"
          :href="link.url"
          :color="link.color"
          icon
        >
          <v-icon>{{ link.icon }}</v-icon>
        </v-btn>
      </template>

      <div v-else class="font-italic">
        {{ $t('partners.noLinks') }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  props: {
    partner: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    hasContacts() {
      return this.contacts.length > 0;
    },
    contacts() {
      const doc = this.partner?.docContactName;
      const tech = this.partner?.techContactName;
      const contacts = [];

      if (doc) {
        contacts.push({
          name: doc,
          type: 'doc',
          icon: 'mdi-book',
          color: 'green',
          label: this.$t('partners.documentary'),
        });
      }
      if (tech) {
        contacts.push({
          name: tech,
          type: 'tech',
          icon: 'mdi-wrench',
          color: 'blue',
          label: this.$t('partners.technical'),
        });
      }

      return contacts;
    },
    indexCount() {
      const n = parseInt(this.partner?.indexCount, 10);
      if (Number.isNaN(n)) { return '0'; }
      return n.toLocaleString();
    },
    automations() {
      return [
        { label: 'ezpaarse', color: 'teal', automated: this.partner?.auto?.ezpaarse },
        { label: 'ezmesure', color: 'purple', automated: this.partner?.auto?.ezmesure },
        { label: 'report', color: 'blue', automated: this.partner?.auto?.report },
        { label: 'sushi', color: 'red', automated: this.partner?.auto?.sushi },
      ].filter(auto => auto.automated);
    },
    hasAutomation() {
      return this.automations.length > 0;
    },
    hasLinks() {
      return this.links.length > 0;
    },
    links() {
      const links = [];

      if (this.partner?.website) {
        links.push({ icon: 'mdi-web', color: '#616161', url: this.partner?.website });
      }
      if (this.partner?.twitterUrl) {
        links.push({ icon: 'mdi-twitter', color: '#1da1f2', url: this.partner?.twitterUrl });
      }
      if (this.partner?.linkedinUrl) {
        links.push({ icon: 'mdi-linkedin', color: '#0077b5', url: this.partner?.linkedinUrl });
      }
      if (this.partner?.youtubeUrl) {
        links.push({ icon: 'mdi-youtube', color: '#ff0000', url: this.partner?.youtubeUrl });
      }
      if (this.partner?.facebookUrl) {
        links.push({ icon: 'mdi-facebook', color: '#1877f2', url: this.partner?.facebookUrl });
      }

      return links;
    },
  },
};
</script>

<style>
.flexCard {
  display: flex;
  flex-direction: column;
}
</style>
