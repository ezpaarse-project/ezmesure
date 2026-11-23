<template>
  <v-autocomplete
    v-model:search="search"
    :model-value="modelValue?.vendor"
    :label="`${$t('institutions.sushi.endpoint')} *`"
    :items="availableEndpoints ?? []"
    :rules="[v => !!v || $t('institutions.sushi.pleaseSelectEndpoint')]"
    :loading="status === 'pending' && 'primary'"
    :error="!!error"
    :error-messages="error?.message"
    :hide-no-data="!search"
    item-title="vendor"
    item-value="id"
    prepend-icon="$mdi-api"
    variant="underlined"
    no-filter
    clearable
    autofocus
    required
    return-object
    @update:model-value="modelValue = $event"
  >
    <template #item="{ item, props: listItem }">
      <v-list-item
        :title="item.vendor"
        :subtitle="item.sushiUrl"
        lines="two"
        v-bind="listItem"
      >
        <template #append>
          <div class="d-flex flex-column align-end">
            <div>
              <v-chip
                v-for="tag in item.tags ?? []"
                :key="tag"
                :text="tag"
                color="accent"
                density="comfortable"
                size="small"
                variant="outlined"
                label
                class="ml-2"
              />

              <SushiEndpointVersionsChip :model-value="item" size="small" end />
            </div>

            <SushiEndpointStatusChip :model-value="item" size="small" end />
          </div>
        </template>
      </v-list-item>
    </template>

    <template v-if="showNoData" #no-data>
      <v-list-item
        :title="$t('endpoints.noEndpointFound')"
        :subtitle="$t('endpoints.clickToDeclareOne')"
        prepend-icon="$mdi-plus-circle-outline"
        to="/contact-us?subject=sushi-endpoint"
        lines="two"
      />
    </template>
  </v-autocomplete>

  <v-slide-y-transition>
    <v-row v-if="modelValue" density="compact" class="mx-4">
      <v-col cols="8">
        <v-list-item
          :subtitle="$t('institutions.sushi.sushiUrl')"
          density="compact"
          slim
        >
          <template #title>
            <a :href="modelValue.sushiUrl" target="_blank" rel="noopener noreferrer">
              {{ modelValue.sushiUrl }}
            </a>

            <v-icon
              icon="$mdi-open-in-new"
              size="small"
              color="secondary"
              end
            />
          </template>
        </v-list-item>
      </v-col>

      <v-col class="d-flex flex-column align-end">
        <div>
          <v-chip
            v-for="tag in modelValue.tags ?? []"
            :key="tag"
            :text="tag"
            color="accent"
            size="small"
            density="comfortable"
            variant="outlined"
            label
            class="ml-2"
          />

          <SushiEndpointVersionsChip :model-value="modelValue" size="small" end />
        </div>

        <SushiEndpointStatusChip :model-value="modelValue" size="small" end />
      </v-col>

      <v-col cols="12" class="text-end">
        <v-btn
          v-if="registryUrl"
          :text="$t('endpoints.registryUrl')"
          :href="registryUrl"
          target="_blank"
          rel="noopener noreferrer"
          prepend-icon="$mdi-open-in-new"
          color="secondary"
          variant="outlined"
        />
      </v-col>
    </v-row>
  </v-slide-y-transition>
</template>

<script setup>
defineProps({
  showNoData: {
    type: Boolean,
    default: false,
  },
});

const modelValue = defineModel({
  type: Object,
  default: () => undefined,
});

const { data: apiConfig } = await useApiConfig();

const search = shallowRef('');
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
  lazy: true,
});

const registryUrl = computed(() => {
  if (!modelValue.value?.registryId) {
    return undefined;
  }

  return URL.parse(`/platform/${modelValue.value.registryId}`, apiConfig.value.counter.registryUrl);
});
</script>
