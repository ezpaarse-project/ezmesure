<template>
  <v-card
    :title="isEditing ? $t('customFields.editField') : $t('customFields.newField')"
    prepend-icon="mdi-tag-plus"
  >
    <template #text>
      <v-form
        id="fieldForm"
        ref="formRef"
        v-model="valid"
        @submit.prevent="save()"
      >
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="customField.id"
              :label="`${$t('identifier')} *`"
              :rules="idRules"
              prepend-icon="mdi-key-variant"
              variant="underlined"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model="customField.labelFr"
              :label="$t('customFields.labelFr')"
              prepend-icon="mdi-label-outline"
              variant="underlined"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model="customField.labelEn"
              :label="$t('customFields.labelEn')"
              prepend-icon="mdi-label-outline"
              variant="underlined"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model="customField.descriptionFr"
              :label="$t('customFields.descriptionFr')"
              prepend-icon="mdi-book-open-page-variant"
              variant="underlined"
              hide-details
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model="customField.descriptionEn"
              :label="$t('customFields.descriptionEn')"
              prepend-icon="mdi-book-open-page-variant"
              variant="underlined"
              hide-details
            />
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="customField.helpUrl"
              :label="$t('customFields.helpUrl')"
              placeholder="https://example.com/about"
              prepend-icon="mdi-link-variant"
              variant="underlined"
              hide-details
            />
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="customField.itemUrl"
              :label="$t('customFields.itemUrl')"
              placeholder="https://example.com/org/{value}"
              prepend-icon="mdi-link-variant"
              variant="underlined"
              hide-details
            />
          </v-col>

          <v-col cols="12">
            <v-checkbox
              v-model="customField.multiple"
              :label="$t('customFields.multivalued')"
              density="compact"
              color="primary"
              prepend-icon="mdi-label-multiple-outline"
              hide-details
            />

            <v-checkbox
              v-model="customField.editable"
              :label="$t('customFields.editableByUsers')"
              density="compact"
              color="primary"
              prepend-icon="mdi-pencil"
              hide-details
            />

            <v-checkbox
              v-model="customField.visible"
              :label="$t('customFields.visibleToUsers')"
              density="compact"
              color="primary"
              prepend-icon="mdi-eye"
              hide-details
            />
          </v-col>
        </v-row>
      </v-form>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" :loading="saving" />

      <v-btn
        :text="!isEditing ? $t('add') : $t('save')"
        :prepend-icon="!isEditing ? 'mdi-plus' : 'mdi-content-save'"
        :disabled="!valid"
        :loading="saving"
        type="submit"
        form="fieldForm"
        variant="elevated"
        color="primary"
      />
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

const emit = defineEmits({
  submit: (item) => !!item,
  'update:modelValue': (item) => !!item,
});

const { t } = useI18n();
const snacks = useSnacksStore();

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const idRules = [
  (v) => !!v || t('fieldIsRequired'),
  (v) => (!v || ID_PATTERN.test(v)) || t('fieldMustMatch', { pattern: ID_PATTERN.toString() }),
];

const saving = ref(false);
const valid = ref(false);
const customField = ref({ ...(props.modelValue ?? {}) });

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

const originalId = computed(() => props.modelValue?.id);
const isEditing = computed(() => !!originalId.value);

async function save() {
  saving.value = true;

  try {
    const newCustomField = await $fetch(`/api/custom-fields/${originalId.value || customField.value.id}`, {
      method: 'PUT',
      body: { ...customField.value },
    });
    emit('submit', newCustomField);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  saving.value = false;
}
</script>
