<template>
  <v-autocomplete
    v-model="selected"
    v-model:search="search"
    :label="$t('institutions.institution.searchOpenData')"
    :items="items"
    :loading="loading"
    :error="hasError"
    :error-messages="hasError ? [$t('institutions.institution.searchFailed')] : []"
    no-data-text="institutions.institution.searchOpenDataHint"
    prepend-icon="mdi-database-search"
    hide-details="auto"
    no-filter
    clearable
    return-object
    @update:search="selectedName !== $event && fetchData()"
  >
    <template #item="{ item: { raw: item }, props: { active, onClick } }">
      <OpenDataSearchItem
        :item="item"
        :active="active"
        @click="onClick"
      />
    </template>

    <template #selection>
      {{ selectedName }}
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
});

const search = ref('');
const loading = ref(false);
const hasError = ref(false);
const items = ref([]);

const selected = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});
const selectedName = computed(() => selected.value?.uo_lib_officiel || selected.value?.uo_lib);

const fetchData = useDebounceFn(async () => {
  if (!search) {
    items.value = [];
  }

  loading.value = true;
  hasError.value = false;
  try {
    items.value = await $fetch('/api/opendata', {
      query: {
        q: search.value,
      },
    });
  } catch (err) {
    hasError.value = true;
  }

  loading.value = false;
}, 250);
</script>
