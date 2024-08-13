<template>
  <v-card
    :title="texts.title"
    :subtitle="texts.subtitle"
  >
    <template #prepend>
      <v-icon :icon="icon.icon" :color="icon.color" />
    </template>

    <template #text>
      <v-divider />

      <v-row class="mt-2">
        <v-col>
          <p>{{ texts.desc }}</p>
        </v-col>
      </v-row>

      <v-row v-if="error">
        <v-col>
          <p class="text-subtitle-2">
            {{ $t('reason', { reason: error.reason }) }}
          </p>
          <p>{{ error.meaning }}</p>
        </v-col>
      </v-row>

      <v-row v-if="(modelValue?.exceptions?.length ?? 0) > 0">
        <v-col>
          <p class="text-subtitle-2">
            {{ $t('sushi.messagesFromEndpoint') }}
          </p>

          <SushiHarvestLogs
            :model-value="modelValue?.exceptions"
            item-value="Severity"
            item-text="Message"
          >
            <template #text="{ item: { raw }, value }">
              <span>{{ value }}</span>

              <span v-if="raw.Data" class="text-grey">
                ({{ raw.Data }})
              </span>

              <v-btn
                v-if="raw.Help_URL"
                :href="raw.Help_URL"
                :text="$('sushi.openHelpPage')"
                append-icon="mdi-open-in-new"
                color="accent"
                size="x-small"
                target="_blank"
                rel="noopener noreferrer"
              />
            </template>
          </SushiHarvestLogs>
        </v-col>
      </v-row>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
});

const { t, te } = useI18n();

const testedDate = useDateFormat(props.modelValue?.date, 'PPPpp');

const status = computed(() => props.modelValue?.status || 'untested');
const icon = computed(() => sushiStatus.get(status.value));
const texts = computed(() => {
  let key = 'institutions.sushi';
  switch (status.value) {
    case 'success':
      key = `${key}.connectionSuccessful`;
      break;
    case 'unauthorized':
      key = `${key}.connectionUnauthorized`;
      break;
    case 'failed':
      key = `${key}.connectionFailed`;
      break;
    default:
      key = `${key}.connectionUntested`;
      break;
  }
  return {
    title: t(`${key}.title`),
    desc: t(`${key}.desc`),
    subtitle: props.modelValue?.date
      ? t('institutions.sushi.testedOn', { date: testedDate.value })
      : undefined,
  };
});
const error = computed(() => {
  const errorCode = props.modelValue?.errorCode;
  if (!errorCode) {
    return undefined;
  }

  const reasonKey = `tasks.status.exceptions.${errorCode}`;
  const meaningKey = `tasks.status.exceptionMeaning.${errorCode}`;
  return {
    reason: te(reasonKey) ? t(reasonKey) : t('indeterminate'),
    meaning: te(meaningKey) ? t(meaningKey) : undefined,
  };
});
</script>
