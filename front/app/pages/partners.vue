<template>
  <v-container>
    <v-row class="mb-4">
      <v-col class="text-center">
        <v-icon icon="mdi-charity" size="100" color="pink" />

        <h1>{{ title }}</h1>

        <v-text-field
          v-model="search"
          :label="$t('partners.search')"
          variant="outlined"
          append-inner-icon="mdi-magnify"
          hide-details
          class="my-3"
        />
      </v-col>

      <v-divider />
    </v-row>

    <template v-if="status === 'pending' && !partners">
      <v-row v-for="row in 3" :key="row">
        <v-col v-for="col in 3" :key="col" cols="12" sm="6" lg="4">
          <v-skeleton-loader type="card, paragraph" elevation="1" />
        </v-col>
      </v-row>
    </template>
    <v-row v-else>
      <v-col
        v-for="partner in filteredPartners"
        :key="partner.id"
        cols="12"
        sm="6"
        lg="4"
      >
        <PartnerCard :partner="partner" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const { t } = useI18n();

const search = ref('');

const {
  status,
  data: partners,
} = await useFetch('/api/partners', { lazy: true });

function sortByName(a, b) {
  return a.name.localeCompare(b.name);
}

const filteredPartners = computed(() => {
  if (!partners.value) {
    return [];
  }

  const query = search.value.toLowerCase();
  if (!query) {
    return partners.value.slice().sort(sortByName);
  }

  const items = partners.value.filter((partner) => {
    const {
      name,
      acronym,
      techContactName,
      docContactName,
    } = partner;

    if (name?.toLowerCase?.()?.includes(query)) { return true; }
    if (acronym?.toLowerCase?.()?.includes(query)) { return true; }
    if (techContactName?.toLowerCase?.()?.includes(query)) { return true; }
    if (docContactName?.toLowerCase?.()?.includes(query)) { return true; }
    return false;
  });

  return items.sort(sortByName);
});

const title = computed(() => {
  if (!partners.value) {
    return t('partners.count', { count: '???' });
  }

  if (filteredPartners.value.length === partners.value.length) {
    return t('partners.count', { count: partners.value.length });
  }
  return t('partners.filteredCount', { count: filteredPartners.value.length, total: partners.value.length });
});

</script>
