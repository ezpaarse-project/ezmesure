<template>
  <v-autocomplete
    v-model="selected"
    :items="items"
    :loading="loading"
    :search-input.sync="search"
    :error="error"
    :error-messages="errorMessages"
    :no-data-text="$t('institutions.institution.searchOpenDataHint')"
    no-filter
    clearable
    item-text="uo_lib_officiel"
    :label="$t('institutions.institution.searchOpenData')"
    prepend-icon="mdi-database-search"
    return-object
  >
    <template #item="{ item }">
      <OpenDataSearchItem :item="item" />
    </template>
  </v-autocomplete>
</template>

<script>
import debounce from 'lodash.debounce';
import OpenDataSearchItem from '~/components/OpenDataSearchItem.vue';

export default {
  components: {
    OpenDataSearchItem,
  },
  props: {
    value: {
      type: Object,
      default: () => null,
    },
  },
  data() {
    return {
      search: null,
      items: [],
      loading: false,
      error: false,
    };
  },
  computed: {
    selected: {
      get() { return this.value; },
      set(value) { this.$emit('input', value); },
    },
    errorMessages() {
      return this.error ? [this.$t('institutions.institution.searchFailed')] : [];
    },
  },
  watch: {
    search(value) {
      if (this.selected?.nom !== value) {
        this.doSearch(value);
      }
    },
  },
  methods: {
    doSearch: debounce(async function doSearch() {
      if (!this.search) {
        this.items = [];
        return;
      }

      this.loading = true;
      this.error = false;

      try {
        const { data } = await this.$axios.get('/opendata', { params: { q: this.search } });
        this.items = Array.isArray(data) ? data : [];
      } catch (e) {
        this.error = true;
      }

      this.loading = false;
    }, 500),
  },
};
</script>
