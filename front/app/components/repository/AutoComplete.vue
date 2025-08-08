<template>
  <v-combobox
    v-model:search="search"
    :model-value="modelValue?.pattern"
    :label="`${$t('repositories.pattern')} *`"
    :items="availableRepositories ?? []"
    :rules="[
      () => !!modelValue?.pattern || $t('fieldIsRequired'),
      () => /^[a-z0-9*_-]+$/i.test(modelValue?.pattern) || $t('invalidFormat'),
    ]"
    :loading="status === 'pending' && 'primary'"
    :error="!!error"
    :error-messages="error?.message"
    :hide-no-data="!search"
    item-title="pattern"
    item-value="pattern"
    prepend-icon="mdi-form-textbox"
    variant="underlined"
    hide-details="auto"
    no-filter
    required
    return-object
    @update:model-value="$emit('update:modelValue', $event);"
  >
    <template #item="{ item: { raw: item }, props: listItem }">
      <v-list-item
        :title="item.pattern"
        lines="two"
        v-bind="listItem"
      >
        <template #subtitle>
          <RepositoryTypeChip :model-value="item" class="ml-1" />
        </template>
      </v-list-item>
    </template>

    <template #no-data>
      <v-list-item>
        <template #title>
          <i18n-t keypath="noMatchFor">
            <template #search>
              <strong>{{ search }}</strong>
            </template>

            <template #key>
              <kbd>{{ $t('enterKey') }}</kbd>
            </template>
          </i18n-t>
        </template>
      </v-list-item>
    </template>
  </v-combobox>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
});

defineEmits({
  'update:modelValue': (repository) => !!repository,
});

const search = shallowRef('');

const pattern = computed(() => props.modelValue?.pattern);
const debouncedPattern = useDebounce(pattern, 250);

const {
  error,
  status,
  data: availableRepositories,
} = await useFetch('/api/repositories', {
  query: {
    q: debouncedPattern,
    sort: 'pattern',
  },
});
</script>
