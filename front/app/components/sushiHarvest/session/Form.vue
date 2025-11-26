<template>
  <LoaderCard v-if="initialLoading" />

  <v-card v-else-if="institutionsError || endpointsError">
    <v-empty-state
      :title="getErrorMessage(institutionsError || endpointsError, t('anErrorOccurred'))"
      icon="mdi-alert-circle"
    >
      <template #actions>
        <v-btn
          :text="$t('retry')"
          :loading="initialLoading"
          variant="elevated"
          color="secondary"
          @click="initialLoading = true; Promise.all([institutionsRefresh, endpointsRefresh])"
        />

        <v-spacer />

        <slot name="actions" :loading="saving" />
      </template>
    </v-empty-state>
  </v-card>

  <v-card
    v-else
    :title="isEditing ? $t('harvest.sessions.form.title:update') : $t('harvest.sessions.form.title:add')"
    :subtitle="modelValue?.id"
    prepend-icon="mdi-tractor"
  >
    <template #text>
      <v-row>
        <v-col>
          <v-form
            id="sessionForm"
            ref="formRef"
            v-model="valid"
            @submit.prevent="save()"
          >
            <v-card
              :title="$t('harvest.sessions.form.credentials.title')"
              prepend-icon="mdi-key"
              variant="outlined"
            >
              <template #text>
                <v-row>
                  <v-col>
                    <p>
                      {{ $t('harvest.sessions.form.credentials.intro') }}
                    </p>
                  </v-col>
                </v-row>

                <v-row class="mb-2">
                  <v-col cols="12" md="6" :class="mdAndUp ? ['border-e-thin', 'border-opacity'] : undefined">
                    <v-list
                      v-model:selected="institutionIds"
                      lines="two"
                      density="compact"
                      height="490"
                      select-strategy="leaf"
                      class="credentials-list pa-0"
                    >
                      <div class="credentials-list-header">
                        <v-list-subheader>
                          <v-icon icon="mdi-domain" />
                          {{ $t('harvest.sessions.form.credentials.institutions.title', { count: institutionsCount }) }}

                          <v-spacer />

                          <div style="width: 250px">
                            <v-text-field
                              v-model="institutionsSearch"
                              :placeholder="$t('search')"
                              append-inner-icon="mdi-magnify"
                              variant="outlined"
                              density="compact"
                              hide-details
                            />
                          </div>
                        </v-list-subheader>

                        <v-list-item
                          :title="$t('harvest.sessions.form.credentials.institutions.all')"
                          :active="isAllInstitutions"
                          @click="isAllInstitutions = !isAllInstitutions"
                        >
                          <template #prepend>
                            <v-list-item-action start>
                              <v-switch
                                :model-value="isAllInstitutions"
                                color="primary"
                                hide-details
                                readonly
                              />
                            </v-list-item-action>
                          </template>
                        </v-list-item>

                        <v-divider v-if="!isAllInstitutions" class="border-dashed border-opacity-25 py-1" />
                      </div>

                      <div v-show="!isAllInstitutions">
                        <v-list-item
                          v-for="item in institutions"
                          :key="item.id"
                          :value="item.id"
                          :title="item.name"
                          :subtitle="item.acronym"
                        >
                          <template #prepend="{ isSelected, select }">
                            <v-list-item-action start>
                              <v-checkbox-btn
                                :model-value="isSelected"
                                color="primary"
                                @update:model-value="select"
                              />
                            </v-list-item-action>

                            <InstitutionAvatar :institution="item" />
                          </template>
                        </v-list-item>
                      </div>
                    </v-list>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-list
                      v-model:selected="endpointIds"
                      lines="two"
                      density="compact"
                      height="490"
                      select-strategy="leaf"
                      class="credentials-list pa-0"
                    >
                      <div class="credentials-list-header">
                        <v-list-subheader>
                          <v-icon icon="mdi-api" />
                          {{ $t('harvest.sessions.form.credentials.endpoints.title', { count: endpointsCount }) }}

                          <v-spacer />

                          <div style="width: 250px">
                            <v-text-field
                              v-model="endpointsSearch"
                              :placeholder="$t('search')"
                              append-inner-icon="mdi-magnify"
                              variant="outlined"
                              density="compact"
                              hide-details
                            />
                          </div>
                        </v-list-subheader>

                        <v-list-item
                          :title="$t('harvest.sessions.form.credentials.endpoints.all')"
                          :active="isAllEndpoints"
                          @click="isAllEndpoints = !isAllEndpoints"
                        >
                          <template #prepend>
                            <v-list-item-action start>
                              <v-switch
                                :model-value="isAllEndpoints"
                                color="primary"
                                hide-details
                                readonly
                              />
                            </v-list-item-action>
                          </template>
                        </v-list-item>

                        <v-divider v-if="!isAllEndpoints" class="border-dashed border-opacity-25 py-1" />
                      </div>

                      <div v-show="!isAllEndpoints">
                        <v-list-item
                          v-for="item in endpoints"
                          :key="item.id"
                          :value="item.id"
                          :title="item.vendor"
                        >
                          <template #prepend="{ isSelected, select }">
                            <v-list-item-action start>
                              <v-checkbox-btn
                                :model-value="isSelected"
                                color="primary"
                                @update:model-value="select"
                              />
                            </v-list-item-action>
                          </template>

                          <template #subtitle>
                            <SushiEndpointVersionsChip
                              :model-value="item"
                              size="small"
                              density="compact"
                            />
                          </template>
                        </v-list-item>
                      </div>
                    </v-list>
                  </v-col>
                </v-row>

                <v-row no-gutters>
                  <v-col>
                    <p>
                      {{ $t('harvest.sessions.form.credentials.allowFaulty.description') }}
                    </p>

                    <v-checkbox
                      v-model="allowFaulty"
                      :label="$t('harvest.sessions.form.credentials.allowFaulty.title')"
                      color="primary"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>

            <v-card
              :title="$t('harvest.sessions.form.reports.title')"
              prepend-icon="mdi-download"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="6">
                    <MonthPickerField
                      v-model="beginDate"
                      :label="`${$t('harvest.sessions.form.reports.beginDate')} *`"
                      :max="endDate"
                      variant="underlined"
                      prepend-icon="mdi-calendar-start"
                      required
                    />
                  </v-col>

                  <v-col cols="6">
                    <MonthPickerField
                      v-model="endDate"
                      :label="`${$t('harvest.sessions.form.reports.endDate')} *`"
                      :min="beginDate"
                      variant="underlined"
                      prepend-icon="mdi-calendar-end"
                      required
                    />
                  </v-col>
                </v-row>

                <v-row class="mb-2">
                  <v-col cols="12" md="6" :class="mdAndUp ? ['border-e-thin', 'border-opacity'] : undefined">
                    <v-list
                      v-model:selected="counterVersions"
                      lines="one"
                      density="compact"
                      height="250"
                      select-strategy="leaf"
                      class="pa-0"
                    >
                      <v-list-subheader sticky>
                        <v-icon icon="mdi-numeric" size="small" />
                        {{ $t('harvest.sessions.counts.counterVersions', counterVersions.length) }}
                      </v-list-subheader>

                      <v-list-item
                        v-for="item in versionsList"
                        :key="item"
                        :value="item"
                      >
                        <template #prepend="{ isSelected, select }">
                          <v-list-item-action start>
                            <v-checkbox-btn
                              :model-value="isSelected"
                              color="primary"
                              @update:model-value="select"
                            />
                          </v-list-item-action>
                        </template>

                        <template #title>
                          <v-chip
                            :text="item"
                            :color="counterVersionsColors.get(item) || 'secondary'"
                            variant="flat"
                            density="compact"
                            label
                          />
                        </template>
                      </v-list-item>
                    </v-list>

                    <v-menu
                      v-model="isAdditionalReportOpen"
                      :close-on-content-click="false"
                      min-width="200px"
                      width="500px"
                      @update:model-value="resetVersionForm()"
                    >
                      <template #activator="{ props: menu }">
                        <v-btn
                          :text="$t('endpoints.addCustomVersion')"
                          color="secondary"
                          prepend-icon="mdi-plus"
                          block
                          class="mt-2"
                          v-bind="menu"
                        />
                      </template>

                      <v-card>
                        <template #text>
                          <v-row>
                            <v-col>
                              <v-form
                                id="additionalVersionForm"
                                ref="additionalVersionForm"
                                @submit.prevent="
                                  counterVersions.push(customVersion);
                                  isCustomVersionOpen = false
                                "
                              >
                                <p>
                                  {{ $t('endpoints.customVersionDesc') }}
                                </p>

                                <v-text-field
                                  v-model="customVersion"
                                  :label="$t('endpoints.customVersion')"
                                  :rules="versionRules"
                                  prepend-icon="mdi-numeric"
                                  variant="underlined"
                                  hide-details="auto"
                                  autofocus
                                />
                              </v-form>
                            </v-col>
                          </v-row>
                        </template>

                        <template #actions>
                          <v-spacer />

                          <v-btn
                            :text="$t('add')"
                            :disabled="!customVersion"
                            color="success"
                            prepend-icon="mdi-plus"
                            variant="text"
                            type="submit"
                            form="additionalVersionForm"
                          />
                        </template>
                      </v-card>
                    </v-menu>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-list
                      v-model:selected="reportTypes"
                      lines="one"
                      density="compact"
                      height="250"
                      select-strategy="leaf"
                      class="pa-0"
                    >
                      <v-list-subheader sticky>
                        <v-icon icon="mdi-file" size="small" />
                        {{ $t('harvest.sessions.counts.reportTypes', reportTypes.length) }}
                      </v-list-subheader>

                      <v-list-item
                        v-for="item in reportsList"
                        :key="item"
                        :value="item"
                        :title="item"
                      >
                        <template #prepend="{ isSelected, select }">
                          <v-list-item-action start>
                            <v-checkbox-btn
                              :model-value="isSelected"
                              color="primary"
                              @update:model-value="select"
                            />
                          </v-list-item-action>
                        </template>
                      </v-list-item>
                    </v-list>

                    <v-menu
                      v-model="isCustomVersionOpen"
                      :close-on-content-click="false"
                      min-width="200px"
                      width="500px"
                      @update:model-value="resetReportForm()"
                    >
                      <template #activator="{ props: menu }">
                        <v-btn
                          :text="$t('endpoints.addAdditionalReport')"
                          color="secondary"
                          prepend-icon="mdi-plus"
                          block
                          class="mt-2"
                          v-bind="menu"
                        />
                      </template>

                      <v-card>
                        <template #text>
                          <v-row>
                            <v-col>
                              <v-form
                                id="additionalReportForm"
                                ref="additionalReportForm"
                                @submit.prevent="
                                  reportsList.push(additionalReport);
                                  isCustomVersionOpen = false
                                "
                              >
                                <p>
                                  {{ $t('endpoints.addAdditionalReportDesc') }}
                                </p>

                                <v-text-field
                                  v-model="additionalReport"
                                  :label="$t('harvest.jobs.reportType')"
                                  prepend-icon="mdi-file"
                                  variant="underlined"
                                  hide-details="auto"
                                  autofocus
                                />
                              </v-form>
                            </v-col>
                          </v-row>
                        </template>

                        <template #actions>
                          <v-spacer />

                          <v-btn
                            :text="$t('add')"
                            :disabled="!additionalReport"
                            color="success"
                            prepend-icon="mdi-plus"
                            variant="text"
                            type="submit"
                            form="additionalReportForm"
                          />
                        </template>
                      </v-card>
                    </v-menu>
                  </v-col>
                </v-row>

                <v-row no-gutters>
                  <v-col cols="12">
                    <v-checkbox
                      v-model="downloadUnsupported"
                      :label="$t('harvest.sessions.form.reports.downloadUnsupported')"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="6">
                    <v-checkbox
                      v-model="useValidation"
                      :label="$t('harvest.sessions.form.reports.useValidation')"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="6">
                    <v-checkbox
                      v-model="useCache"
                      :label="$t('harvest.sessions.form.reports.useCache')"
                      color="primary"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>

            <v-card
              :title="$t('harvest.sessions.settings.title')"
              prepend-icon="mdi-cog"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="id"
                      :label="`${$t('identifier')} *`"
                      :rules="[v => !!v || $t('fieldIsRequired')]"
                      :disabled="isEditing"
                      prepend-icon="mdi-rename"
                      variant="underlined"
                      hide-details="auto"
                      @update:model-value="hasIdChanged = true"
                    />
                  </v-col>

                  <v-col cols="6">
                    <v-checkbox
                      v-model="sendEndMail"
                      :label="$t('harvest.sessions.settings.sendEndMail')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="6">
                    <v-text-field
                      :model-value="`${timeout}`"
                      :label="$t('harvest.sessions.settings.timeout')"
                      :min="0"
                      :rules="[(v) => !Number.isNaN(Number.parseInt(v, 10)) || $t('invalidFormat')]"
                      type="number"
                      prepend-icon="mdi-timer"
                      variant="underlined"
                      hide-details="auto"
                      @update:model-value="timeout = Number.parseInt($event, 10)"
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>
          </v-form>
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" :loading="saving" />

      <v-btn
        :text="!isEditing ? $t('add') : $t('save')"
        :prepend-icon="!isEditing ? 'mdi-plus' : 'mdi-content-save'"
        :disabled="!isValid"
        :loading="saving"
        type="submit"
        form="sessionForm"
        variant="elevated"
        color="primary"
      />
    </template>
  </v-card>
