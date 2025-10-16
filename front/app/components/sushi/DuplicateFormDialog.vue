<template>
  <v-dialog
    :model-value="modelValue"
    max-width="700"
    v-bind="$attrs"
    @update:model-value="$emit('update:model-value', $event)"
  >
    <v-card :title="$t('sushi.duplicateDialog.title')">
      <template #text>
        <v-alert
          :text="$t('sushi.duplicateDialog.text.alert')"
          type="warning"
          icon="mdi-alert"
          variant="tonal"
          class="mb-2"
        />

        <i18n-t keypath="sushi.duplicateDialog.text.start" tag="p">
          <template #reason>
            <span class="font-weight-bold">
              {{ $t(`sushi.duplicateDialog.reasons.${reason}`) }}
            </span>
          </template>
        </i18n-t>

        <v-card
          :title="$t('sushi.duplicateDialog.text.content.title')"
          prepend-icon="mdi-key"
          variant="outlined"
          class="my-3"
        >
          <template #subtitle>
            <SushiSubtitle :model-value="similar" />
          </template>

          <template #text>
            <v-divider class="mb-2" />

            <v-row>
              <DetailsField
                v-if="similar.customerId"
                :value="similar.customerId"
                :label="t('institutions.sushi.customerId')"
                :cols="4"
                style="word-wrap: anywhere;"
              />

              <DetailsField
                v-if="similar.requestorId"
                :value="similar.requestorId"
                :label="t('institutions.sushi.requestorId')"
                :cols="4"
                style="word-wrap: anywhere;"
              />

              <DetailsField
                v-if="similar.apiKey"
                :value="similar.apiKey"
                :label="t('institutions.sushi.apiKey')"
                :cols="4"
                style="word-wrap: anywhere;"
              />
            </v-row>

            <v-row>
              <DetailsField
                :value="similar.endpoint.sushiUrl"
                :label="t('institutions.sushi.sushiUrl')"
                style="word-wrap: anywhere;"
              />
            </v-row>

            <v-divider class="my-2" />

            <v-row>
              <DetailsField
                :label="t('sushi.duplicateDialog.text.content.state')"
                :cols="4"
                style="word-wrap: anywhere;"
              >
                <SushiStateText :model-value="similar" />
              </DetailsField>

              <DetailsField
                :label="t('status')"
                :cols="4"
                style="word-wrap: anywhere;"
              >
                <SushiConnectionChip
                  :sushi="similar"
                  readonly
                />
              </DetailsField>
            </v-row>
          </template>
        </v-card>

        <p>
          {{ isEditing ? $t('sushi.duplicateDialog.text.end:update') : $t('sushi.duplicateDialog.text.end:create') }}
        </p>
      </template>

      <template v-if="isEditing" #actions>
        <v-spacer />

        <v-btn
          :text="$t('sushi.duplicateDialog.actions.secondary:update')"
          :disabled="loadingUpdate"
          :loading="loadingForce"
          prepend-icon="mdi-pencil"
          size="small"
          @click="updateDuplicate(true)"
        />

        <v-btn
          :text="$t('sushi.duplicateDialog.actions.main:update')"
          prepend-icon="mdi-check"
          size="small"
          color="green"
          variant="elevated"
          @click="$emit('update:model-value', false)"
        />
      </template>
      <template v-else #actions>
        <v-btn
          :text="$t('cancel')"
          :disabled="loadingUpdate || loadingForce"
          size="small"
          @click="$emit('update:model-value', false)"
        />

        <v-spacer />

        <v-btn
          :text="$t('sushi.duplicateDialog.actions.secondary:create')"
          :disabled="loadingUpdate"
          :loading="loadingForce"
          prepend-icon="mdi-plus"
          size="small"
          @click="createDuplicate(true)"
        />

        <v-btn
          :text="similar.archived ? $t('sushi.duplicateDialog.actions.main:create.archived') : $t('sushi.duplicateDialog.actions.main:create')"
          :prepend-icon="similar.archived ? 'mdi-archive-off' : 'mdi-pencil'"
          :disabled="loadingForce"
          :loading="loadingUpdate"
          size="small"
          color="blue"
          variant="elevated"
          @click="createDuplicate()"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  sushi: {
    type: Object,
    required: true,
  },
  similar: {
    type: Object,
    required: true,
  },
  institution: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits({
  'update:model-value': (value) => value != null,
  submit: (value) => !!value,
});

const { t, locale } = useI18n();
const snacks = useSnacksStore();

const loadingForce = shallowRef(false);
const loadingUpdate = shallowRef(false);

const isEditing = computed(() => !!props.sushi?.id);

const reason = computed(() => {
  if (
    props.similar.endpointId === props.sushi.endpoint?.id
    && props.similar.packages[0] === props.sushi.packages[0]
  ) {
    return 'samePackage';
  }

  return 'sameParameters';
});

async function updateDuplicate(force = false) {
  loadingForce.value = force;
  loadingUpdate.value = !force;

  try {
    const newSushi = await $fetch(`/api/sushi/${props.sushi.id}`, {
      method: 'PATCH',
      query: {
        force,
      },
      body: {
        ...props.sushi,
        endpoint: undefined,
        endpointId: props.sushi.endpoint?.id,
      },
    });

    emit('submit', newSushi);
    emit('update:model-value', false);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  loadingForce.value = false;
  loadingUpdate.value = false;
}

async function createDuplicate(force = false) {
  loadingForce.value = force;
  loadingUpdate.value = !force;

  try {
    const newSushi = await $fetch('/api/sushi', {
      method: 'POST',
      query: {
        force,
        update: true,
      },
      body: {
        ...props.sushi,
        endpoint: undefined,
        institution: undefined,
        endpointId: props.sushi.endpoint?.id,
        institutionId: props.institution.id,
      },
    });

    emit('submit', newSushi);
    emit('update:model-value', false);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  loadingForce.value = false;
  loadingUpdate.value = false;
}
</script>
