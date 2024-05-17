<template>
  <v-navigation-drawer
    :value="show"
    right
    absolute
    temporary
    width="512"
    @input="$emit('update:show', $event)"
  >
    <v-toolbar flat>
      <v-toolbar-title>
        {{ $t('harvest.jobs.filtersTitle') }}
      </v-toolbar-title>

      <v-spacer />

      <v-btn text @click="clearFilters">
        <v-icon left>
          mdi-filter-off
        </v-icon>
        {{ $t('reset') }}
      </v-btn>

      <v-btn icon @click="$emit('update:show', false)">
        <v-icon>
          mdi-close
        </v-icon>
      </v-btn>
    </v-toolbar>

    <v-container>
      <v-row v-if="!disabledFiltersSet.has('harvestId')">
        <v-col>
          <SelectFilter
            :value="value.harvestId"
            :items="harvestIdsItems"
            :label="$t('harvest.jobs.harvestId')"
            icon="mdi-key"
            @change="updateFilter('harvestId', $event)"
          />
        </v-col>
      </v-row>

      <v-row v-if="!disabledFiltersSet.has('vendor')">
        <v-col>
          <SelectFilter
            :value="value.vendor"
            :items="vendorsItems"
            :label="$t('endpoints.vendor')"
            icon="mdi-web"
            @change="updateFilter('vendor', $event)"
          />
        </v-col>
      </v-row>

      <v-row v-if="!disabledFiltersSet.has('institution')">
        <v-col>
          <SelectFilter
            :value="value.institution"
            :items="institutionsItems"
            :label="$t('institutions.title')"
            icon="mdi-domain"
            @change="updateFilter('institution', $event)"
          />
        </v-col>
      </v-row>

      <v-row v-if="!disabledFiltersSet.has('reportType') || !disabledFiltersSet.has('status')">
        <v-col v-if="!disabledFiltersSet.has('reportType')">
          <v-select
            :value="value.reportType"
            :items="reportTypesItems"
            :label="$t('harvest.jobs.reportType')"
            prepend-icon="mdi-format-list-bulleted-type"
            clearable
            hide-details
            @change="updateFilter('reportType', $event)"
          />
        </v-col>

        <v-col v-if="!disabledFiltersSet.has('status')">
          <v-select
            :value="value.status"
            :items="statusesItems"
            :label="$t('status')"
            prepend-icon="mdi-list-status"
            clearable
            hide-details
            @change="updateFilter('status', $event)"
          />
        </v-col>
      </v-row>

      <v-row v-if="!disabledFiltersSet.has('packages')">
        <v-col>
          <SelectFilter
            :value="value.packages"
            :items="packageItems"
            :label="$t('institutions.sushi.packages')"
            icon="mdi-tag"
            @change="updateFilter('packages', $event)"
          />
        </v-col>
      </v-row>

      <v-row v-if="!disabledFiltersSet.has('tags')">
        <v-col>
          <SelectFilter
            :value="value.tags"
            :items="tagsItems"
            :label="$t('endpoints.tags')"
            icon="mdi-tag"
            @change="updateFilter('tags', $event)"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-navigation-drawer>
</template>

<script>
import { defineComponent } from 'vue';
import SelectFilter from '../filters-form/SelectFilter.vue';

export default defineComponent({
  components: {
    SelectFilter,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    show: {
      type: Boolean,
      required: true,
    },
    disabledFilters: {
      type: Array,
      default: () => [],
    },
    harvestIds: {
      type: Array,
      default: () => [],
    },
    vendors: {
      type: Array,
      default: () => [],
    },
    institutions: {
      type: Array,
      default: () => [],
    },
    reportTypes: {
      type: Array,
      default: () => [],
    },
    tags: {
      type: Array,
      default: () => [],
    },
    packages: {
      type: Array,
      default: () => [],
    },
    statuses: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    disabledFiltersSet() {
      return new Set(this.disabledFilters);
    },
    harvestIdsItems() {
      return this.harvestIds.map((value) => ({ value, text: value }));
    },
    vendorsItems() {
      return this.vendors
        .map(({ id, vendor }) => ({ value: id, text: vendor }))
        .sort((a, b) => a.text.localeCompare(b.text));
    },
    institutionsItems() {
      return this.institutions.map(
        ({ id, name, acronym }) => ({
          value: id,
          text: `${name}${acronym ? ` (${acronym})` : ''}`,
        }),
      ).sort((a, b) => a.text.localeCompare(b.text));
    },
    reportTypesItems() {
      return this.reportTypes.map((value) => ({ value, text: value.toUpperCase() }));
    },
    tagsItems() {
      return this.tags
        .map((value) => ({ value, text: value }))
        .sort((a, b) => a.text.localeCompare(b.text));
    },
    packageItems() {
      return this.packages
        .map((value) => ({ value, text: value }))
        .sort((a, b) => a.text.localeCompare(b.text));
    },
    statusesItems() {
      return this.statuses.map((value) => ({
        value,
        text: this.$te(`tasks.status.${value}`) ? this.$tc(`tasks.status.${value}`) : value,
      }));
    },
  },
  methods: {
    updateFilter(key, value) {
      this.$emit('input', { ...this.value, [key]: value });
    },
    clearFilters() {
      this.$emit('input', {});
    },
  },
});
</script>
