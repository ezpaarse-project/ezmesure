<template>
  <v-combobox
    v-if="isMultiple"
    ref="combobox"
    v-bind="$attrs"
    :model-value="modelValue.value"
    :readonly="readonly"
    multiple
    chips
    closable-chips
    clearable
    @update:model-value="emit('update:modelValue', { ...modelValue, value: $event })"
  >
    <template v-if="readonly" #append-inner>
      <v-chip
        prepend-icon="mdi-lock"
        variant="tonal"
        size="small"
        label
      >
        {{ $t('notEditable') }}
      </v-chip>
    </template>

    <template #label>
      <CustomFieldLabel :model-value="field" />
    </template>

    <template #append>
      <v-menu>
        <template #activator="{ props: menu }">
          <v-slide-x-reverse-transition>
            <v-btn
              v-if="hasItemsUrls"
              icon="mdi-open-in-new"
              density="comfortable"
              color="accent"
              variant="text"
              v-bind="menu"
            />
          </v-slide-x-reverse-transition>
        </template>

        <v-list>
          <v-list-item
            v-for="(itemUrl, index) in itemsUrl"
            :key="index"
            :title="itemUrl"
            :href="itemUrl"
            target="_blank"
            rel="noopener noreferrer"
            append-icon="mdi-open-in-new"
          />
        </v-list>
      </v-menu>
    </template>
  </v-combobox>

  <v-text-field
    v-else
    ref="textfield"
    v-bind="$attrs"
    :model-value="modelValue.value"
    :readonly="readonly"
    @update:model-value="emit('update:modelValue', { ...modelValue, value: $event })"
  >
    <template v-if="readonly" #append-inner>
      <v-chip
        prepend-icon="mdi-lock"
        variant="tonal"
        size="small"
        label
      >
        {{ $t('notEditable') }}
      </v-chip>
    </template>

    <template #label>
      <CustomFieldLabel :model-value="field" />
    </template>

    <template #append>
      <v-slide-x-reverse-transition>
        <v-btn
          v-if="hasItemsUrls"
          :title="itemsUrl[0]"
          :href="itemsUrl[0]"
          icon="mdi-open-in-new"
          density="comfortable"
          color="accent"
          variant="text"
          target="_blank"
          rel="noopener noreferrer"
        />
      </v-slide-x-reverse-transition>
    </template>
  </v-text-field>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  'update:modelValue': (value) => !!value,
});

const comboRef = useTemplateRef('combobox');
const textRef = useTemplateRef('textfield');

const field = computed(() => props.modelValue.field);

const isMultiple = computed(() => field.value.multiple);

const itemsUrl = computed(() => {
  if (!field?.value?.itemUrl) { return []; }

  let fieldValues = props.modelValue.value;

  if (typeof fieldValues === 'string') {
    fieldValues = [fieldValues];
  } else if (!Array.isArray(fieldValues)) {
    fieldValues = [];
  }

  return fieldValues
    .filter((value) => !!value)
    .map((fieldValue) => field.value?.itemUrl?.replace('{value}', encodeURIComponent(fieldValue ?? '')))
    .filter((url) => !!url);
});

const hasItemsUrls = computed(() => itemsUrl.value.length > 0);

function focus() {
  if (comboRef.value) { comboRef.value.focus(); }
  if (textRef.value) { textRef.value.focus(); }
}

defineExpose({ focus });
</script>
