<template>
  <v-card
    :title="isEditing ? $t('endpoints.updateEndpoint') : $t('endpoints.addEndpoint')"
    :subtitle="showEndpoint ? modelValue?.vendor : undefined"
    prepend-icon="mdi-server-plus"
  >
    <template #text>
      <v-row v-if="!isEditing">
        <v-col>
          <SushiEndpointRegistrySearch
            v-model="registryEndpoint"
            @update:endpoint="applyRegistryEndpoint($event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-form
            id="endpointForm"
            ref="formRef"
            v-model="valid"
            @submit.prevent="save()"
          >
            <v-card
              :title="$t('endpoints.endpoint')"
              prepend-icon="mdi-api"
              variant="outlined"
            >
              <template #text>
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="endpoint.vendor"
                      :label="`${$t('name')} *`"
                      :rules="[v => !!v || $t('fieldIsRequired')]"
                      prepend-icon="mdi-rename"
                      variant="underlined"
                      hide-details="auto"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      :model-value="endpoint.sushiUrl"
                      :label="`${$t('url')} *`"
                      :rules="sushiUrlRules"
                      prepend-icon="mdi-link-variant"
                      variant="underlined"
                      hide-details="auto"
                      @update:model-value="changeSushiUrl($event)"
                    />
                  </v-col>

                  <v-col v-if="alert" cols="12">
                    <v-alert
                      :text="alert"
                      type="warning"
                      icon="mdi-alert-outline"
                      density="compact"
                      variant="outlined"
                      transition="scale-transition"
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-checkbox
                      v-model="endpoint.requireCustomerId"
                      :label="$t('endpoints.requireCustomerId')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-checkbox
                      v-model="endpoint.requireRequestorId"
                      :label="$t('endpoints.requireRequestorId')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-checkbox
                      v-model="endpoint.requireApiKey"
                      :label="$t('endpoints.requireApiKey')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>

            <v-card
              :title="$t('general')"
              prepend-icon="mdi-format-list-bulleted"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="12" sm="8">
                    <v-text-field
                      v-model="endpoint.technicalProvider"
                      :label="$t('endpoints.technicalProvider')"
                      prepend-icon="mdi-toolbox"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="4">
                    <v-combobox
                      v-model="endpoint.counterVersions"
                      :label="$t('endpoints.counterVersion')"
                      :items="SUPPORTED_COUNTER_VERSIONS"
                      :rules="versionRules"
                      :return-object="false"
                      prepend-icon="mdi-numeric"
                      variant="underlined"
                      hide-details="auto"
                      multiple
                      required
                    >
                      <template #selection="{ item: { raw: version } }">
                        <v-chip
                          :text="version"
                          :color="counterVersionsColors.get(version) || 'secondary'"
                          density="comfortable"
                          variant="flat"
                          label
                        />
                      </template>
                    </v-combobox>
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      v-model="endpoint.registryId"
                      :label="$t('endpoints.registryId')"
                      :hint="$t('endpoints.registryIdHint')"
                      prepend-icon="mdi-identifier"
                      variant="underlined"
                      hide-details="auto"
                      @update:model-value="extractIdFromUrl($event)"
                    >
                      <template v-if="endpoint.registryId" #append>
                        <v-btn
                          icon="mdi-open-in-new"
                          :href="`https://registry.countermetrics.org/platform/${endpoint.registryId}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="text"
                          density="comfortable"
                          size="small"
                        />
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-combobox
                      v-model="endpoint.tags"
                      :label="$t('endpoints.tags')"
                      :items="availableTags"
                      :loading="loadingTags && 'primary'"
                      prepend-icon="mdi-tag"
                      variant="underlined"
                      multiple
                      chips
                      closable-chips
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="endpoint.description"
                      :label="$t('endpoints.description')"
                      prepend-icon="mdi-image-text"
                      variant="underlined"
                      hide-details="auto"
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>

            <v-card
              :title="$t('endpoints.harvestedReports')"
              prepend-icon="mdi-file"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col>
                    <SushiEndpointSupportedData v-model="endpoint.supportedData" />
                  </v-col>
                </v-row>

                <v-divider class="mt-4 mb-2" />

                <v-row>
                  <v-col cols="12">
                    <SushiEndpointReportCombobox
                      v-model="endpoint.testedReport"
                      :label="$t('endpoints.testedReport')"
                      :endpoint="modelValue"
                      prepend-icon="mdi-connection"
                      placeholder="pr"
                      variant="underlined"
                      hide-details="auto"
                      clearable
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-checkbox
                      v-model="endpoint.ignoreReportValidation"
                      :label="$t('endpoints.ignoreReportValidation')"
                      density="compact"
                      color="primary"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>

            <v-card
              :title="$t('advancedSettings')"
              prepend-icon="mdi-tools"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="12">
                    <p>
                      <i18n-t keypath="endpoints.dateFormatDesc" tag="p">
                        <template #beginDate>
                          <code>begin_date</code>
                        </template>
                        <template #endDate>
                          <code>end_date</code>
                        </template>
                      </i18n-t>
                    </p>

                    <SushiEndpointDateFormatCombobox
                      v-model="endpoint.harvestDateFormat"
                      :label="$t('endpoints.dateFormat')"
                      :items="['yyyy-MM', 'yyyy-MM-dd']"
                      prepend-icon="mdi-calendar"
                      variant="underlined"
                      hide-details="auto"
                      clearable
                    />
                  </v-col>

                  <v-col cols="12">
                    <p>
                      <i18n-t keypath="endpoints.paramSeparatorDesc" tag="p" class="text-justify">
                        <template #0>
                          <code>Attributes_To_Show</code>
                        </template>

                        <template #1>
                          <code>Access_Type</code>
                        </template>

                        <template #2>
                          <code>Section_Type</code>
                        </template>

                        <template #separator>
                          <code>|</code>
                        </template>
                      </i18n-t>
                    </p>

                    <v-text-field
                      v-model="endpoint.paramSeparator"
                      :label="$t('endpoints.paramSeparator')"
                      placeholder="|"
                      prepend-icon="mdi-cursor-text"
                      variant="underlined"
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12">
                    <SushiAdvancedParams v-model="endpoint.params" />
                  </v-col>
                </v-row>
              </template>
            </v-card>
          </v-form>
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-menu
        v-model="isConnectionMenuOpen"
        :close-on-content-click="false"
        position="top left"
        width="600"
        open-on-click
      >
        <template #activator="{ props: menu }">
          <v-btn
            :disabled="!valid"
            :text="$t('endpoints.checkEndpoint')"
            color="accent"
            variant="tonal"
            v-bind="menu"
          />
        </template>

        <SushiEndpointConnectionForm :endpoint="endpoint">
          <template #append>
            <v-btn
              icon="mdi-close"
              color="secondary"
              variant="text"
              density="comfortable"
              @click="isConnectionMenuOpen = false"
            />
          </template>
        </SushiEndpointConnectionForm>
      </v-menu>

      <v-spacer />

      <slot name="actions" :loading="saving" />

      <v-btn
        :text="!isEditing ? $t('add') : $t('save')"
        :prepend-icon="!isEditing ? 'mdi-plus' : 'mdi-content-save'"
        :disabled="!valid"
        :loading="saving"
        type="submit"
        form="endpointForm"
        variant="elevated"
        color="primary"
      />
    </template>
  </v-card>
