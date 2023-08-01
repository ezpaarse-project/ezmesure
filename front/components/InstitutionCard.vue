<template>
  <v-card class="d-flex flex-column" v-bind="$attrs">
    <v-sheet color="grey lighten-4" class="shrink d-flex justify-center">
      <v-responsive :aspect-ratio="3" max-width="400">
        <v-img
          v-if="logoSrc"
          :aspect-ratio="3"
          :src="logoSrc"
          contain
        />
        <span v-else class="font-weight-light text--secondary">
          {{ $t('institutions.noLogo') }}
        </span>
      </v-responsive>
    </v-sheet>

    <v-card-title>
      {{ institutionName }}
    </v-card-title>

    <v-list>
      <v-list-item v-for="field in fields" :key="field.name">
        <v-list-item-icon>
          <v-icon color="secondary">
            {{ field.icon }}
          </v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>{{ field.value }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ $t(`institutions.institution.${field.name}`) }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-list-item>
        <v-list-item-icon>
          <v-icon color="secondary">
            mdi-link-variant
          </v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title>
            <v-btn
              v-for="link in links"
              :key="link.icon"
              :href="link.url"
              :color="link.color"
              :title="link.title"
              icon
            >
              <v-icon>{{ link.icon }}</v-icon>
            </v-btn>
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ $t(`institutions.institution.links`) }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <v-spacer />

    <v-card-text class="d-flex align-center justify-space-between">
      <v-chip
        :color="institution.validated ? 'success' : 'default'"
        label
        outlined
        small
      >
        {{
          institution.validated
            ? $t('institutions.institution.validated')
            : $t('institutions.institution.notValidated')
        }}
      </v-chip>

      <slot name="menu" :permissions="permissions" :validated="validated" />
    </v-card-text>
  </v-card>
</template>

<script>
const defaultLogo = require('@/static/images/logo-etab.png');

export default {
  props: {
    institution: {
      type: Object,
      default: () => ({}),
    },
    membership: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      defaultLogo,
    };
  },
  computed: {
    institutionName() {
      let name = this.institution?.name;

      if (name && this.institution?.acronym) {
        name = `${name} (${this.institution.acronym})`;
      }

      return name;
    },
    fields() {
      const fields = [
        { name: 'homepage', value: this.institution.homepage, icon: 'mdi-web' },
        { name: 'city', value: this.institution.city, icon: 'mdi-map-marker' },
        { name: 'type', value: this.institution.type, icon: 'mdi-tag' },
        { name: 'uai', value: this.institution.uai, icon: 'mdi-identifier' },
        { name: 'role', value: this.institution.role, icon: 'mdi-shield' },
      ];

      return fields.filter((f) => f.value);
    },
    links() {
      const links = [
        {
          title: this.$t('social.website'),
          icon: 'mdi-web',
          color: '#616161',
          url: this.institution?.websiteUrl,
        },
        {
          title: this.$t('social.twitter'),
          icon: 'mdi-twitter',
          color: '#1da1f2',
          url: this.institution?.social?.twitterUrl,
        },
        {
          title: this.$t('social.linkedin'),
          icon: 'mdi-linkedin',
          color: '#0077b5',
          url: this.institution?.social?.linkedinUrl,
        },
        {
          title: this.$t('social.youtube'),
          icon: 'mdi-youtube',
          color: '#ff0000',
          url: this.institution?.social?.youtubeUrl,
        },
        {
          title: this.$t('social.facebook'),
          icon: 'mdi-facebook',
          color: '#1877f2',
          url: this.institution?.social?.facebookUrl,
        },
      ];

      return links.filter((f) => f.url);
    },
    logoSrc() {
      return this.institution?.logoId && `/api/assets/logos/${this.institution.logoId}`;
    },
    validated() {
      return !!this.institution?.validated;
    },
    permissions() {
      return new Set(
        Array.isArray(this.membership?.permissions)
          ? this.membership.permissions
          : [],
      );
    },
  },
};
</script>
