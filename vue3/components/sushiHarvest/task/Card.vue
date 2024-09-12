<template>
  <v-card>
    <template #text>
      <v-row>
        <DetailsField
          :label="$t('harvest.jobs.runningTime')"
          prepend-icon="mdi-timer-outline"
        >
          <v-chip
            :text="runningTime"
            variant="outlined"
            size="small"
          />
        </DetailsField>

        <DetailsField
          :label="$t('harvest.jobs.index')"
          :value="modelValue.index"
          prepend-icon="mdi-database-outline"
        >
          <code>{{ modelValue.index }}</code>
        </DetailsField>
      </v-row>

      <template v-if="modelValue.result">
        <v-row>
          <DetailsField
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

        <v-divider class="my-4" />

        <v-row>
          <v-col cols="4">
            <v-chip
              v-if="modelValue.result.inserted > 0"
              v-tooltip:top="$t('harvest.jobs.inserted')"
              :text="`${modelValue.result.inserted}`"
              prepend-icon="mdi-file-download"
              color="success"
              variant="outlined"
            />
          </v-col>
          <v-col cols="4">
            <v-chip
              v-if="modelValue.result.updated > 0"
              v-tooltip:top="$t('harvest.jobs.updated')"
              :text="`${modelValue.result.updated}`"
              prepend-icon="mdi-file-replace"
              color="info"
              variant="outlined"
            />
          </v-col>
          <v-col cols="4">
            <v-chip
              v-if="modelValue.result.failed > 0"
              v-tooltip:top="$t('harvest.jobs.failed')"
              :text="`${modelValue.result.failed}`"
              prepend-icon="mdi-file-alert"
              color="error"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </template>

      <template v-if="(modelValue.sushiExceptions?.length ?? 0) > 0">
        <v-row>
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

const runningTime = useTimeAgo(computed(() => props.modelValue.runningTime));

const error = computed(() => {
  const { errorCode } = props.modelValue;
  return {
    title: te(`tasks.status.exceptions.${errorCode}`) ? t(`tasks.status.exceptions.${errorCode}`) : undefined,
    meaning: te(`tasks.status.exceptions.meaning.${errorCode}`) ? t(`tasks.status.exceptions.meaning.${errorCode}`) : undefined,
  };
});
</script>
