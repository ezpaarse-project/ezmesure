<template>
  <v-card style="height: 100%;">
    <v-img
      :src="partner.logoId ? `/api/assets/logos/${partner.logoId}` : undefined"
      height="100"
      class="mb-3"
    />

    <v-card-title class="text-wrap text-center">
      {{ partner.name }}
    </v-card-title>
    <v-card-subtitle class="text-center">
      {{ partner.acronym }}
    </v-card-subtitle>

    <v-card-text class="text-center">
      <template v-if="contacts.length > 0">
        <v-divider class="mb-3" />

        <div class="text-subtitle-1">
          {{ $t('partners.correspondents') }}
        </div>

        <div v-for="contact in contacts" :key="contact.name" class="mb-1">
          <v-chip
            v-tooltip="contact.label"
            :prepend-icon="contact.icon"
            :text="contact.name"
            :color="contact.color"
            variant="outlined"
          />
        </div>
      </template>

      <div v-if="services.length > 0">
        <v-divider class="my-4" />

        <v-chip
          v-for="service in services"
          :key="service.service"
          :text="service.label"
          :color="service.color"
          size="small"
          variant="flat"
          label
          class="mr-1 mb-1"
        />
      </div>

      <div v-if="socials.length > 0">
        <v-divider class="my-4" />

        <v-btn
          v-for="social in socials"
          :key="social.property"
          :color="social.color"
          :icon="social.icon"
          density="comfortable"
          variant="text"
          class="mr-1 mb-1"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  partner: {
    type: Object,
    required: true,
  },
});

const socialChips = new Map([
  ['website', { icon: 'mdi-web', color: '#616161' }],
  ['twitterUrl', { icon: 'mdi-twitter', color: '#1da1f2' }],
  ['linkedinUrl', { icon: 'mdi-linkedin', color: '#0077b5' }],
  ['youtubeUrl', { icon: 'mdi-youtube', color: '#ff0000' }],
  ['facebookUrl', { icon: 'mdi-facebook', color: '#1877f2' }],
]);

const { t } = useI18n();

const contacts = computed(
  () => props.partner.contacts
    .filter((user) => user.fullName)
    .map(
      (user) => {
        const roles = new Set(user.roles);

        if (roles.has('contact:doc')) {
          return {
            ...roleColors.get('contact:doc'),
            name: user.fullName,
            type: 'doc',
            label: t('partners.documentary'),
          };
        }

        if (roles.has('contact:tech')) {
          return {
            ...roleColors.get('contact:tech'),
            name: user.fullName,
            type: 'tech',
            label: t('partners.technical'),
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
    .sort(({ type }) => (type === 'doc' ? -1 : 1)),
);

const services = computed(() => {
  const { servicesEnabled } = props.partner;

  const items = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [service, color] of serviceColors) {
    const automated = servicesEnabled[service];
    if (automated) {
      items.push({
        service,
        label: t(`partners.auto.${service}`),
        color,
        automated,
      });
    }
  }

  return items;
});

const socials = computed(() => {
  const { social } = props.partner;

  const items = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [property, chip] of socialChips) {
    const url = social[property];
    if (url) {
      items.push({
        ...chip,
        property,
        url,
      });
    }
  }

  return items;
});
</script>
