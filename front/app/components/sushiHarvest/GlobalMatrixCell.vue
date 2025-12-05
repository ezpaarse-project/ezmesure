<template>
  <v-menu
    v-if="modelValue.total > 0"
    width="400"
    close-delay="200"
    open-on-hover
  >
    <template #activator="{ props: menu }">
      <ProgressCircularStack
        :model-value="bars"
        size="32"
        v-bind="menu"
      >
        <template #labels>
          <v-icon
            :icon="icon.icon"
            :color="icon.color"
            size="small"
          />
        </template>
      </ProgressCircularStack>
    </template>

    <v-card :title="title">
      <template #prepend>
        <v-icon :icon="icon.icon" :color="icon.color" />
      </template>

      <template v-if="modelValue.harvestedAt" #subtitle>
        <LocalDate :model-value="modelValue.harvestedAt" />
      </template>

      <template #text>
        <v-row>
          <v-col cols="6" class="pa-0">
            <DetailsField
              :label="`${$t('harvest.jobs.period')} :`"
              :value="`${modelValue.period.beginDate} ~ ${modelValue.period.endDate}`"
              prepend-icon="mdi-calendar-blank"
            />

            <DetailsField
              v-if="modelValue.counterVersions.length > 0"
              :label="`${$t('harvest.jobs.versions')} :`"
              prepend-icon="mdi-api"
            >
              <v-chip
                v-for="version in modelValue.counterVersions"
                :key="version"
                v-tooltip:top="$t('tasks.counterVersion', { version })"
                :text="version"
                :color="counterVersionsColors.get(version) || 'secondary'"
                density="compact"
                variant="flat"
                label
                class="ml-1 mt-1"
              />
            </DetailsField>
          </v-col>

          <DetailsField
            :label="`${$t('harvest.jobs.reportType')} :`"
            prepend-icon="mdi-file-document-outline"
            cols="6"
          >
            <v-chip
              v-for="report in modelValue.reportIds"
              :key="report"
              :text="report"
              density="compact"
              variant="outlined"
              label
              class="ml-1 mt-1 text-uppercase"
            />
          </DetailsField>

          <DetailsField
            :label="`${$t('status')} :`"
            prepend-icon="mdi-gauge"
            cols="12"
          >
            <ProgressLinearStack
              :model-value="bars"
              height="8"
              class="mt-2"
            />

            <v-list max-height="200" density="compact" slim>
              <template v-for="row in bars">
                <v-list-item
                  v-if="row.value > 0"
                  :key="row.key"
                  :title="row.label"
                >
                  <template #prepend>
                    <v-icon
                      v-if="row.icon"
                      :icon="row.icon"
                      :color="row.color"
                    />
                  </template>

                  <template #append>
                    {{ row.valueStr }}
                  </template>
                </v-list-item>
              </template>
            </v-list>
          </DetailsField>
        </v-row>

        <template v-if="items">
          <v-divider class="my-2" />

          <v-row>
            <v-col v-if="items.inserted > 0" cols="4">
              <v-chip
                v-tooltip:top="$t('harvest.jobs.inserted')"
                :text="`${items.inserted}`"
                prepend-icon="mdi-file-download"
                color="success"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col v-if="items.updated > 0" cols="4">
              <v-chip
                v-tooltip:top="$t('harvest.jobs.updated')"
                :text="`${items.updated}`"
                prepend-icon="mdi-file-replace"
                color="info"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col v-if="items.failed > 0" cols="4">
              <v-chip
                v-tooltip:top="$t('harvest.jobs.failed')"
                :text="`${modelValue.items.failed}`"
                prepend-icon="mdi-file-alert"
                color="error"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </template>

        <template v-if="modelValue.errors?.length > 0">
          <v-divider class="my-2" />

          <v-row>
            <DetailsField
              :label="$t('sushi.messagesFromEndpoint')"
              prepend-icon="mdi-alert-outline"
            >
              <v-list max-height="150" density="compact" slim>
                <v-list-item
                  v-for="errorCode in modelValue.errors"
                  :key="errorCode"
                >
                  {{ $te(`tasks.status.exceptions.${errorCode}`) ? $t(`tasks.status.exceptions.${errorCode}`) : errorCode }}

                  <v-icon
                    v-if="$te(`tasks.status.exceptionMeaning.${errorCode}`)"
                    v-tooltip:top="$t(`tasks.status.exceptionMeaning.${errorCode}`)"
                    icon="mdi-information-outline"
                    size="x-small"
                    color="info"
                    end
                    style="vertical-align: baseline;"
                  />
                </v-list-item>
              </v-list>
            </DetailsField>
          </v-row>
        </template>
      </template>
    </v-card>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
});

const { t, te, locale } = useI18n();

const icon = computed(() => harvestStatus.get(props.modelValue.status) ?? {
  icon: 'mdi-question',
  color: 'grey',
});

const title = computed(() => {
  const { status } = props.modelValue ?? {};
  const titleKey = `tasks.status.${status}`;
  return te(titleKey) ? t(titleKey) : status;
});

const items = computed(() => {
  const counts = Object.values(props.modelValue?.items ?? {}).filter((v) => v > 0);
  if (counts.length <= 0) {
    return undefined;
  }
  return props.modelValue.items;
});

const bars = computed(() => {
  const formatter = new Intl.NumberFormat(locale.value, { style: 'percent' });

  return Object.entries(props.modelValue.counts)
    .map(([status, count]) => {
      const key = `tasks.status.${status}`;
      const value = count / props.modelValue.total;

      return {
        key: status,
        label: te(key) ? t(key) : status,
        value,
        valueStr: formatter.format(value),
        ...harvestStatus.get(status),
      };
    })
    .filter(({ value }) => value > 0)
    .sort((barA, barB) => barB.value - barA.value);
});
</script>
