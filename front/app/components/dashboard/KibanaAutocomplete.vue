<template>
  <v-autocomplete
    v-model:search="search"
    v-model="selectedDashboard"
    :label="`${$t('name')} *`"
    :items="availableDashboards ?? []"
    :rules="[
      (v) => !!v?.id || $t('fieldIsRequired'),
    ]"
    :loading="status === 'pending' && 'primary'"
    :error="!!error"
    :error-messages="error?.message"
    item-title="attributes.title"
    item-value="id"
    prepend-icon="$mdi-form-textbox"
    variant="underlined"
    no-filter
    required
    return-object
  />
</template>

<script setup>
const props = defineProps({
  spaceId: {
    type: String,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const selectedDashboard = defineModel({ type: [String, Object] });

const search = ref('');
const debouncedSearch = useDebounce(search, 250);

const spacePrefix = computed(() => (props.spaceId ? `s/${props.spaceId}/` : ''));
const searchUrl = computed(() => `/api/kibana/${spacePrefix.value}api/saved_objects/_find`);

const {
  error,
  status,
  data: kibanaResponse,
} = await useFetch(searchUrl, {
  query: {
    search: debouncedSearch,
    type: 'dashboard',
    search_fields: 'title',
  },
});

const availableDashboards = computed(() => kibanaResponse.value?.saved_objects ?? []);

</script>
