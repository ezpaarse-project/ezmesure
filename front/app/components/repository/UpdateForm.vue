<template>
  <v-card
    :title="$t('repositories.updateForm.title')"
    prepend-icon="mdi-database-plus"
  >
    <template v-if="showRepository" #subtitle>
      {{ modelValue.pattern }}

      <RepositoryTypeChip :model-value="modelValue" class="ml-2" />
    </template>

    <template #text>
      <v-form
        id="repoForm"
        ref="formRef"
        v-model="valid"
        @submit.prevent="save()"
      >
        <v-card
          :title="$t('repositories.updateForm.mapping.properties.title')"
          prepend-icon="mdi-map-legend"
          variant="outlined"
        >
          <template #append>
            <v-menu
              v-model="showPropertyMenu"
              location="left center"
              :offset="10"
              :close-on-content-click="false"
              width="250px"
            >
              <template #activator="{ props: menu }">
                <v-btn
                  v-tooltip="showPropertyMenu ? $t('close') : $t('add')"
                  :icon="showPropertyMenu ? 'mdi-close' : 'mdi-plus'"
                  variant="tonal"
                  :color="showPropertyMenu ? undefined : 'green'"
                  density="comfortable"
                  v-bind="menu"
                />
              </template>

              <div class="d-flex align-center">
                <v-text-field
                  v-model="property"
                  :label="$t('repositories.updateForm.mapping.properties.form.label')"
                  :rules="rules.property.label"
                  variant="outlined"
                  density="compact"
                  class="flex-grow-1"
                  return-object
                  autofocus
                  hide-details
                  auto-select-first
                />

                <v-btn
                  icon="mdi-check"
                  color="primary"
                  density="comfortable"
                  variant="tonal"
                  class="ml-2"
                  @click="addProperty()"
                />
              </div>
            </v-menu>
          </template>

          <template #text>
            <v-row>
              <v-col>
                <div v-if="properties.length <= 0" class="text-secondary">
                  {{ $t('repositories.updateForm.mapping.properties.emptyText') }}
                </div>

                <v-sheet
                  v-for="[key, definition] in properties"
                  v-else
                  :key="key"
                  rounded
                  class="bg-surface-light py-1 px-4 mb-2"
                >
                  <div class="d-flex align-center py-2">
                    <div class="w-50">
                      {{ key }}
                    </div>

                    <v-select
                      v-model="definition.type"
                      :label="$t('repositories.updateForm.mapping.properties.form.type.label')"
                      :items="typesOptions"
                      :rules="rules.property.type"
                      density="comfortable"
                      variant="underlined"
                      hide-details
                    />

                    <v-btn
                      icon="mdi-delete"
                      color="red"
                      density="comfortable"
                      variant="tonal"
                      class="ml-2"
                      @click="removeProperty(key)"
                    />
                  </div>

                  <div class="text-secondary" style="font-size: 0.9em;">
                    {{ $t('repositories.updateForm.mapping.properties.form.subFields.label') }}
                  </div>

                  <v-chip-group
                    v-model="definition.subFields"
                    selected-class="text-primary"
                    multiple
                    class="ml-2"
                  >
                    <v-chip
                      v-for="field in subfieldsOptions"
                      :key="field"
                      v-tooltip:bottom="{ text: field.tooltip, disabled: !field.tooltip }"
                      :text="field.title"
                      :value="field.value"
                      density="compact"
                      size="small"
                    />
                  </v-chip-group>

                  <v-checkbox
                    v-if="AVAILABLE_TYPES[definition.type]?.canBeMalformed"
                    v-model="definition.ignoreMalformed"
                    :label="$t('repositories.updateForm.mapping.properties.form.ignoreMalformed')"
                    density="compact"
                    color="primary"
                    hide-details
                  />
                </v-sheet>
              </v-col>
            </v-row>
          </template>
        </v-card>
      </v-form>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" :loading="saving" />

      <v-btn
        :text="$t('save')"
        :disabled="!valid"
        :loading="saving"
        prepend-icon="mdi-content-save"
        type="submit"
        form="repoForm"
        variant="elevated"
        color="primary"
      />
    </template>
  </v-card>
</template>

<script setup>
const AVAILABLE_TYPES = {
  integer: { canBeMalformed: true },
  float: { canBeMalformed: true },
  keyword: { },
  boolean: { },
  date: { canBeMalformed: true },
  ip: { },
  text: { },
  geo_point: { canBeMalformed: true },
  geo_shape: { canBeMalformed: true },
};

const AVAILABLE_SUBFIELDS = [
  'date',
];

const { modelValue } = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  showRepository: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  submit: (item) => !!item,
});

const { t, te } = useI18n();
const snacks = useSnacksStore();

const saving = shallowRef(false);
const showPropertyMenu = shallowRef(false);
const property = shallowRef('');
const valid = shallowRef(false);
const repository = ref({ ...modelValue });
const properties = ref(Object.entries(modelValue.mapping.properties ?? {}));

/** @type {Ref<Object | null>} */
const formRef = useTemplateRef('formRef');

const rules = computed(() => ({
  property: {
    label: [
      (v) => !!v || $t('fieldIsRequired'),
      (v) => !properties.value.some(([key]) => key === v) || $t('exists'),
    ],
    type: [
      (v) => !!v || $t('fieldIsRequired'),
    ],
  },
}));

const typesOptions = computed(() => Object.keys(AVAILABLE_TYPES).map((value) => {
  const i18nKey = `repositories.updateForm.mapping.properties.form.type.options.${value}`;

  return {
    title: te(i18nKey) ? t(i18nKey) : value,
    value,
    props: {
      subtitle: value,
    },
  };
}));

const subfieldsOptions = computed(() => AVAILABLE_SUBFIELDS.map((value) => {
  const i18nKey = `repositories.updateForm.mapping.properties.form.subFields.options.${value}`;

  return {
    title: te(`${i18nKey}.title`) ? t(`${i18nKey}.title`) : value,
    tooltip: te(`${i18nKey}.tooltip`) ? t(`${i18nKey}.tooltip`) : '',
    value,
  };
}));

function addProperty() {
  properties.value.push([property.value, {}]);
  property.value = '';
  showPropertyMenu.value = false;
}

function removeProperty(targetKey) {
  properties.value = properties.value.filter(([key]) => key !== targetKey);
}

async function save() {
  saving.value = true;

  try {
    const repo = await $fetch(`/api/repositories/${modelValue.pattern}`, {
      method: 'PATCH',
      body: {
        mapping: {
          ...repository.value.mapping,
          properties: Object.fromEntries(properties.value.filter(([, def]) => !!def.type)),
        },
      },
    });

    emit('submit', repo);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }

  saving.value = false;
}

onMounted(() => {
  formRef.value?.validate();
});
</script>
