<template>
  <v-card :title="$t('harvest.sessions.reportsMenuTitle')">
    <template #append>
      <slot name="append" />
    </template>

    <template #text>
      <v-row>
        <v-col class="pt-0">
          <v-list-subheader>
            <v-icon icon="$mdi-file" size="small" />
            {{ $t('harvest.sessions.counts.reportTypes', props.session.reportTypes.length) }}
          </v-list-subheader>

          <v-chip
            v-for="[report, item] in items"
            :key="report"
            :text="item.text"
            :color="item.color"
            density="comfortable"
            variant="outlined"
            class="ml-1 mb-1"
          />
        </v-col>

        <v-col class="pt-0">
          <v-row>
            <v-col>
              <v-list-subheader>
                <v-icon icon="$mdi-calendar-range" size="small" />
                {{ $t('harvest.jobs.period') }}
              </v-list-subheader>

              {{ props.session.beginDate }} ~ {{ props.session.endDate }}
            </v-col>
          </v-row>

          <v-row>
            <v-col class="pt-0">
              <v-list-subheader>
                <v-icon icon="$mdi-numeric" size="small" />
                {{ $t('harvest.sessions.counts.counterVersions', props.session.allowedCounterVersions.length) }}
              </v-list-subheader>

              <v-chip
                v-for="version in props.session.allowedCounterVersions"
                :key="version"
                :text="version"
                :color="counterVersionsColors.get(version) || 'secondary'"
                size="small"
                density="comfortable"
                variant="flat"
                label
                class="mr-1 text-black"
              />
            </v-col>
          </v-row>
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

const { data: apiConfig } = await useApiConfig();

const items = computed(() => {
  const defaultIds = apiConfig.value?.counter.defaultHarvestedReports ?? [];
  const defaultIdsSet = new Set(defaultIds);

  return new Map(
    [
      ...defaultIds.map((id) => [id, {
        text: id.toUpperCase(),
        color: 'red',
      }]),
      ...props.session.reportTypes.map((id) => [id, {
        text: id.toUpperCase(),
        color: defaultIdsSet.has(id) ? undefined : 'blue',
      }]),
    ].sort(([a], [b]) => a.localeCompare(b)),
  );
});
</script>
