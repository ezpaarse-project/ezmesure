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
      <template v-if="filterMap.size > 0">
        <v-chip
          v-for="[key, filter] in filterMap"
          :key="key"
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
          :title="editingFilter ? $t('repositoryAliases.filtersForm.editFilter') : $t('repositoryAliases.filtersForm.newFilter')"
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
                    <MultiTextField
                      v-model="values"
                      :label="$t('repositoryAliases.filtersForm.value')"
                      prepend-icon="mdi-cursor-text"
                      variant="underlined"
                    />
                  </v-col>
                </v-row>
              </template>

              <v-row>
                <v-col cols="8">
                  <p class="text-medium-emphasis">
                    {{ $t('$ezreeport.editor.filters.hints.type') }}

                    <ul class="pl-3">
                      <li>{{ $t('$ezreeport.editor.filters.hints.type:exists') }}</li>
                      <li>{{ $t('$ezreeport.editor.filters.hints.type:is') }}</li>
                      <li>{{ $t('$ezreeport.editor.filters.hints.type:in') }}</li>
                    </ul>
                  </p>
                </v-col>

                <v-col cols="4">
                  <v-checkbox v-model="isNot" :label="$t('$ezreeport.editor.filters.isNot')" />

                  <v-text-field
                    :model-value="filterType"
                    :label="$t('$ezreeport.editor.filters.type')"
                    variant="plain"
                    prepend-icon="mdi-format-list-bulleted"
                    disabled
                  />
                </v-col>
              </v-row>

              <v-row>
                <v-col>
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
              :disabled="!isValid"
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

const isFormOpen = shallowRef(false);
const isValid = shallowRef(false);
const isRawMode = shallowRef(false);
/** @type {Ref<object|null>} */
const editingFilter = ref(null);
const hasNameChanged = shallowRef(false);
const field = shallowRef('');
/** @type {Ref<string[]>} */
const values = ref([]);
const name = shallowRef('');
const isNot = shallowRef(false);
const rawFilterJSON = shallowRef('');

const filterMap = ref(new Map(props.modelValue?.map((f) => [f.name, f])));

/** Type of the filter */
const filterType = computed(() => {
  if (isRawMode.value) {
    return '';
  }
  if (values.value == null || values.value?.length === 0) {
    return t('$ezreeport.editor.filters.types.exists');
  }
  if (Array.isArray(values.value)) {
    return t('$ezreeport.editor.filters.types.in');
  }
  return t('$ezreeport.editor.filters.types.is');
});

function updateFilters() {
  const vals = Array.from(filterMap.value.values());
  emit('update:modelValue', vals.length > 0 ? vals : undefined);
}

function openForm(filter) {
  editingFilter.value = filter && { ...filter };

  field.value = filter?.field || '';
  name.value = filter?.name || '';
  isNot.value = filter?.isNot || false;

  let rawJSON = '';
  if (filter && 'raw' in filter) {
    rawJSON = JSON.stringify(filter.raw, undefined, 2);
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

  filterMap.value.set(editingFilter.value?.name ?? filter.name, filter);
  updateFilters();

  isFormOpen.value = false;
  editingFilter.value = null;
}

function removeFilter(filter) {
  filterMap.value.delete(filter.name);
  updateFilters();
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

  // Ensure values are an array
  let vals = values.value ?? '';
  if (!Array.isArray(vals)) {
    vals = [vals];
  }

  // Generate value text
  const valueText = t('$ezreeport.editor.filters.nameTemplate.values', vals, vals.length - 1);
  const data = { field: field.value, valueText };

  // Generate name
  if (values.value == null) {
    if (isNot.value) {
      return t('$ezreeport.editor.filters.nameTemplate.exists:not', data);
    }
    return t('$ezreeport.editor.filters.nameTemplate.exists', data);
  } if (isNot.value) {
    return t('$ezreeport.editor.filters.nameTemplate.is:not', data);
  }
  return t('$ezreeport.editor.filters.nameTemplate.is', data);
}

/**
 * Generate name when filter changes
 */
watch(computed(() => [field.value, values.value, isNot.value]), () => {
  if (editingFilter.value || hasNameChanged.value) {
    return;
  }

  const n = generateFilterName();
  if (n) {
    name.value = n;
  }
}, { deep: true });
</script>
