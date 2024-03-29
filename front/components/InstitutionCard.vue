<template>
  <v-card class="d-flex flex-column" v-bind="$attrs">
    <v-img
      :aspect-ratio="3"
      :src="logoSrc"
      contain
      max-height="100"
      class="mt-3"
      @error="logoLoadError = true"
    >
      <template #placeholder>
        <v-row
          class="fill-height ma-0"
          align="center"
          justify="center"
        >
          <v-progress-circular
            indeterminate
            color="grey lighten-1"
          />
        </v-row>
      </template>
    </v-img>

    <v-card-title>
      <div>
        {{ institutionName }}
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
      </div>
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

    <slot name="menu" :permissions="permissions" :validated="validated" />
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
      logoLoadError: false,
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
        { name: 'group', value: this.institution.parentInstitution?.name, icon: 'mdi-home-group' },
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
      if (this.institution?.logoId && !this.logoLoadError) {
        return `/api/assets/logos/${this.institution.logoId}`;
      }
      return defaultLogo;
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
