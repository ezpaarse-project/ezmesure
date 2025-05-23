<template>
  <v-card
    :title="$t('endpoints.checkEndpoint')"
    :loading="loading && 'primary'"
    prepend-icon="mdi-connection"
  >
    <template #append>
      <slot name="append" />
    </template>

    <template #text>
      <v-form ref="formRef" v-model="valid">
        <v-row v-if="connection">
          <v-col cols="12">
            <SushiConnectionDetails
              :model-value="connection"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="sushi.customerId"
              :label="authFields.customerId.label"
              :required="authFields.customerId.required"
              :rules="authFields.customerId.rules"
              :persistent-hint="authFields.customerId.required"
              prepend-icon="mdi-account"
              variant="underlined"
              hide-details="auto"
              @update:model-value="connection = undefined"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model="sushi.requestorId"
              :label="authFields.requestorId.label"
              :required="authFields.requestorId.required"
              :rules="authFields.requestorId.rules"
              :persistent-hint="authFields.requestorId.required"
              prepend-icon="mdi-account-arrow-down"
              variant="underlined"
              hide-details="auto"
              @update:model-value="connection = undefined"
            />
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="sushi.apiKey"
              :label="authFields.apiKey.label"
              :required="authFields.apiKey.required"
              :rules="authFields.apiKey.rules"
              :persistent-hint="authFields.apiKey.required"
              prepend-icon="mdi-key-variant"
              variant="underlined"
              hide-details="auto"
              @update:model-value="connection = undefined"
            />
          </v-col>
        </v-row>
      </v-form>
    </template>

    <template #actions>
      <v-spacer />

      <v-btn
        :disabled="!valid"
        :loading="loading"
        :text="connectionStatus.text"
        :color="connectionStatus.color || 'primary'"
        :append-icon="connectionStatus.icon"
        :variant="!connection ? 'elevated' : 'tonal'"
        @click="checkConnection()"
      />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  endpoint: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();
const snacks = useSnacksStore();

const loading = ref(false);
const valid = ref(false);
const connection = ref(undefined);
const sushi = ref({
  requestorId: '',
  customerId: '',
  apiKey: '',
});

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

const authFields = computed(() => {
  const fields = ['customerId', 'requestorId', 'apiKey'];

  return Object.fromEntries(
    fields.map((f) => {
      const requireField = `require${f[0].toUpperCase()}${f.slice(1)}`;
      const isRequired = props.endpoint?.[requireField] ?? false;

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
const connectionStatus = computed(() => {
  let text = t('institutions.sushi.checkCredentials');
  if (!connection.value) {
    return {
      text,
      color: 'primary',
    };
  }

  switch (connection.value.status) {
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
    ...sushiStatus.get(connection.value.status),
    text,
  };
});

async function checkConnection() {
  loading.value = true;

  try {
    connection.value = await $fetch('/api/sushi/_check_connection', {
      method: 'POST',
      body: {
        ...sushi.value,
        endpoint: props.endpoint,
      },
    });
  } catch (err) {
    snacks.error(t('institutions.sushi.cannotCheckCredentials', { name: endpoint.value?.vendor }), err);
  }

  loading.value = false;
}

onMounted(() => {
  formRef.value?.validate();
});
</script>
