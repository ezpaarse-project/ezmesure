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
          <v-label class="slider-label slider-label-withicon">
            {{ $t('repositories.institutions') }}
          </v-label>

          <v-range-slider
            :value="institutionsRange"
            :min="0"
            :max="maxInstitutionsCount"
            hide-details
            thumb-label
            @end="institutionsRange = $event"
          >
            <template #prepend>
              <v-icon class="mr-2">
                mdi-domain
              </v-icon>

              <v-text-field
                :value="institutionsRange[0]"
                :min="0"
                class="mt-0 pt-0"
                hide-details
                single-line
                type="number"
                style="width: 60px"
                @change="institutionsRange = [+$event, institutionsRange[1]]"
              />
            </template>

            <template #append>
              <v-text-field
                :value="institutionsRange[1]"
                :min="0"
                class="mt-0 pt-0"
                hide-details
                single-line
                type="number"
                style="width: 60px"
                @change="institutionsRange = [institutionsRange[0], +$event]"
              />
            </template>
          </v-range-slider>
        </v-col>
      </v-row>
    </v-container>
  </v-navigation-drawer>
</template>

<script>
export default {
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
      return ['ezpaarse', 'counter5'].map(
        (value) => ({
          value,
          text: this.$t(`spaces.types.${value}`),
        }),
      );
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
     * Transform a partial range into a full one
     *
     * @param {[number | undefined, number | undefined] | undefined} val The partial range
     * @param {number} max The maximum value of the range
     *
     * @returns {[number, number]}
     */
    partialToRange(val, max) {
      return [
        val?.[0] ?? 0,
        val?.[1] ?? max,
      ];
    },
    /**
     * Update a filter with a partial range
     *
     * @param {string} field The field
     * @param {[number | undefined, number | undefined] | undefined} val The partial range
     * @param {number} max The maximum value of the range
     */
    updateRangeWithPartial(field, val, max) {
      if (
        !val
        || (val[0] === 0 && val[1] === max)
      ) {
        this.onFilterUpdate(field, { value: undefined });
        return;
      }

      this.onFilterUpdate(field, { value: this.partialToRange(val, max) });
    },
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

<style scoped>
.button-group-label {
  position: absolute !important;
  max-width: 133%;
  transform-origin: top left;
  transform: translateY(-16px) scale(.75);
}

.button-group-label + * {
  transform: translateY(5px)
}
</style>
