<template>
  <v-combobox
    :value="modelValue.pattern"
    :label="`${$t('repositories.pattern')} *`"
    :items="availableRepositories ?? []"
    :rules="[
      () => !!modelValue.pattern || $t('fieldIsRequired'),
      () => /^[a-z0-9*_-]+$/i.test(modelValue.pattern) || $t('invalidFormat'),
    ]"
    :error="!!error"
    :error-messages="error?.message"
    no-filter
    item-title="pattern"
    prepend-icon="mdi-form-textbox"
    variant="underlined"
    hide-details="auto"
    required
    return-object
    @update:model-value="$emit('update:modelValue', $event)"
    @update:search="debouncedRefresh()"
  >
    <template #item="{ item: { raw: item }, props: listItem }">
      <v-list-item
        :title="item.pattern"
        lines="two"
        v-bind="listItem"
      >
        <template #subtitle>
          <v-chip
            :text="item.type"
            :color="repoColors.get(item.type)"
            size="x-small"
            density="comfortable"
            class="ml-2"
          />
        </template>
      </v-list-item>
    </template>
  </v-combobox>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

defineEmits({
  'update:modelValue': (repository) => !!repository,
});

const pattern = computed(() => props.modelValue?.pattern);

const {
  error,
  refresh,
  data: availableRepositories,
} = await useFetch('/api/repositories', {
  query: {
    q: pattern,
    sort: 'pattern',
  },
});

const debouncedRefresh = useDebounceFn(refresh, 250);
</script>
