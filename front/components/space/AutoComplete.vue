<template>
  <v-autocomplete
    v-model:search="name"
    :model-value="modelValue"
    :label="`${$t('name')} *`"
    :items="availableSpaces ?? []"
    :rules="[
      (v) => !!v?.id || $t('fieldIsRequired'),
    ]"
    :loading="status === 'pending' && 'primary'"
    :error="!!error"
    :error-messages="error?.message"
    item-title="name"
    item-value="id"
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
        :title="item.name"
        lines="two"
        v-bind="listItem"
      >
        <template #subtitle>
          <RepositoryTypeChip :model-value="item" class="ml-1" />
        </template>
      </v-list-item>
    </template>

    <template #message="{ message }">
      <span v-if="message">{{ message }}</span>
      <RepositoryTypeChip v-if="modelValue" :model-value="modelValue" class="ml-1" />
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

const name = ref(props.modelValue?.name);
const debouncedName = useDebounce(name, 250);

const {
  error,
  status,
  data: availableSpaces,
} = await useFetch('/api/kibana-spaces', {
  query: {
    q: debouncedName,
    sort: 'name',
  },
});
</script>
