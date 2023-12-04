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
        {{ partnerName }}
      </div>
    </v-card-text>

    <template v-if="hasContacts">
      <v-divider />

      <v-card-text class="text-center">
        <div class="subtitle-1">
          {{ $t('partners.correspondents') }}
        </div>

        <div v-for="contact in contacts" :key="contact.name">
          <v-tooltip right>
            <template #activator="{ on }">
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
      </v-card-text>
    </template>

    <template v-if="hasServices">
      <v-divider />

      <v-card-text class="text-center">
        <v-chip
          v-for="auto in servicesEnabled"
          :key="auto.label"
          :color="auto.color"
          small
          label
          dark
          class="mr-1 mb-1"
        >
          {{ $t(`partners.auto.${auto.label}`) }}
        </v-chip>
      </v-card-text>
    </template>

    <template v-if="hasLinks">
      <v-divider />

      <v-card-text class="text-center">
        <v-btn
          v-for="link in links"
          :key="link.icon"
          :href="link.url"
          :color="link.color"
          icon
        >
          <v-icon>{{ link.icon }}</v-icon>
        </v-btn>
      </v-card-text>
    </template>
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
    partnerName() {
      if (this.partner?.acronym) {
        return `${this.partner.name} (${this.partner.acronym})`;
      }
      return this.partner.name;
    },
    hasContacts() {
      return this.contacts.length > 0;
    },
    contacts() {
      if (!this.partnerName) {
        return [];
      }

      return this.partner.contacts
        .filter((user) => user.fullName)
        .map(
          (user) => {
            const roles = new Set(user.roles);

            if (roles.has('contact:doc')) {
              return {
                name: user.fullName,
                type: 'doc',
                icon: 'mdi-book',
                color: 'green',
                label: this.$t('partners.documentary'),
              };
            }

            if (roles.has('contact:tech')) {
              return {
                name: user.fullName,
                type: 'tech',
                icon: 'mdi-wrench',
                color: 'blue',
                label: this.$t('partners.technical'),
              };
            }

            return {
              name: user.fullName,
              type: 'unknown',
              icon: 'mdi-mdi',
              color: 'grey',
              label: '????',
            };
          },
        )
        .sort(
          ({ type }) => (type === 'doc' ? -1 : 1),
        );
    },
    servicesEnabled() {
      const servicesEnabled = this.partner?.servicesEnabled;
      if (!servicesEnabled) {
        return [];
      }

      return [
        { label: 'ezpaarse', color: 'teal', automated: servicesEnabled.ezpaarse },
        { label: 'ezreeport', color: 'blue', automated: servicesEnabled.ezreeport },
        { label: 'ezcounter', color: 'red', automated: servicesEnabled.ezcounter },
      ].filter((auto) => auto.automated);
    },
    hasServices() {
      return this.servicesEnabled.length > 0;
    },
    hasLinks() {
      return this.links.length > 0;
    },
    links() {
      const social = this.partner?.social;
      if (!social) {
        return [];
      }

      const links = [];

      if (social.website) {
        links.push({ icon: 'mdi-web', color: '#616161', url: social.website });
      }
      if (social.twitterUrl) {
        links.push({ icon: 'mdi-twitter', color: '#1da1f2', url: social.twitterUrl });
      }
      if (social.linkedinUrl) {
        links.push({ icon: 'mdi-linkedin', color: '#0077b5', url: social.linkedinUrl });
      }
      if (social.youtubeUrl) {
        links.push({ icon: 'mdi-youtube', color: '#ff0000', url: social.youtubeUrl });
      }
      if (social.facebookUrl) {
        links.push({ icon: 'mdi-facebook', color: '#1877f2', url: social.facebookUrl });
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