</template>

<script setup>
import { differenceInYears, parse as parseDate } from 'date-fns';

import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_REPORTS_IDS, SUPPORTED_COUNTER_VERSIONS } from '@/lib/sushi';

const { modelValue } = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
});

const snacks = useSnacksStore();
const { t, locale } = useI18n();
const { mdAndUp } = useDisplay();

const institutionsSearch = shallowRef('');
const endpointsSearch = shallowRef('');
const initialLoading = shallowRef(true);
const saving = shallowRef(false);
const valid = shallowRef(false);
const hasIdChanged = shallowRef(false);

const id = shallowRef(modelValue?.id ?? '');
const timeout = shallowRef(modelValue?.timeout ?? 600);
const beginDate = shallowRef(modelValue?.beginDate ?? '');
const endDate = shallowRef(modelValue?.endDate ?? '');
const reportTypes = ref(
  modelValue?.reportTypes?.map((report) => report.toUpperCase())
  ?? DEFAULT_REPORTS_IDS,
);
const counterVersions = ref(modelValue?.allowedCounterVersions ?? SUPPORTED_COUNTER_VERSIONS);
const downloadUnsupported = shallowRef(modelValue?.downloadUnsupported ?? false);
const allowFaulty = shallowRef(modelValue?.allowFaulty ?? false);
const sendEndMail = shallowRef(modelValue?.sendEndMail ?? true);
const useCache = shallowRef(!modelValue?.forceDownload);
const useValidation = shallowRef(!modelValue?.ignoreValidation);
// TODO: credentials to institutions/endpoints (packages ?)
const institutionIds = ref([...(modelValue?.credentialsQuery?.institutionIds ?? [])]);
const isAllInstitutions = shallowRef(
  modelValue?.credentialsQuery ? !modelValue.credentialsQuery.institutionIds?.length : false,
);
const endpointIds = ref([...(modelValue?.credentialsQuery?.endpointIds ?? [])]);
const isAllEndpoints = shallowRef(
  modelValue?.credentialsQuery ? !modelValue.credentialsQuery.endpointIds?.length : true,
);