</template>

<script setup>
const SUPPORTED_COUNTER_VERSIONS = ['5', '5.1'];

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
  showEndpoint: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
  'update:modelValue': (item) => !!item,
});

const { t } = useI18n();
const snacks = useSnacksStore();
const { openConfirm } = useDialogStore();

const saving = ref(false);
const valid = ref(false);
const isConnectionMenuOpen = ref(false);
const loadingTags = ref(false);
const registryEndpoint = ref();
const endpoint = ref({ ...(props.modelValue ?? { counterVersions: ['5'] }) });

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

const availableTags = computedAsync(
  async () => {
    const endpointItems = await $fetch('/api/sushi-endpoints', {
      query: {
        size: 0,
        distinct: 'tags',
      },
    });

    // Map sushi items with array of tags as key
    const itemsPerTags = Map.groupBy(Object.values(endpointItems), (item) => item.tags);
    // Merge all tags in one array then make unique
    const tags = new Set(Array.from(itemsPerTags.keys()).flat());
    return Array.from(tags).sort();
  },
  [],
  { lazy: true, evaluating: loadingTags },
);

const isEditing = computed(() => !!props.modelValue?.id);
const looksLikeSoapUrl = computed(() => (endpoint.value.sushiUrl || '').toLowerCase().includes('soap') && t('endpoints.soapWarning'));
// TODO: Check if name is unique
const alert = computed(() => looksLikeSoapUrl.value);
const sushiUrlRules = computed(() => [
  (v) => !!v || t('fieldIsRequired'),
  (v) => {
    try {
      const url = new URL(v);
      return !!url;
    } catch {
      return t('enterValidUrl');
    }
  },
]);
const versionRules = computed(() => [
  (values) => values.length > 0 || t('fieldIsRequired'),
  (values) => values.every((v) => {
    const pattern = /^[0-9]+(\.[0-9]+(\.[0-9]+(\.[0-9]+)?)?)?$/;

    if (!v || pattern.test(v)) {
      return true;
    }
    return t('fieldMustMatch', { pattern: pattern.toString() });
  }),
]);

async function changeSushiUrl(sushiUrl) {
  const checkReg = /\/(status|members|reports).*/i;

  if (checkReg.test(sushiUrl)) {
    const shouldFixUrl = await openConfirm({
      text: t('endpoints.sushiNotRootDetected'),
      agreeText: t('fixIt'),
      disagreeText: t('leaveIt'),
    });

    if (shouldFixUrl) {
      endpoint.value.sushiUrl = sushiUrl.replace(checkReg, '');
      return;
    }
  }

  endpoint.value.sushiUrl = sushiUrl;
}

async function save() {
  saving.value = true;

  try {
    let newEndpoint;
    if (isEditing.value) {
      newEndpoint = await $fetch(`/api/sushi-endpoints/${endpoint.value.id}`, {
        method: 'PATCH',
        body: { ...endpoint.value },
      });
    } else {
      newEndpoint = await $fetch('/api/sushi-endpoints', {
        method: 'POST',
        body: { ...endpoint.value },
      });
    }
    emit('submit', newEndpoint);
  } catch {
    snacks.error(t('anErrorOccurred'));
  }

  saving.value = false;
}

function applyRegistryEndpoint(e) {
  if (!e) {
    endpoint.value.registryId = '';
    return;
  }
  endpoint.value = e;
}

function extractIdFromUrl(url) {
  if (!url.trim().startsWith('https://registry.countermetrics.org/')) {
    return;
  }

  const id = /\/platform\/(.+)\/?$/.exec(url)?.[1];
  if (id) {
    endpoint.value.registryId = id;
  }
}

onMounted(() => {
  formRef.value?.validate();
});
</script>
