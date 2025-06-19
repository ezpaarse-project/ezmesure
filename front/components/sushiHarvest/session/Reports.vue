<template>
  <v-card :title="$t('harvest.sessions.reportsMenuTitle')">
    <template #append>
      <slot name="append" />
    </template>

    <template #text>
      <v-row>
        <v-col class="pt-0">
          <v-list-subheader>
            <v-icon icon="mdi-file" size="small" />
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
                <v-icon icon="mdi-calendar-range" size="small" />
                {{ $t('harvest.jobs.period') }}
              </v-list-subheader>

              {{ props.session.beginDate }} ~ {{ props.session.endDate }}
            </v-col>
          </v-row>

          <v-row>
            <v-col class="pt-0">
              <v-list-subheader>
                <v-icon icon="mdi-numeric" size="small" />
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
                class="mr-1"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </template>
  </v-card>
</template>

<script setup>
import { DEFAULT_REPORTS_IDS } from '@/lib/sushi';

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

const items = computed(() => {
  const defIds = new Set(DEFAULT_REPORTS_IDS);

  return new Map(
    [
      ...DEFAULT_REPORTS_IDS.map((id) => [id.toLowerCase(), {
        text: id,
        color: 'red',
      }]),
      ...props.session.reportTypes.map((id) => [id, {
        text: id.toUpperCase(),
        color: defIds.has(id.toUpperCase()) ? undefined : 'blue',
      }]),
    ].sort(([a], [b]) => a.localeCompare(b)),
  );
});
</script>