const isAdditionalReportOpen = shallowRef(false);
const additionalReport = shallowRef('');
const isCustomVersionOpen = shallowRef(false);
const customVersion = shallowRef('');

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');
const additionalReportForm = useTemplateRef('additionalReportForm');
const additionalVersionForm = useTemplateRef('additionalVersionForm');

const {
  data: institutions,
  status: institutionsStatus,
  error: institutionsError,
  refresh: institutionsRefresh,
} = await useFetch('/api/institutions', {
  lazy: true,
  query: {
    size: 0,
    sort: 'name',
    q: debouncedRef(institutionsSearch),
  },
});

const {
  data: endpoints,
  status: endpointsStatus,
  error: endpointsError,
  refresh: endpointsRefresh,
} = await useFetch('/api/sushi-endpoints', {
  lazy: true,
  query: {
    size: 0,
    sort: 'vendor',
    q: debouncedRef(endpointsSearch),
  },
});

const isEditing = computed(() => !!modelValue?.id);
const institutionsCount = computed(() => {
  if (isAllInstitutions.value) {
    return t('all');
  }
  if (institutionIds.value.length > 0) {
    return institutionIds.value.length;
  }
  return 0;
});
const endpointsCount = computed(() => {
  if (isAllEndpoints.value) {
    return t('all');
  }
  if (endpointIds.value.length > 0) {
    return endpointIds.value.length;
  }
  return 0;
});
const areInstitutionsValid = computed(() => {
  if (isAllInstitutions.value) {
    return !isAllEndpoints.value;
  }
  return institutionIds.value.length > 0;
});
const areEndpointsValid = computed(() => {
  if (isAllEndpoints.value) {
    return !isAllInstitutions.value;
  }
  return endpointIds.value.length > 0;
});
const reportsList = computed(() => Array.from(new Set([
  ...DEFAULT_REPORTS_IDS,
  ...reportTypes.value,
])));
const versionsList = computed(() => Array.from(new Set([
  ...SUPPORTED_COUNTER_VERSIONS,
  ...counterVersions.value,
])));
const versionRules = computed(() => [
  (v) => {
    const pattern = /^[0-9]+(\.[0-9]+(\.[0-9]+(\.[0-9]+)?)?)?$/;

    if (!v || pattern.test(v)) {
      return true;
    }
    return t('fieldMustMatch', { pattern: pattern.toString() });
  },
]);
const isValid = computed(
  () => valid.value
    && areInstitutionsValid.value
    && areEndpointsValid.value
    && reportTypes.value.length > 0
    && counterVersions.value.length > 0,
);

