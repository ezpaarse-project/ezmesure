<template>
  <v-card>
    <template #text>
      <v-row>
        <DetailsField
          :label="$t('harvest.jobs.startedAt')"
          :value="modelValue.startedAt"
          prepend-icon="mdi-timer-play-outline"
        >
          <LocalDate v-if="modelValue.startedAt" :model-value="modelValue.startedAt" format="PPPpp" />
        </DetailsField>

        <DetailsField
          :label="$t('harvest.jobs.updatedAt')"
          :value="modelValue.updatedAt"
          prepend-icon="mdi-update"
        >
          <LocalDate v-if="modelValue.updatedAt" :model-value="modelValue.updatedAt" format="PPPpp" />
        </DetailsField>
      </v-row>

      <v-row>
        <DetailsField
          :label="$t('harvest.jobs.index')"
          :value="modelValue.index"
          prepend-icon="mdi-database-outline"
        >
          <code>{{ modelValue.index }}</code>
        </DetailsField>
      </v-row>

      <v-row>
        <DetailsField
          v-if="modelValue.runningTime > 0"
          :label="$t('harvest.jobs.runningTime')"
          prepend-icon="mdi-timer-outline"
        >
          <v-chip
            :text="runningTime"
            variant="outlined"
            size="small"
          />
        </DetailsField>
      </v-row>

      <v-row>
        <DetailsField
          v-if="modelValue.result"
          :label="$t('harvest.jobs.coveredPeriods')"
          prepend-icon="mdi-calendar-blank"
        >
          <v-chip
            v-for="month in modelValue.result.coveredPeriods"
            :key="month"
            :text="month"
            density="comfortable"
            variant="outlined"
            size="small"
            class="mr-2"
          />
        </DetailsField>
      </v-row>

      <template v-if="result">
        <v-divider class="my-4" />

        <v-row>
          <v-col v-if="result.inserted > 0" cols="4">
            <v-chip
              v-tooltip:top="$t('harvest.jobs.inserted')"
              :text="`${result.inserted}`"
              prepend-icon="mdi-file-download"
              color="success"
              variant="outlined"
            />
          </v-col>
          <v-col v-if="result.updated > 0" cols="4">
            <v-chip
              v-tooltip:top="$t('harvest.jobs.updated')"
              :text="`${result.updated}`"
              prepend-icon="mdi-file-replace"
              color="info"
              variant="outlined"
            />
          </v-col>
          <v-col v-if="result.failed > 0" cols="4">
            <v-chip
              v-tooltip:top="$t('harvest.jobs.failed')"
              :text="`${result.failed}`"
              prepend-icon="mdi-file-alert"
              color="error"
              variant="outlined"
            />
          </v-col>

          <v-col v-if="result.total <= 0" cols="12">
            <v-empty-state
              :title="$t('harvest.jobs.noData')"
              icon="mdi-file-hidden"
              size="x-large"
            />
          </v-col>
        </v-row>
      </template>

      <template v-if="(modelValue.sushiExceptions?.length ?? 0) > 0">
        <v-row v-if="modelValue.errorCode">
          <DetailsField :label="$t('reason', { reason: '' })">
            <div>{{ error.title || $t('indeterminate') }}</div>
            <div>{{ error.meaning }}</div>
          </DetailsField>
        </v-row>

        <v-row>
          <DetailsField :label="$t('sushi.messagesFromEndpoint')">
            <SushiHarvestLogs :model-value="modelValue.sushiExceptions" item-value="severity" />
          </DetailsField>
        </v-row>
      </template>
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const { t, te } = useI18n();

const runningTime = useTimeAgo(() => props.modelValue.runningTime);

const result = computed(() => {
  const res = props.modelValue.result;
  if (!res) {
    return undefined;
  }

  return {
    inserted: res.inserted,
    updated: res.updated,
    failed: res.failed,
    total: res.inserted + res.updated + res.failed,
  };
});

const error = computed(() => {
  const { errorCode } = props.modelValue;
  return {
    title: te(`tasks.status.exceptions.${errorCode}`) ? t(`tasks.status.exceptions.${errorCode}`) : undefined,
    meaning: te(`tasks.status.exceptions.meaning.${errorCode}`) ? t(`tasks.status.exceptions.meaning.${errorCode}`) : undefined,
  };
});
</script>
