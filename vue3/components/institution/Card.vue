<template>
  <v-card :loading="loading && 'primary'">
    <v-img
      :src="logoSrc"
      :style="{
        marginTop: '-1%',
        aspectRatio: `${LOGO_RATIO[0]}/${LOGO_RATIO[1]}`,
      }"
    />

    <v-card-title class="d-flex align-center">
      {{ institution.name }}
    </v-card-title>

    <v-card-subtitle>{{ institution.acronym }}</v-card-subtitle>

    <div class="bg-primary">
      <div class="d-flex justify-space-evenly mt-2 py-2">
        <v-btn
          :text="$t('institutions.sushi.credentials')"
          :to="`/admin/institutions/${institution.id}/sushi`"
          prepend-icon="mdi-key"
          variant="text"
        />

        <v-btn
          :text="$t('institutions.members.members')"
          :to="`/admin/institutions/${institution.id}/members`"
          prepend-icon="mdi-account-multiple"
          variant="text"
        />

        <v-btn
          :text="$t('institutions.reports.reports')"
          :to="`/admin/institutions/${institution.id}/reports`"
          prepend-icon="mdi-file-chart-outline"
          variant="text"
        />
      </div>
    </div>

    <v-card-text>
      <v-list density="compact">
        <v-list-item
          v-for="field in fields"
          :key="field.name"
          :title="field.value"
          :prepend-icon="field.icon"
          :subtitle="$t(`institutions.institution.${field.name}`)"
          lines="two"
        />

        <v-list-item
          v-if="links.length > 0"
          :subtitle="$t('institutions.institution.links')"
          prepend-icon="mdi-link-variant"
          lines="two"
        >
          <template #title>
            <v-btn
              v-for="link in links"
              :key="link.icon"
              v-tooltip="link.title"
              :href="link.url"
              :color="link.color"
              :icon="link.icon"
              variant="text"
              density="comfortable"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-card-actions v-if="$slots.actions">
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<script setup>
import defaultLogo from '@/static/images/logo-etab.png';

const LOGO_RATIO = [3, 1];

const props = defineProps({
  institution: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();

const logoSrc = computed(() => {
  if (props.institution.logoId) { return `/api/assets/logos/${props.institution.logoId}`; }
  return defaultLogo;
});

const fields = computed(() => [
  { name: 'group', value: props.institution.parentInstitution?.name, icon: 'mdi-home-city' },
  { name: 'homepage', value: props.institution.homepage, icon: 'mdi-web' },
  { name: 'city', value: props.institution.city, icon: 'mdi-map-marker' },
  { name: 'type', value: props.institution.type, icon: 'mdi-tag' },
  { name: 'uai', value: props.institution.uai, icon: 'mdi-identifier' },
  { name: 'role', value: props.institution.role, icon: 'mdi-shield' },
].filter(({ value }) => !!value));

const links = computed(() => [
  {
    title: t('social.website'),
    icon: 'mdi-web',
    color: '#616161',
    url: props.institution.websiteUrl,
  },
  {
    title: t('social.twitter'),
    icon: 'mdi-twitter',
    color: '#1da1f2',
    url: props.institution.social?.twitterUrl,
  },
  {
    title: t('social.linkedin'),
    icon: 'mdi-linkedin',
    color: '#0077b5',
    url: props.institution.social?.linkedinUrl,
  },
  {
    title: t('social.youtube'),
    icon: 'mdi-youtube',
    color: '#ff0000',
    url: props.institution.social?.youtubeUrl,
  },
  {
    title: t('social.facebook'),
    icon: 'mdi-facebook',
    color: '#1877f2',
    url: props.institution.social?.facebookUrl,
  },
].filter(({ url }) => !!url));
</script>
