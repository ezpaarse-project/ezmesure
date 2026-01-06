<template>
  <v-container class="fill-height">
    <v-row class="justify-center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="10">
          <v-card-title class="bg-primary d-flex">
            {{ $t('contact.contactUs') }}

            <v-spacer />

            <v-icon icon="mdi-email-edit" />
          </v-card-title>

          <v-card-text class="pt-4">
            <v-form ref="formRef" v-model="valid">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="email"
                    :label="$t('contact.email')"
                    :rules="[
                      v => !!v || $t('contact.emailIsRequired'),
                      v => /.+@.+\..+/.test(v) || $t('contact.emailMustBeValid'),
                    ]"
                    prepend-icon="mdi-at"
                    variant="underlined"
                    hide-details="auto"
                    required
                  />
                </v-col>

                <v-col cols="12">
                  <v-select
                    v-model="subject"
                    :label="$t('contact.subject')"
                    :items="subjectsItems"
                    :rules="[
                      v => !!v || $t('contact.subjectIsRequired'),
                    ]"
                    prepend-icon="mdi-pencil"
                    variant="underlined"
                    hide-details="auto"
                    required
                    @update:model-value="onSubjectChange()"
                  />
                </v-col>
              </v-row>

              <v-row v-if="subject === 'sushi-endpoint'" class="mt-2">
                <v-col cols="12">
                  <v-card
                    :title="$t('endpoints.endpoint')"
                    prepend-icon="mdi-api"
                    variant="outlined"
                  >
                    <template #text>
                      <v-row>
                        <v-col cols="12">
                          <v-text-field
                            v-model="additionalData.endpointVendor"
                            :label="$t('contact.endpointVendor')"
                            :hint="$t('contact.pleaseEnterFullVendorName')"
                            :rules="[
                              v => !!v || $t('fieldIsRequired'),
                            ]"
                            prepend-icon="mdi-rename"
                            variant="underlined"
                            hide-details="auto"
                            required
                          />
                        </v-col>

                        <v-col cols="12">
                          <v-text-field
                            v-model="additionalData.endpointUrl"
                            :label="$t('contact.endpointUrl')"
                            :rules="[
                              v => !!v || $t('fieldIsRequired'),
                              v => isValidUrl(v) || $t('enterValidUrl'),
                            ]"
                            prepend-icon="mdi-link-variant"
                            variant="underlined"
                            hide-details="auto"
                            required
                          />
                        </v-col>
                      </v-row>
                    </template>
                  </v-card>
                </v-col>

                <v-col cols="12">
                  <v-card
                    :title="$t('sushi.auth')"
                    prepend-icon="mdi-lock"
                    variant="outlined"
                  >
                    <template #text>
                      <v-row>
                        <v-col cols="12">
                          <p class="mb-0">
                            {{ $t('contact.sushiDetails') }}
                          </p>
                        </v-col>

                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="additionalData.customerId"
                            :label="$t('institutions.sushi.customerId')"
                            :error-messages="sushiRule"
                            prepend-icon="mdi-account"
                            variant="underlined"
                            hide-details="auto"
                            required
                          />
                        </v-col>

                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="additionalData.requestorId"
                            :label="$t('institutions.sushi.requestorId')"
                            :error-messages="sushiRule"
                            prepend-icon="mdi-account-arrow-down"
                            variant="underlined"
                            hide-details="auto"
                            required
                          />
                        </v-col>

                          <v-col cols="12">
                            <v-text-field
                              v-model="additionalData.apiKey"
                              :label="$t('contact.types.sushi-endpoint.fields.credentials.fields.apiKey')"
                              :error-messages="sushiRule"
                              prepend-icon="mdi-key-variant"
                              variant="underlined"
                              hide-details="auto"
                              required
                            />
                          </v-col>
                        </v-row>
                      </template>
                    </v-card>
                  </v-col>
                </v-row>
              </v-slide-x-transition>

              <v-slide-x-transition>
                <v-row v-if="subject === 'wrong-custom-properties'" class="mt-2">
                  <v-col cols="12">
                    <v-autocomplete
                      v-model="additionalData.institution"
                      :items="institutions ?? []"
                      :label="$t('contact.types.wrong-custom-properties.fields.institution.label')"
                      :no-data-text="hasMemberships
                        ? 'contact.types.wrong-custom-properties.fields.institution.emptySearch'
                        : 'contact.types.wrong-custom-properties.fields.institution.noMemberships'
                      "
                      :rules="[
                        v => !!v || $t('fieldIsRequired'),
                      ]"
                      item-title="name"
                      variant="underlined"
                      hide-details="auto"
                      return-object
                      required
                    >
                      <template #prepend>
                        <InstitutionAvatar :institution="additionalData.institution" size="small" />
                      </template>

                      <template #item="{ item: { raw: item }, props: listItem }">
                        <v-list-item v-bind="listItem">
                          <template #prepend>
                            <InstitutionAvatar :institution="item" />
                          </template>
                        </v-list-item>
                      </template>
                    </v-autocomplete>
                  </v-col>

                  <v-slide-x-transition>
                    <v-col v-if="additionalData.institution" cols="12">
                      <v-select
                        v-model="additionalData.prop"
                        :items="availableCustomProps"
                        :label="$t('contact.types.wrong-custom-properties.fields.property')"
                        :rules="[
                          v => !!v || $t('fieldIsRequired'),
                        ]"
                        item-title="label"
                        prepend-icon="mdi-tag-outline"
                        variant="underlined"
                        hide-details="auto"
                        return-object
                        required
                      >
                        <template #item="{ item: { raw: item }, props: listItem }">
                          <v-list-item :subtitle="item.description" v-bind="listItem" />
                        </template>
                      </v-select>
                    </v-col>
                  </v-slide-x-transition>

                  <v-slide-x-reverse-transition>
                    <v-col v-if="additionalData.prop" cols="12">
                      <component
                        :is="additionalData.prop.multiple ? MultiTextField : VTextField"
                        :model-value="additionalData.value || additionalData.prop.value"
                        :label="$t('contact.types.wrong-custom-properties.fields.value.label', additionalData.prop.multiple ? 2 : 1)"
                        :rules="[
                          v => v?.length > 0 || $t('fieldIsRequired'),
                        ]"
                        prepend-icon="mdi-form-textbox"
                        variant="underlined"
                        hide-details="auto"
                        required
                        @update:model-value="additionalData.value = $event"
                      />
                    </v-col>
                  </v-slide-x-reverse-transition>
                </v-row>
              </v-slide-x-transition>

              <v-row>
                <v-col cols="12">
                  <v-textarea
                    v-model="message"
                    prepend-icon="mdi-image-text"
                    variant="underlined"
                    hide-details="auto"
                    v-bind="messageArea"
                  />
                </v-col>
              </v-row>

              <v-row v-if="subject === 'bugs'">
                <v-col cols="12">
                  <v-checkbox
                    v-model="additionalData.sendBrowser"
                    :label="$t('contact.sendNavigatorVersion')"
                    color="primary"
                    density="compact"
                    hide-details
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer />

            <v-btn
              :text="$t('cancel')"
              @click="back()"
            />

            <v-btn
              :text="$t('send')"
              :disabled="!valid"
              :loading="loading"
              color="primary"
              @click="sendMail"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const { t } = useI18n();
