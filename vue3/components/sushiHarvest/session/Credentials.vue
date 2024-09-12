<template>
  <v-card
    :title="cardTitle"
    :subtitle="cardSubtitle"
    :loading="status === 'pending'"
  >
    <template #append>
      <slot name="append" />
    </template>

    <template #text>
      <v-row class="mt-2">
        <v-col cols="6" class="pt-0">
          <v-list density="compact" lines="2" max-height="300" class="pt-0">
            <v-list-subheader sticky>
              <v-icon icon="mdi-domain" />
              {{ $t('institutions.toolbarTitle', { count: institutions.length }) }}
            </v-list-subheader>

            <v-list-item
              v-for="item in institutions"
              :key="item.id"
              :title="item.name"
              :subtitle="item.acronym"
            />
          </v-list>
        </v-col>

        <v-divider vertical />

        <v-col cols="6" class="pt-0">
          <v-list density="compact" max-height="300" class="pt-0">
            <v-list-subheader sticky>
              <v-icon icon="mdi-api" />
              {{ $t('endpoints.toolbarTitle', { count: endpoints.length }) }}
            </v-list-subheader>

            <v-list-item
              v-for="item in endpoints"
              :key="item.id"
              :title="item.vendor"
            />
          </v-list>
        </v-col>
      </v-row>
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
  status: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();

const {
  status,
  data: credentials,
} = await useFetch(`/api/harvests-sessions/${props.session.id}/credentials`, {
  params: {
    include: ['endpoint', 'institution'],
  },
  watch: [props.status],
});

// eslint-disable-next-line no-underscore-dangle
const credentialsCount = computed(() => props.status?._count?.credentials ?? {});

const cardTitle = computed(() => {
  let count = credentialsCount.value.harvestable ?? '?';
  if (credentialsCount.value.harvestable !== credentialsCount.value.all) {
    count = `${count}/${credentialsCount.value.all ?? '?'}`;
  }
  return t('institutions.sushi.title', { count });
});

const cardSubtitle = computed(() => {
  if (credentialsCount.value.harvestable === credentialsCount.value.all) {
    return undefined;
  }
  return t('harvest.sessions.credentialsTooltip', credentialsCount.value);
});

const institutions = computed(() => {
  const map = new Map(
    credentials.value
      .map((credential) => [credential.institutionId, credential.institution]),
  );
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
});

const endpoints = computed(() => {
  const map = new Map(
    credentials.value
      .map((credential) => [credential.endpointId, credential.endpoint]),
  );
  return [...map.values()].sort((a, b) => a.vendor.localeCompare(b.name));
});
</script>
