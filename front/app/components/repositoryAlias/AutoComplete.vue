<template>
  <v-autocomplete
    v-model:search="pattern"
    :model-value="modelValue"
    :label="`${$t('repositories.pattern')} *`"
    :items="availableAliases ?? []"
    :rules="[
      (v) => !!v?.pattern || $t('fieldIsRequired'),
      (v) => /^[a-z0-9_-]+$/i.test(v?.pattern) || $t('invalidFormat'),
    ]"
    :loading="status === 'pending' && 'primary'"
    :error="!!error"
    :error-messages="error?.message"
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
          <RepositoryTypeChip :model-value="item.repository" class="ml-1" />
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
});

defineEmits({
  'update:modelValue': (alias) => !!alias,
});

const pattern = ref(props.modelValue?.pattern);
const debouncedPattern = useDebounce(pattern, 250);

const {
  error,
  status,
  data: availableAliases,
} = await useFetch('/api/repository-aliases', {
  query: {
    q: debouncedPattern,
    sort: 'pattern',
    include: ['repository'],
  },
});
</script>
