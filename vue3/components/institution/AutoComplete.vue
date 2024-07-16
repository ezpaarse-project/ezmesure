<template>
  <v-autocomplete
    v-model:search="search"
    :model-value="modelValue"
    :items="institutions"
    :loading="status === 'pending'"
    :label="label"
    :rules="rules"
    :error="!!error"
    :error-messages="error?.message"
    item-title="name"
    variant="outlined"
    hide-no-data
    hide-details
    clearable
    required
    autofocus
    return-object
    @update:model-value="$emit('update:modelValue', $event)"
    @update:search="debouncedRefresh()"
  >
    <template #item="{ item: { raw: item }, props: listItem }">
      <v-list-item
        :prepend-avatar="item.logoId ? `/api/assets/logos/${item.logoId}` : undefined"
        :prepend-icon="item.logoId ? undefined : 'mdi-office-building'"
        :title="item.name"
        :subtitle="item.city"
        v-bind="listItem"
      />
    </template>
  </v-autocomplete>
</template>

<script setup>
import { debounce } from 'lodash';

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
  'update:modelValue': (institution) => true,
});

const { t } = useI18n();

const search = ref('');

const {
  data: institutions,
  status,
  refresh,
  error,
} = await useFetch('/api/institutions', {
  query: {
    q: search.value,
  },
});

const debouncedRefresh = debounce(() => refresh(), 250);

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
