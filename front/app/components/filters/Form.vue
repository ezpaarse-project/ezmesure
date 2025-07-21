<template>
  <v-card
    :title="title"
    :prepend-icon="prependIcon"
  >
    <template v-if="$slots.subtitle" #subtitle>
      <slot name="subtitle" />
    </template>

    <template #append>
      <v-btn
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="text"
        density="comfortable"
        color="green"
        @click="openForm()"
      />
    </template>

    <template #text>
      <template v-if="filters.length > 0">
        <v-chip
          v-for="filter in filters"
          :key="filter.name"
          :text="filter.name"
          :color="filter.isNot ? 'red' : 'blue'"
          density="compact"
          closable
          class="mr-2"
          @click="openForm(filter)"
          @click:close="removeFilter(filter)"
        />
      </template>
      <template v-else>
        <span class="text-medium-emphasis">{{ $t('repositoryAliases.filtersForm.empty') }}</span>
      </template>

      <v-menu v-model="isFormOpen" :close-on-content-click="false" target="parent">
        <v-card
          :title="isEditing ? $t('repositoryAliases.filtersForm.editFilter') : $t('repositoryAliases.filtersForm.newFilter')"
          prepend-icon="mdi-filter-plus"
          variant="outlined"
        >
          <template v-if="!disableAdvanced" #append>
            <v-btn
              v-tooltip="$t('repositoryAliases.filtersForm.advanced')"
              :color="isRawMode ? 'orange' : 'grey'"
              variant="text"
              icon="mdi-tools"
              density="comfortable"
              @click="isRawMode = !isRawMode"
            />
          </template>

          <template #text>
            <v-form v-model="isValid">
              <template v-if="isRawMode">
                <v-row>
                  <v-col>
                    <v-textarea
                      v-model="rawFilterJSON"
                      :label="$t('repositoryAliases.filtersForm.raw')"
                      prepend-icon="mdi-cursor-text"
                      variant="outlined"
                      required
                    />
                  </v-col>
                </v-row>
              </template>

              <template v-else>
                <v-row>
                  <v-col>
                    <v-combobox
                      v-model="field"
                      :label="$t('repositoryAliases.filtersForm.field')"
                      :items="[]"
                      :rules="[(v) => !!v || $t('fieldIsRequired')]"
                      :return-object="false"
                      prepend-icon="mdi-form-textbox"
                      variant="underlined"
                      required
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col>
                    <v-combobox
                      v-model="values"
                      :label="$t('repositoryAliases.filtersForm.value')"
                      :return-object="false"
                      prepend-icon="mdi-cursor-text"
                      variant="underlined"
                      chips
                      closable-chips
                      multiple
                      required
                    />
                  </v-col>
                </v-row>
              </template>

              <v-row>
                <v-col cols="8">
                  <v-text-field
                    v-model="name"
                    :label="$t('name')"
                    :rules="[(v) => !!v || $t('fieldIsRequired')]"
                    prepend-icon="mdi-rename"
                    variant="underlined"
                    required
                    @update:model-value="hasNameChanged = true"
                  />
                </v-col>

                <v-col cols="4">
                  <v-checkbox v-model="isNot" :label="$t('repositoryAliases.filtersForm.isNot')" />
                </v-col>
              </v-row>
            </v-form>
          </template>

          <template #actions>
            <v-spacer />

            <v-btn
              :text="$t('cancel')"
              variant="text"
              @click="isFormOpen = false"
            />

            <v-btn
              :text="$t('create')"
              prepend-icon="mdi-content-save"
              variant="elevated"
              color="primary"
              @click="submitFilter()"
            />
          </template>
        </v-card>
      </v-menu>
    </template>

    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => undefined,
  },
  title: {
    type: String,
    default: undefined,
  },
  prependIcon: {
    type: String,
    default: () => 'mdi-filter',
  },
  disableAdvanced: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  'update:modelValue': (v) => v === undefined || Array.isArray(v),
});

const { t } = useI18n();

const isFormOpen = ref(false);
const isValid = ref(false);
const isRawMode = ref(false);
const isEditing = ref(false);
const hasNameChanged = ref(false);
const field = ref('');
/** @type {Ref<string[]>} */
const values = ref([]);
const name = ref('');
const isNot = ref(false);
const rawFilterJSON = ref('');

const filters = computed({
  get: () => props.modelValue ?? [],
  set: (v) => { emit('update:modelValue', v.length > 0 ? v : undefined); },
});

function openForm(filter) {
  isEditing.value = !!filter;

  field.value = filter?.field || '';
  name.value = filter?.name || '';
  isNot.value = filter?.isNot || false;

  const rawJSON = '';
  if (filter && 'raw' in filter) {
    rawFilterJSON.value = JSON.stringify(filter.raw, 2);
  } else {
    const value = (Array.isArray(filter?.value) ? filter.value : [filter?.value])
      .filter((v) => !!v);
    values.value = value;
  }

  rawFilterJSON.value = rawJSON;
  isRawMode.value = rawJSON !== '';

  hasNameChanged.value = false;
  isFormOpen.value = true;
}

function submitFilter() {
  const filter = { name: name.value, isNot: isNot.value };
  if (!isRawMode.value) {
    let filterValue = values.value;
    if (filterValue.length === 1) { ([filterValue] = filterValue); }
    if (filterValue.length === 0) { filterValue = undefined; }
    filter.value = filterValue;
    filter.field = field.value;
  } else {
    filter.raw = JSON.parse(rawFilterJSON.value);
  }

  const currFilters = [...filters.value];
  const index = currFilters.findIndex((f) => f.name === filter.name);
  currFilters.splice(index < 0 ? currFilters.length : index, 1, filter);
  filters.value = currFilters;

  isFormOpen.value = false;
}

function removeFilter(filter) {
  filters.value = filters.value.filter((f) => f.name !== filter.name);
}

function generateFilterName() {
  // Don't generate name if it's a raw filter
  if (isRawMode.value) {
    return '';
  }

  // We need a field to generate a name
  if (!field.value) {
    return '';
  }

  // Generate value text
  const valueText = t('repositoryAliases.filtersForm.nameTemplate.values', values.value);

  const data = { field: field.value, valueText };

  // Generate name
  if (values.value.length <= 0) {
    if (isNot.value) {
      return t('repositoryAliases.filtersForm.nameTemplate.exists:not', data);
    }
    return t('repositoryAliases.filtersForm.nameTemplate.exists', data);
  } if (isNot.value) {
    return t('repositoryAliases.filtersForm.nameTemplate.is:not', data);
  }
  return t('repositoryAliases.filtersForm.nameTemplate.is', data);
}

/**
 * Generate name when filter changes
 */
watch(computed(() => [field.value, values.value, isNot.value]), () => {
  if (isEditing.value || hasNameChanged.value) {
    return;
  }

  const n = generateFilterName();
  if (n) {
    name.value = n;
  }
}, { deep: true });
</script>
