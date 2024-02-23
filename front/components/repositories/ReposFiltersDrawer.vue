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
        {{ $t('repositories.filters.title') }}
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
      <v-row>
        <v-col>
          <v-text-field
            :value="search || value.pattern?.value"
            :label="$t('repositories.pattern')"
            :disabled="!!search"
            :messages="search ? [$t('users.filters.searchHint')] : []"
            prepend-icon="mdi-pound"
            hide-details="auto"
            @change="onFilterUpdate('pattern', { value: $event })"
          />
        </v-col>

        <v-col>
          <v-select
            :value="value.type?.value"
            :label="$t('repositories.type')"
            :items="typeItems"
            prepend-icon="mdi-format-list-checks"
            hide-details="auto"
            @change="onFilterUpdate('type', { value: $event })"
          />
        </v-col>
      </v-row>

      <v-row class="px-0 mt-8">
        <v-col style="position: relative;">
          <RangeFilter
            :value="value.institutionsRange?.value"
            :label="$t('repositories.institutions')"
            :max="maxInstitutionsCount"
            icon="mdi-domain"
            @input="onFilterUpdate('institutionsRange', { value: $event })"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-navigation-drawer>
</template>

<script>
import RangeFilter from '../filters-form/RangeFilter.vue';

export default {
  components: { RangeFilter },
  props: {
    value: {
      type: Object,
      required: true,
    },
    show: {
      type: Boolean,
      required: true,
    },
    search: {
      type: String,
      default: '',
    },
    maxInstitutionsCount: {
      type: Number,
      default: 0,
    },
  },
  emits: ['input', 'update:show'],
  computed: {
    /**
         * Type list for v-select, with dynamic disabled state and no_permissions item
         */
    typeItems() {
      return ['ezpaarse', 'counter5'].map((value) => ({
        value,
        text: this.$t(`spaces.types.${value}`),
      }));
    },
    institutionsRange: {
      get() {
        return this.partialToRange(this.value.institutionsRange?.value, this.maxInstitutionsCount);
      },
      set(val) {
        this.updateRangeWithPartial('institutionsRange', val, this.maxInstitutionsCount);
      },
    },
  },
  methods: {
    /**
         * Update filter value and attributes
         *
         * @param {string} field The concerned filter
         * @param {string} attrs The new attributes of the filter
         */
    onFilterUpdate(field, attrs) {
      const filters = { ...this.value };
      filters[field] = { ...(filters[field] ?? {}), ...attrs };
      this.$emit('input', filters);
    },
    /**
         * Reset all filters
         */
    clearFilters() {
      this.$emit('input', {});
      this.$emit('update:show', false);
    },
  },
};
</script>
