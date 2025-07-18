<template>
  <v-autocomplete
    v-model="selected"
    :label="$t('endpoints.searchRegistryData')"
    :items="items ?? []"
    :loading="(status === 'pending' || endpointLoading) && 'primary'"
    :error="!!error"
    :error-messages="error ? [error.message] : []"
    no-data-text="endpoints.searchRegistryDataHint"
    item-value="id"
    item-title="name"
    prepend-icon="mdi-database-search"
    hide-details="auto"
    clearable
    return-object
    @click:clear="selected = null"
  >
    <template #item="{ item: { raw: item }, props: listItem }">
      <v-list-item
        :title="item.vendor"
        :subtitle="item.website"
        lines="two"
        v-bind="listItem"
      >
        <template #append>
          <SushiEndpointVersionsChip :model-value="item" end />
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => null,
  },
});

const emit = defineEmits({
  'update:modelValue': (value) => typeof value === 'object',
  'update:endpoint': (value) => typeof value === 'object',
});

const { t } = useI18n();
const snacks = useSnacksStore();

const endpointLoading = ref(false);

const {
  data: items,
  status,
  error,
} = await useFetch(
  '/api/sushi-endpoints/_registry/',
  { lazy: true },
);

async function fetchEndpoint(id) {
  endpointLoading.value = true;
  try {
    const endpoint = await $fetch(`/api/sushi-endpoints/_registry/${id}`);
    emit('update:endpoint', endpoint);
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
  endpointLoading.value = false;
}

const selected = computed({
  get: () => props.modelValue,
  set: (v) => {
    if (v) {
      fetchEndpoint(v.id);
    } else {
      emit('update:endpoint', undefined);
    }
    emit('update:modelValue', v);
  },
});
</script>