function resetVersionForm() {
  additionalReportForm.value?.reset();
}

function resetReportForm() {
  additionalReportForm.value?.reset();
}

async function save() {
  saving.value = true;

  try {
    const newSession = await $fetch(`/api/harvests-sessions/${id.value}`, {
      method: 'PUT',
      body: {
        id: id.value,
        timeout: timeout.value,
        beginDate: beginDate.value,
        endDate: endDate.value,
        downloadUnsupported: downloadUnsupported.value,
        allowFaulty: allowFaulty.value,
        sendEndMail: sendEndMail.value,
        forceDownload: !useCache.value,
        ignoreValidation: !useValidation.value,
        reportTypes: reportTypes.value.map((report) => report.toLowerCase()),
        allowedCounterVersions: counterVersions.value,
        credentialsQuery: {
          institutionIds: isAllInstitutions.value ? [] : institutionIds.value,
          endpointIds: isAllEndpoints.value ? [] : endpointIds.value,
        },
      },
    });
    emit('submit', newSession);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  saving.value = false;
}

function generateID() {
  const now = new Date();

  const parts = [];

  // Add institution name in id
  if (institutionIds.value.length === 1) {
    const institution = institutions.value.find((i) => i.id === institutionIds.value[0]);
    parts.push(institution?.name.toLocaleLowerCase(locale.value).replace(/\s/g, '-'));
  }

  // Add endpoint name in id
  if (endpointIds.value.length === 1) {
    const endpoint = endpoints.value.find((e) => e.id === endpointIds.value[0]);
    parts.push(endpoint?.vendor.toLocaleLowerCase(locale.value).replace(/\s/g, '-'));
  }

  // Add dates in id
  if (beginDate.value && endDate.value) {
    const begin = parseDate(beginDate.value, 'yyyy-MM', now);
    const end = parseDate(endDate.value, 'yyyy-MM', now);

    const diff = differenceInYears(end, begin) + 1;
    const years = Array.from({ length: diff }, (_, i) => begin.getFullYear() + i);

    parts.push(years.join('-'));
  }

  return [
    dateFormat(now, locale.value, 'yyyy-MM-dd'),
    ...parts.filter((value) => !!value),
  ].join('_');
}

watch([institutionIds, endpointIds, beginDate, endDate], () => {
  if (!isEditing.value && !hasIdChanged.value) {
    id.value = generateID();
  }
}, { immediate: true });

const watchLock = shallowRef(false);
watch(isAllInstitutions, (val) => {
  if (watchLock.value) {
    // Call is from other watcher, free the lock
    watchLock.value = false;
    return;
  }

  isAllEndpoints.value = !val && false;
  watchLock.value = true; // Prevent other watcher to trigger
});
watch(isAllEndpoints, (val) => {
  if (watchLock.value) {
    // Call is from other watcher, free the lock
    watchLock.value = false;
    return;
  }

  isAllInstitutions.value = !val && false;
  watchLock.value = true; // Prevent other watcher to trigger
});

watch(() => institutionsStatus.value === 'pending' && endpointsStatus.value === 'pending', (isLoading) => {
  if (!isLoading) {
    initialLoading.value = false;
  }
});
</script>

<style scoped>
.credentials-list :deep(.v-list-subheader__text) {
  width: 100%;

  display: flex;
  align-items: center;
  gap: 8px;

  margin-top: 8px;
  margin-bottom: 8px;
}

.credentials-list-header {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 1;
  background: inherit;
}
</style>