const { back } = useRouter();
const { query } = useRoute();
const { data: user } = useAuthState();
const snacks = useSnacksStore();

const loading = shallowRef(false);
const valid = shallowRef(false);
const email = shallowRef('');
const subject = shallowRef('');
const message = shallowRef('');
const additionalData = ref({});

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

const subjectsItems = computed(() => [
  { title: t('contact.requestInformation'), value: 'informations' },
  { title: t('contact.bugReport'), value: 'bugs' },
  { title: t('contact.declareSushiEndpoint'), value: 'sushi-endpoint' },
]);
const messageArea = computed(() => {
  if (subject.value === 'sushi-endpoint') {
    return {
      label: t('contact.additionalInformation'),
    };
  }
  return {
    label: t('contact.content'),
    rules: [
      (v) => !!v || t('contact.contentIsRequired'),
    ],
    required: true,
  };
});
const sushiRule = computed(() => ((!!additionalData.value.requestorId || !!additionalData.value.customerId || !!additionalData.value.apiKey) ? undefined : t('contact.sushiIsRequired')));

function isValidUrl(v) {
  try {
    const url = new URL(v);
    return !!url;
  } catch {
    return false;
  }
}

function diffValues(oldValue, newValue) {
  if (!Array.isArray(oldValue) && !Array.isArray(newValue)) {
    return [
      `${t('contact.types.wrong-custom-properties.fields.value.label')}:`,
      newValue,
    ];
  }

  const oldValuesArr = Array.isArray(oldValue) ? oldValue : [oldValue];
  const oldValuesSet = new Set(oldValuesArr);

  const newValuesArr = Array.isArray(newValue) ? newValue : [newValue];
  const newValuesSet = new Set(newValuesArr);

  return [
    // Show new value of the list
    `${t('contact.types.wrong-custom-properties.fields.value.label', 2)}:`,
    ...newValue,
    '',
    // Show values that were removed
    `${t('contact.types.wrong-custom-properties.fields.value.diff:removed')}:`,
    ...oldValuesArr.filter((val) => !newValuesSet.has(val)),
    // Show values that were added
    `${t('contact.types.wrong-custom-properties.fields.value.diff:added')}:`,
    ...newValuesArr.filter((val) => !oldValuesSet.has(val)),
  ];
}

