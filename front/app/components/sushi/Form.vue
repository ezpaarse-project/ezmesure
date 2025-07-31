<template>
  <v-card
    :loading="loading && 'primary'"
    :title="isEditing ? $t('institutions.sushi.updateCredentials') : $t('institutions.sushi.addCredentials')"
    prepend-icon="mdi-key-plus"
  >
    <template v-if="showSushi" #subtitle>
      <SushiSubtitle :model-value="modelValue" />
    </template>

    <template #text>
      <v-row>
        <v-col>
          <v-form
            id="sushiForm"
            ref="formRef"
            v-model="valid"
            @submit.prevent="save()"
          >
            <SushiEndpointSelect
              v-model="sushi.endpoint"
              show-no-data
              @update:model-value="onEndpointChange($event)"
            />

            <v-card
              :title="$t('sushi.auth')"
              prepend-icon="mdi-lock"
              variant="outlined"
              class="mt-4"
            >
              <template #text>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="sushi.customerId"
                      :label="authFields.customerId.label"
                      :required="authFields.customerId.required"
                      :rules="authFields.customerId.rules"
                      :persistent-hint="authFields.customerId.required"
                      :disabled="!sushi.endpoint"
                      prepend-icon="mdi-account"
                      variant="underlined"
                      hide-details="auto"
                      @update:model-value="sushi.connection = undefined"
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="sushi.requestorId"
                      :label="authFields.requestorId.label"
                      :required="authFields.requestorId.required"
                      :rules="authFields.requestorId.rules"
                      :persistent-hint="authFields.requestorId.required"
                      :disabled="!sushi.endpoint"
                      prepend-icon="mdi-account-arrow-down"
                      variant="underlined"
                      hide-details="auto"
                      @update:model-value="sushi.connection = undefined"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      v-model="sushi.apiKey"
                      :label="authFields.apiKey.label"
                      :required="authFields.apiKey.required"
                      :rules="authFields.apiKey.rules"
                      :persistent-hint="authFields.apiKey.required"
                      :disabled="!sushi.endpoint"
                      prepend-icon="mdi-key-variant"
                      variant="underlined"
                      hide-details="auto"
                      @update:model-value="sushi.connection = undefined"
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
                  <v-col cols="12">
                    <v-combobox
                      v-model="sushi.packages"
                      v-model:search="packageSearch"
                      :label="`${$t('institutions.sushi.packages')} *`"
                      :hint="$t('institutions.sushi.packagesDescription')"
                      :items="availablePackages"
                      :loading="loadingPackages && 'primary'"
                      :rules="[
                        (v) => (v?.length ?? 0) > 0 || $t('fieldIsRequired'),
                        (v) => (v?.length ?? 0) <= 1 || $t('institutions.sushi.onlyOnePackage'),
                      ]"
                      :hide-no-data="!packageSearch"
                      prepend-icon="mdi-tag"
                      variant="underlined"
                      required
                      multiple
                      chips
                      closable-chips
                    >
                      <template #no-data>
                        <v-list-item>
                          <template #title>
                            <i18n-t keypath="noMatchFor">
                              <template #search>
                                <strong>{{ packageSearch }}</strong>
                              </template>

                              <template #key>
                                <kbd>{{ $t('enterKey') }}</kbd>
                              </template>
                            </i18n-t>
                          </template>
                        </v-list-item>
                      </template>
                    </v-combobox>
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="sushi.comment"
                      :label="$t('institutions.sushi.comment')"
                      prepend-icon="mdi-image-text"
                      variant="underlined"
                      hide-details="auto"
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card>
          </v-form>

          <v-card
            :title="$t('advancedSettings')"
            prepend-icon="mdi-tools"
            variant="outlined"
            class="mt-4"
          >
            <template #append>
              <v-btn
                :icon="isAdvancedOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                density="compact"
                variant="text"
                @click="isAdvancedOpen = !isAdvancedOpen"
              />
            </template>

            <template v-if="isAdvancedOpen" #text>
              <SushiAdvancedParams
                v-model="sushi.params"
                :parent-params="sushi.endpoint?.params"
              />
            </template>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-menu
        :disabled="!sushi.connection"
        :close-on-content-click="false"
        position="top left"
        width="600"
        open-on-hover
      >
        <template #activator="{ props: menu }">
          <v-btn
            :disabled="!valid"
            :loading="loading"
            :text="connectionStatus.text"
            :color="connectionStatus.color || 'accent'"
            :append-icon="connectionStatus.icon"
            :variant="!sushi.connection ? 'elevated' : 'tonal'"
            v-bind="menu"
            @click="checkConnection()"
          />
        </template>

        <SushiConnectionDetails :model-value="sushi?.connection" />
      </v-menu>

      <v-spacer />

      <slot name="actions" :loading="loading || saving" />

      <div v-tooltip="{ text: $t('sushi.checkBeforeSave'), disabled: !!sushi.connection, location: 'top' }">
        <v-btn
          :text="!isEditing ? $t('add') : $t('save')"
          :prepend-icon="!isEditing ? 'mdi-plus' : 'mdi-content-save'"
          :disabled="!valid || !sushi.connection"
          :loading="saving"
          type="submit"
          form="sushiForm"
          variant="elevated"
          color="primary"
        />
      </div>
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
  institution: {
    type: Object,
    required: true,
  },
  showSushi: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
  'update:modelValue': (item) => !!item,
});

