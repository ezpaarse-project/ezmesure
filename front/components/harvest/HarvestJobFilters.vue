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
          <v-select
            :value="value.harvestId"
            :items="harvestIdsItems"
            :label="$t('harvest.jobs.harvestId')"
            prepend-icon="mdi-key"
            clearable
            hide-details
            @change="updateFilter('harvestId', $event)"
          />
        </v-col>
      </v-row>

      <v-row v-if="!disabledFiltersSet.has('vendor')">
        <v-col>
          <v-select
            :value="value.vendor"
            :items="vendorsItems"
            :label="$t('endpoints.vendor')"
            prepend-icon="mdi-web"
            clearable
            hide-details
            @change="updateFilter('vendor', $event)"
          />
        </v-col>
      </v-row>

      <v-row v-if="!disabledFiltersSet.has('institution')">
        <v-col>
          <v-select
            :value="value.institution"
            :items="institutionsItems"
            :label="$t('institutions.title')"
            prepend-icon="mdi-domain"
            clearable
            hide-details
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

      <v-row v-if="!disabledFiltersSet.has('tags')">
        <v-col>
          <v-select
            :value="value.tags"
            :items="tagsItems"
            :label="$t('endpoints.tags')"
            prepend-icon="mdi-tag"
            clearable
            hide-details
            @change="updateFilter('tags', $event)"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-navigation-drawer>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
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
      return this.vendors.map(({ id, vendor }) => ({ value: id, text: vendor }));
    },
    institutionsItems() {
      return this.institutions.map(({ id, name, acronym }) => ({
        value: id,
        text: `${name}${acronym ? ` (${acronym})` : ''}`,
      }));
    },
    reportTypesItems() {
      return this.reportTypes.map((value) => ({ value, text: value.toUpperCase() }));
    },
    tagsItems() {
      return this.tags.map((value) => ({ value, text: value }));
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
