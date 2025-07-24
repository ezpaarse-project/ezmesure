<template>
  <v-autocomplete
    v-model:search="search"
    :model-value="modelValue"
    :items="institutions ?? []"
    :loading="status === 'pending' && 'primary'"
    :label="label"
    :rules="rules"
    :error="!!error"
    :error-messages="error?.message"
    item-title="name"
    variant="outlined"
    hide-details="auto"
    no-filter
    hide-no-data
    clearable
    required
    return-object
    @update:model-value="$emit('update:modelValue', $event)"
    @click:clear="$emit('update:modelValue', undefined)"
  >
    <template #prepend>
      <InstitutionAvatar :institution="modelValue" />
    </template>

    <template #item="{ item: { raw: item }, props: listItem }">
      <v-list-item
        :title="item.name"
        :subtitle="item.city"
        lines="two"
        v-bind="listItem"
      >
        <template #prepend>
          <InstitutionAvatar :institution="item" />
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
  required: {
    type: Boolean,
    default: false,
  },
});

defineEmits({
  'update:modelValue': (institution) => institution === undefined || !!institution,
});

const { t } = useI18n();

const search = shallowRef('');
const debouncedSearch = refDebounced(search, 250);

const {
  data: institutions,
  status,
  error,
} = await useFetch('/api/institutions', {
  query: {
    q: debouncedSearch,
    sort: 'name',
  },
});

const label = computed(() => {
  const title = t('institutions.title');
  if (props.required) {
    return `${title} *`;
  }
  return title;
});

const rules = computed(() => {
  if (props.required) {
    return [(v) => !!v || t('fieldIsRequired')];
  }
  return [];
});
</script>
