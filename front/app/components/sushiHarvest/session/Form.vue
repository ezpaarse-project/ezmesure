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
    :title="isEditing ? $t('harvest.sessions.update') : $t('harvest.sessions.add')"
    :subtitle="props.modelValue?.id"
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
              :title="$t('harvest.sessions.credentials')"
              prepend-icon="mdi-key"
              variant="outlined"
            >
              <template #text>
                <v-row>
                  <v-col cols="6">
                    <v-list
                      v-model:selected="institutionIds"
                      lines="two"
                      density="compact"
                      height="450"
                      select-strategy="leaf"
                      class="credentials-list pa-0"
                    >
                      <v-list-subheader sticky>
                        <v-icon icon="mdi-domain" />
                        {{ $t('institutions.toolbarTitle', { count: institutionsCount }) }}

                        <v-spacer />

                        <div style="width: 150px">
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
                    </v-list>
                  </v-col>

                  <v-divider vertical />

                  <v-col cols="6">
                    <v-list
                      v-model:selected="endpointIds"
                      lines="two"
                      density="compact"
                      height="450"
                      select-strategy="leaf"
                      class="credentials-list pa-0"
                    >
                      <v-list-subheader sticky>
                        <v-icon icon="mdi-api" />
                        {{ $t('endpoints.toolbarTitle', { count: endpointsCount }) }}

                        <v-spacer />

                        <div style="width: 150px">
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
                    </v-list>
                  </v-col>
                </v-row>
              </template>
            </v-card>

            <v-card
              :title="$t('harvest.sessions.reports')"
              prepend-icon="mdi-download"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="6">
                    <MonthPickerField
                      v-model="beginDate"
                      :label="`${$t('harvest.jobs.beginDate')} *`"
                      :rules="[v => !!v || $t('fieldIsRequired')]"
                      :max="endDate"
                      variant="underlined"
                      prepend-icon="mdi-calendar-start"
                    />
                  </v-col>

                  <v-col cols="6">
                    <MonthPickerField
                      v-model="endDate"
                      :label="`${$t('harvest.jobs.endDate')} *`"
                      :rules="[v => !!v || $t('fieldIsRequired')]"
                      :min="beginDate"
                      variant="underlined"
                      prepend-icon="mdi-calendar-end"
                    />
                  </v-col>

                  <v-col cols="6">
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
                  </v-col>

                  <v-divider vertical />

                  <v-col cols="6">
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
                  </v-col>
                </v-row>
              </template>
            </v-card>

            <v-card
              :title="$t('harvest.sessions.settings')"
              prepend-icon="mdi-cog"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="id"
                      :label="`${$t('name')} *`"
                      :rules="[v => !!v || $t('fieldIsRequired')]"
                      :disabled="isEditing"
                      prepend-icon="mdi-rename"
                      variant="underlined"
                      hide-details="auto"
                    />
                  </v-col>

                  <v-col cols="6">
                    <v-checkbox
                      v-model="sendEndMail"
                      :label="$t('harvest.sessions.sendEndMail')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="6">
                    <v-checkbox
                      v-model="downloadUnsupported"
                      :label="$t('harvest.sessions.downloadUnsupported')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="3">
                    <v-checkbox
                      v-model="allowFaulty"
                      :label="$t('harvest.sessions.allowFaulty')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="3">
                    <v-checkbox
                      v-model="useCache"
                      :label="$t('harvest.sessions.useCache')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="3">
                    <v-checkbox
                      v-model="useValidation"
                      :label="$t('harvest.sessions.useValidation')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="3">
                    <v-text-field
                      :model-value="`${timeout}`"
                      :label="$t('harvest.sessions.timeout')"
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
import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_REPORTS_IDS, SUPPORTED_COUNTER_VERSIONS } from '@/lib/sushi';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
});

const snacks = useSnacksStore();
const { t } = useI18n();

const institutionsSearch = shallowRef('');
const endpointsSearch = shallowRef('');
const initialLoading = shallowRef(true);
const saving = shallowRef(false);
const valid = shallowRef(false);

const id = shallowRef(props.modelValue?.id ?? '');
const timeout = shallowRef(props.modelValue?.timeout ?? 600);
const beginDate = shallowRef(props.modelValue?.beginDate ?? '');
const endDate = shallowRef(props.modelValue?.endDate ?? '');
const reportTypes = ref(
  props.modelValue?.reportTypes?.map((report) => report.toUpperCase())
  ?? DEFAULT_REPORTS_IDS,
);
const counterVersions = ref(props.modelValue?.allowedCounterVersions ?? SUPPORTED_COUNTER_VERSIONS);
const downloadUnsupported = shallowRef(props.modelValue?.downloadUnsupported ?? false);
const allowFaulty = shallowRef(props.modelValue?.allowFaulty ?? false);
const sendEndMail = shallowRef(props.modelValue?.sendEndMail ?? true);
const useCache = shallowRef(!props.modelValue?.forceDownload);
const useValidation = shallowRef(!props.modelValue?.ignoreValidation);
// TODO: credentials to institutions/endpoints (packages ?)
const institutionIds = ref([...(props.modelValue?.credentialsQuery?.institutionIds ?? [])]);
const endpointIds = ref([...(props.modelValue?.credentialsQuery?.endpointIds ?? [])]);

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

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

const isEditing = computed(() => !!props.modelValue?.id);
const institutionsCount = computed(() => {
  // institutionIds.length || $t('all')
  if (institutionIds.value.length > 0) {
    return institutionIds.value.length;
  }
  if (endpointIds.value.length > 0) {
    return t('all');
  }
  return 0;
});
const endpointsCount = computed(() => {
  // endpointIds.length || $t('all')
  if (endpointIds.value.length > 0) {
    return endpointIds.value.length;
  }
  if (institutionIds.value.length > 0) {
    return t('all');
  }
  return 0;
});
const reportsList = computed(() => Array.from(new Set([
  ...DEFAULT_REPORTS_IDS,
  ...reportTypes.value,
])));
const versionsList = computed(() => Array.from(new Set([
  ...SUPPORTED_COUNTER_VERSIONS,
  ...counterVersions.value,
])));

const isValid = computed(() => {
  if (!valid.value) {
    return false;
  }

  return (institutionIds.value.length > 0 || endpointIds.value.length > 0)
    && reportTypes.value.length > 0
    && counterVersions.value.length > 0;
});

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
          institutionIds: institutionIds.value,
          endpointIds: endpointIds.value,
        },
      },
    });
    emit('submit', newSession);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  saving.value = false;
}

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
</style>