function onSubjectChange() {
  // Send browser version by default for bug reports (if not set by user)
  if (additionalData.value.sendBrowser == null && subject.value === 'bugs') {
    additionalData.value.sendBrowser = true;
  }
  formRef.value?.validate();
}
function resetForm() {
  email.value = user.value?.email || '';
  subject.value = query.subject || '';
  message.value = '';
  additionalData.value = { sendBrowser: subject.value === 'bugs' ? true : undefined };

  if (subject.value === 'wrong-custom-properties' && query.institutionId) {
    additionalData.value.institution = institutions.value
      .find(({ id }) => id === query.institutionId);
  }

  formRef.value?.validate();
}

function generateGenericMail() {
  return {
    email: email.value,
    subject: t(`contact.types.${subject.value}.title`),
    message: message.value,
    browser: null,
  };
}

function generateBugReportMail() {
  return {
    ...generateGenericMail(),
    browser: additionalData.value.sendBrowser ? navigator.userAgent : null,
  };
}

function generateSushiEndpointMail() {
  const meta = additionalData.value;

  const parts = [
    `${t('contact.types.sushi-endpoint.fields.endpoint.fields.vendor')}:`, meta.endpointVendor,
    `${t('contact.types.sushi-endpoint.fields.endpoint.fields.url')}:`, meta.endpointUrl,
    '',
    `${t('institutions.sushi.requestorId')}:`, meta.requestorId,
    `${t('institutions.sushi.customerId')}:`, meta.customerId,
    `${t('institutions.sushi.apiKey')}:`, meta.apiKey,
    '',
    message.value,
  ];

  return {
    ...generateGenericMail(),
    message: parts.join('\n'),
  };
}

function generateWrongPropertiesMail() {
  const meta = additionalData.value;

  const diff = diffValues(meta.prop.value, meta.value);

  const parts = [
    `${t('institutions.title')}:`, meta.institution.name,
    `${t('institutions.institution.propertyName')}:`, meta.prop.label,
    ...diff,
    '',
    message.value,
  ];

  return {
    ...generateGenericMail(),
    message: parts.join('\n'),
  };
}

async function sendMail() {
  if (!valid.value) {
    return;
  }

  const data = {
    email: email.value,
    subject: subject.value,
    browser: null,
  };
  const meta = additionalData.value;
  let parts = [message.value];

  if (subject.value === 'sushi-endpoint') {
    parts = [
      `${t('contact.endpointVendor')}:`, meta.endpointVendor,
      `${t('contact.endpointUrl')}:`, meta.endpointUrl,
      '',
      `${t('institutions.sushi.requestorId')}:`, meta.requestorId,
      `${t('institutions.sushi.customerId')}:`, meta.customerId,
      `${t('institutions.sushi.apiKey')}:`, meta.apiKey,
      '',
      ...parts,
    ];
  }

  if (subject.value === 'bugs' && meta.sendBrowser) {
    data.browser = navigator.userAgent;
  }

  loading.value = true;
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        ...data,
        message: parts.join('\n'),
      },
    });

    snacks.success(t('contact.emailSent'));

    resetForm();
  } catch (err) {
    snacks.error(t('contact.failed'), err);
  }
  loading.value = false;
}

onMounted(() => {
  resetForm();
});
</script>
