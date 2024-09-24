<template>
  <v-autocomplete
    v-model:search="search"
    :model-value="modelValue?.vendor"
    :label="`${$t('institutions.sushi.endpoint')} *`"
    :items="availableEndpoints ?? []"
    :rules="[v => !!v || $t('institutions.sushi.pleaseSelectEndpoint')]"
    :loading="status === 'pending'"
    :error="!!error"
    :error-messages="error?.message"
    :hide-no-data="!search"
    :hint="modelValue?.sushiUrl"
    item-title="vendor"
    item-value="id"
    prepend-icon="mdi-api"
    variant="underlined"
    persistent-hint
    no-filter
    clearable
    autofocus
    required
    return-object
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #item="{ item: { raw: item }, props: listItem }">
      <v-list-item
        :title="item.vendor"
        lines="two"
        v-bind="listItem"
      >
        <template #subtitle>
          <v-chip
            v-for="tag in item.tags ?? []"
            :key="tag"
            :text="tag"
            color="accent"
            size="x-small"
            density="comfortable"
            variant="outlined"
            label
            class="ml-2"
          />
        </template>
      </v-list-item>
    </template>

    <template v-if="showNoData" #no-data>
      <v-list-item
        :title="$t('endpoints.noEndpointFound')"
        :subtitle="$t('endpoints.clickToDeclareOne')"
        prepend-icon="mdi-plus-circle-outline"
        to="/contact-us?subject=sushi-endpoint"
        lines="two"
      />
    </template>
  </v-autocomplete>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
  showNoData: {
    type: Boolean,
    default: false,
  },
});

defineEmits({
  'update:modelValue': (repository) => !!repository,
});

const search = ref('');
const q = debouncedRef(search, 250);

const {
  error,
  status,
  data: availableEndpoints,
} = await useFetch('/api/sushi-endpoints', {
  query: {
    q,
    sort: 'vendor',
  },
});
</script>
