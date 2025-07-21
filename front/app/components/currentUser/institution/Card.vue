<template>
  <v-card class="fill-height">
    <v-img
      :src="logoSrc"
      :style="{
        marginTop: '-1%',
        aspectRatio: `${LOGO_RATIO[0]}/${LOGO_RATIO[1]}`,
      }"
    />

    <v-card-title class="d-flex align-center">
      <div class="text-truncate">
        {{ institution.name }}
      </div>

      <template v-if="institution.validated">
        <v-spacer />

        <v-chip
          :text="$t('institutions.institution.validated')"
          density="comfortable"
          color="green"
          label
        />
      </template>
    </v-card-title>

    <v-card-subtitle class="d-flex align-center">
      {{ institution.acronym }}

      <template v-if="(membership.roles?.length ?? 0) > 0">
        <v-spacer />

        <div>{{ $t('myspace.roles') }}</div>

        <v-chip
          v-for="role in membership.roles"
          :key="role"
          :text="$t(`institutions.members.roleNames.${role}`)"
          :prepend-icon="roleColors.get(role)?.icon"
          :color="roleColors.get(role)?.color"
          size="small"
          label
          class="ml-1"
        />
      </template>
    </v-card-subtitle>

    <div v-if="allowedActions.institution" class="px-4 mt-2">
      <v-btn
        :text="$t('institutions.modify')"
        prepend-icon="mdi-pencil"
        color="blue"
        variant="flat"
        block
        @click="$emit('click:update', institution)"
      />
    </div>

    <div class="bg-primary">
      <div class="d-flex justify-space-evenly mt-2 py-2">
        <v-btn
          :text="$t('institutions.sushi.credentials')"
          :to="`/myspace/institutions/${institution.id}/sushi`"
          :disabled="!allowedActions.sushi"
          prepend-icon="mdi-key"
          variant="text"
        />

        <v-btn
          :text="$t('institutions.members.members')"
          :to="`/myspace/institutions/${institution.id}/members`"
          :disabled="!allowedActions.members"
          prepend-icon="mdi-account-multiple"
          variant="text"
        />

        <v-btn
          :text="$t('institutions.reports.reports')"
          :to="`/myspace/institutions/${institution.id}/reports`"
          :disabled="!allowedActions.reports"
          prepend-icon="mdi-file-chart-outline"
          variant="text"
        />
      </div>

      <v-tabs v-model="tab" grow>
        <v-tab prepend-icon="mdi-tab">
          {{ $t('myspace.spaces') }}
        </v-tab>
        <v-tab prepend-icon="mdi-database">
          {{ $t('myspace.repos') }}
        </v-tab>
        <v-tab prepend-icon="mdi-office-building">
          {{ $t('institutions.title') }}
        </v-tab>
      </v-tabs>
    </div>

    <v-card-text class="pt-0">
      <v-tabs-window v-model="tab">
        <v-tabs-window-item>
          <InstitutionSpaces
            :institution="fullInstitution"
            elevation="0"
            title=""
            prepend-icon=""
            user-spaced
          />
        </v-tabs-window-item>

        <v-tabs-window-item>
          <InstitutionRepositories
            :institution="fullInstitution"
            elevation="0"
            title=""
            prepend-icon=""
            user-spaced
          />
        </v-tabs-window-item>

        <v-tabs-window-item>
          <v-list density="compact" class="mt-4">
            <v-list-item
              v-for="field in fields"
              :key="field.name"
              :title="field.value"
              :prepend-icon="field.icon"
              :subtitle="$t(`institutions.institution.${field.name}`)"
              lines="two"
            />

            <v-list-item
              v-for="customProp in customProps"
              :key="customProp.fieldId"
              :title="customProp.value"
              prepend-icon="mdi-tag-outline"
              lines="two"
            >
              <template #subtitle>
                <CustomFieldLabel :model-value="customProp.field" />
              </template>
            </v-list-item>

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
                  v-tooltip:top="link.title"
                  :href="link.url"
                  :color="link.color"
                  :icon="link.icon"
                  variant="text"
                  density="comfortable"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>

<script setup>
import defaultLogo from '@@/static/images/logo-etab.png';

const LOGO_RATIO = [3, 1];

const props = defineProps({
  membership: {
    type: Object,
    required: true,
  },
});

defineEmits({
  'click:update': (institution) => !!institution,
});

const { t } = useI18n();

const tab = ref(0);

const institution = computed(() => props.membership.institution);

const fullInstitution = computed(() => ({
  ...institution.value,
  spaces: props.membership.spacePermissions.map(({ space }) => space),
  repositories: props.membership.repositoryPermissions.map(({ repository }) => repository),
}));

const logoSrc = computed(() => {
  if (institution.value.logoId) { return `/api/assets/logos/${institution.value.logoId}`; }
  return defaultLogo;
});

const fields = computed(() => [
  { name: 'group', value: institution.value.parentInstitution?.name, icon: 'mdi-home-city' },
  { name: 'homepage', value: institution.value.homepage, icon: 'mdi-web' },
  { name: 'city', value: institution.value.city, icon: 'mdi-map-marker' },
  { name: 'type', value: institution.value.type, icon: 'mdi-tag' },
  { name: 'uai', value: institution.value.uai, icon: 'mdi-identifier' },
  { name: 'role', value: institution.value.role, icon: 'mdi-shield' },
].filter(({ value }) => !!value));

const links = computed(() => [
  {
    title: t('social.website'),
    icon: 'mdi-web',
    color: '#616161',
    url: institution.value.websiteUrl,
  },
  {
    title: t('social.twitter'),
    icon: 'mdi-twitter',
    color: '#1da1f2',
    url: institution.value.social?.twitterUrl,
  },
  {
    title: t('social.linkedin'),
    icon: 'mdi-linkedin',
    color: '#0077b5',
    url: institution.value.social?.linkedinUrl,
  },
  {
    title: t('social.youtube'),
    icon: 'mdi-youtube',
    color: '#ff0000',
    url: institution.value.social?.youtubeUrl,
  },
  {
    title: t('social.facebook'),
    icon: 'mdi-facebook',
    color: '#1877f2',
    url: institution.value.social?.facebookUrl,
  },
].filter(({ url }) => !!url));

const customProps = computed(() => {
  if (!institution.value.customProps) { return []; }

  return institution.value.customProps.filter((prop) => !!prop.value && prop.field?.visible);
});

const allowedActions = computed(() => {
  const perms = new Set(props.membership.permissions);

  return {
    institution: perms.has('institution:write'),
    sushi: perms.has('sushi:read') || perms.has('sushi:write'),
    members: perms.has('memberships:read') || perms.has('memberships:write'),
    reports: perms.has('reporting:read') || perms.has('reporting:write'),
  };
});
</script>
