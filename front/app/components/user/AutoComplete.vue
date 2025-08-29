<template>
  <v-autocomplete
    v-model:search="search"
    :model-value="modelValue"
    :items="users ?? []"
    :loading="status === 'pending' && 'primary'"
    :label="label"
    :rules="rules"
    :error="!!error"
    :error-messages="error?.message"
    item-value="username"
    item-title="fullName"
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
      <v-avatar icon="mdi-account" />
    </template>

    <template #item="{ item: { raw: item }, props: listItem }">
      <v-list-item
        :title="item.fullName"
        :subtitle="item.email"
        lines="two"
        v-bind="listItem"
      >
        <template #prepend>
          <v-avatar icon="mdi-account" />
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
  'update:modelValue': (user) => user === undefined || !!user,
});

const { t } = useI18n();

const search = shallowRef('');
const debouncedSearch = refDebounced(search, 250);

const {
  data: users,
  status,
  error,
} = await useFetch('/api/users', {
  query: {
    q: debouncedSearch,
    source: '*',
    sort: 'username',
  },
});

const label = computed(() => {
  const title = t('users.title');
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