const { t, locale } = useI18n();
const snacks = useSnacksStore();

const loading = shallowRef(false);
const saving = shallowRef(false);
const valid = shallowRef(false);
const isAdvancedOpen = shallowRef(false);
const loadingPackages = shallowRef(false);
const packageSearch = shallowRef('');
const sushi = ref({ ...props.modelValue });

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

const availablePackages = computedAsync(
  async (onCancel) => {
    const abortController = new AbortController();
    onCancel(() => abortController.abort());

    try {
      const items = await $fetch(`/api/institutions/${props.institution.id}/sushi`, {
        signal: abortController.signal,
        query: {
          size: 0,
          distinct: 'packages',
        },
      });

      // Merge all packages in one array them make unique
      const packages = new Set(items.flatMap((item) => item.packages ?? []));

      return Array.from(packages)
        .sort((a, b) => a.localeCompare(b, locale.value, { sensitivity: 'base' }));
    } catch (err) {
      snacks.error(t('anErrorOccurred'), err);
      return [];
    }
  },
  [],
  { lazy: true, evaluating: loadingPackages },
);

const isEditing = computed(() => !!props.modelValue?.id);
const connectionStatus = computed(() => {
  let text = t('institutions.sushi.checkCredentials');
  if (!sushi.value.connection) {
    return {
      text,
      color: 'accent',
    };
  }

  switch (sushi.value.connection.status) {
    case 'success':
      text = t('institutions.sushi.operational');
      break;
    case 'unauthorized':
      text = t('institutions.sushi.invalidCredentials');
      break;
    case 'failed':
      text = t('error');
      break;
    default:
      text = t('institutions.sushi.untested');
      break;
  }
  return {
    ...sushiStatus.get(sushi.value.connection.status),
    text,
  };
});
const authFields = computed(() => {
  const fields = ['customerId', 'requestorId', 'apiKey'];

  return Object.fromEntries(
    fields.map((f) => {
      const requireField = `require${f[0].toUpperCase()}${f.slice(1)}`;
      const isRequired = sushi.value.endpoint?.[requireField] ?? false;

      const label = t(`institutions.sushi.${f}`);

      if (!isRequired) {
        return [f, {
          label,
          required: false,
        }];
      }

      return [f, {
        label: `${label} *`,
        required: true,
        rules: [(v) => !!v || t('institutions.sushi.necessaryField')],
      }];
    }),
  );
});

async function onEndpointChange() {
  sushi.connection = undefined;
  await nextTick();
  formRef.value?.validate();
}

async function checkConnection() {
  loading.value = true;

  try {
    sushi.value.connection = await $fetch('/api/sushi/_check_connection', {
      method: 'POST',
      body: {
        ...sushi.value,
        institution: props.institution,
      },
    });

    if (sushi.value.endpoint?.id === props.modelValue?.endpoint?.id) {
      emit('update:modelValue', sushi.value);
    }
  } catch (err) {
    snacks.error(t('institutions.sushi.cannotCheckCredentials', { name: sushi.value.endpoint?.vendor }), err);
  }

  loading.value = false;
}

async function save() {
  saving.value = true;

  try {
    let newSushi;
    if (isEditing.value) {
      newSushi = await $fetch(`/api/sushi/${sushi.value.id}`, {
        method: 'PATCH',
        body: {
          ...sushi.value,
          endpoint: undefined,
          endpointId: sushi.value.endpoint?.id,
        },
      });
    } else {
      newSushi = await $fetch('/api/sushi', {
        method: 'POST',
        body: {
          ...sushi.value,
          endpoint: undefined,
          institution: undefined,
          endpointId: sushi.value.endpoint?.id,
          institutionId: props.institution.id,
        },
      });
    }
    emit('submit', newSushi);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  saving.value = false;
}

onMounted(() => {
  formRef.value?.validate();
});
</script>
