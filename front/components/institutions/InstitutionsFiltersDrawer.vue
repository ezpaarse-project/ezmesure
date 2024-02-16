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
        {{ $t('institutions.filters.title') }}
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
      <v-row v-if="possibleFiltersSet.has('name')">
        <v-col>
          <v-text-field
            :value="search || value.name?.value"
            :disabled="!!search"
            :messages="search ? [$t('institutions.filters.searchHint')] : []"
            :label="$t('institutions.institution.name')"
            prepend-icon="mdi-domain"
            hide-details="auto"
            @change="onFilterUpdate('name', { value: $event })"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col v-if="possibleFiltersSet.has('acronym')">
          <v-text-field
            :value="search || value.acronym?.value"
            :disabled="!!search"
            :messages="search ? [$t('institutions.filters.searchHint')] : []"
            :label="$t('institutions.institution.acronym')"
            prepend-icon="mdi-alphabetical-variant"
            hide-details="auto"
            @change="onFilterUpdate('acronym', { value: $event })"
          />
        </v-col>

        <v-col v-if="possibleFiltersSet.has('status')">
          <v-input
            prepend-icon="mdi-check-all"
            hide-details
            style="padding-top: 12px; margin-top: 4px;"
          >
            <v-label class="button-group-label">
              {{ $t('institutions.institution.status') }}
            </v-label>

            <v-btn-toggle
              :value="value.validated?.value"
              dense
              rounded
              color="primary"
              @change="onFilterUpdate('validated', {value: $event})"
            >
              <v-btn :value="true" small outlined>
                {{ $t('institutions.institution.validated') }}
              </v-btn>

              <v-btn :value="false" small outlined>
                {{ $t('institutions.institution.notValidated') }}
              </v-btn>
            </v-btn-toggle>
          </v-input>
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('memberships')" class="px-0 mt-8">
        <v-col style="position: relative;">
          <v-label class="slider-label slider-label-withicon">
            {{ $t('institutions.institution.members') }}
          </v-label>

          <v-range-slider
            :value="membershipsRange"
            :min="0"
            :max="maxMembershipsCount"
            hide-details
            thumb-label
            @end="membershipsRange = $event"
          >
            <template #prepend>
              <v-icon class="mr-2">
                mdi-account-multiple
              </v-icon>

              <v-text-field
                :value="membershipsRange[0]"
                :min="0"
                class="mt-0 pt-0"
                hide-details
                single-line
                type="number"
                style="width: 60px"
                @change="membershipsRange = [+$event, membershipsRange[1]]"
              />
            </template>

            <template #append>
              <v-text-field
                :value="membershipsRange[1]"
                :min="0"
                class="mt-0 pt-0"
                hide-details
                single-line
                type="number"
                style="width: 60px"
                @change="membershipsRange = [membershipsRange[0], +$event]"
              />
            </template>
          </v-range-slider>
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('monitor')" class="mt-0">
        <v-col class="pt-0">
          <v-select
            :value="contactServices"
            :items="contactItems"
            :label="$t('institutions.members.roles')"
            prepend-icon="mdi-tag"
            multiple
            hide-details
            @change="contactServices = $event"
          >
            <template #append-outer>
              <v-tooltip top>
                <template #activator="{attrs, on}">
                  <v-btn
                    icon
                    v-bind="attrs"
                    @click="onFilterUpdate('contacts', { exclusive: !value.contacts.exclusive })"
                    v-on="on"
                  >
                    {{ value.contacts.exclusive ? '1' : '1..n' }}
                  </v-btn>
                </template>

                {{
                  $t(
                    value.contacts.exclusive
                      ? 'institutions.filters.exclusiveHint'
                      : 'institutions.filters.inclusiveHint'
                  )
                }}
              </v-tooltip>
            </template>
          </v-select>
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('childInstitutions')" class="px-0 mt-8">
        <v-col style="position: relative;">
          <v-label class="slider-label slider-label-withicon">
            {{ $t('components.components') }}
          </v-label>

          <v-range-slider
            :value="childInstitutionsRange"
            :min="0"
            :max="maxChildInstitutionsCount"
            hide-details
            thumb-label
            @end="childInstitutionsRange = $event"
          >
            <template #prepend>
              <v-icon class="mr-2">
                mdi-family-tree
              </v-icon>
              <v-text-field
                :value="childInstitutionsRange[0]"
                :min="0"
                class="mt-0 pt-0"
                hide-details
                single-line
                type="number"
                style="width: 60px"
                @change="childInstitutionsRange = [+$event, childInstitutionsRange[1]]"
              />
            </template>

            <template #append>
              <v-text-field
                :value="childInstitutionsRange[1]"
                :min="0"
                class="mt-0 pt-0"
                hide-details
                single-line
                type="number"
                style="width: 60px"
                @change="childInstitutionsRange = [childInstitutionsRange[0], +$event]"
              />
            </template>
          </v-range-slider>
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('repositories')" class="px-0 mt-8">
        <v-col style="position: relative;">
          <v-label class="slider-label slider-label-withicon">
            {{ $t('repositories.repositories') }}
          </v-label>

          <v-range-slider
            :value="repositoriesRange"
            :min="0"
            :max="maxRepositoriesCount"
            hide-details
            thumb-label
            @end="repositoriesRange = $event"
          >
            <template #prepend>
              <v-icon class="mr-2">
                mdi-tray-arrow-down
              </v-icon>
              <v-text-field
                :value="repositoriesRange[0]"
                :min="0"
                class="mt-0 pt-0"
                hide-details
                single-line
                type="number"
                style="width: 60px"
                @change="repositoriesRange = [+$event, repositoriesRange[1]]"
              />
            </template>

            <template #append>
              <v-text-field
                :value="repositoriesRange[1]"
                :min="0"
                class="mt-0 pt-0"
                hide-details
                single-line
                type="number"
                style="width: 60px"
                @change="repositoriesRange = [repositoriesRange[0], +$event]"
              />
            </template>
          </v-range-slider>
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('monitor')" class="mt-0">
        <v-col class="pt-0">
          <v-select
            :value="repositoriesServices"
            :items="repositoryItems"
            :label="$t('repositories.repositories')"
            prepend-icon="mdi-tray-arrow-down"
            multiple
            hide-details
            @change="repositoriesServices = $event"
          >
            <template #append-outer>
              <v-tooltip top>
                <template #activator="{attrs, on}">
                  <v-btn
                    icon
                    v-bind="attrs"
                    @click="onFilterUpdate(
                      'repositories',
                      { exclusive: !value.repositories.exclusive }
                    )"
                    v-on="on"
                  >
                    {{ value.repositories.exclusive ? '1' : '1..n' }}
                  </v-btn>
                </template>

                {{
                  $t(
                    value.repositories.exclusive
                      ? 'institutions.filters.exclusiveHint'
                      : 'institutions.filters.inclusiveHint'
                  )
                }}
              </v-tooltip>
            </template>
          </v-select>
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('spaces')" class="px-0 mt-8">
        <v-col style="position: relative;">
          <v-label class="slider-label slider-label-withicon">
            {{ $t('spaces.spaces') }}
          </v-label>

          <v-range-slider
            :value="spacesRange"
            :min="0"
            :max="maxSpacesCount"
            hide-details
            thumb-label
            @end="spacesRange = $event"
          >
            <template #prepend>
              <v-icon class="mr-2">
                mdi-tab
              </v-icon>
              <v-text-field
                :value="spacesRange[0]"
                :min="0"
                class="mt-0 pt-0"
                hide-details
                single-line
                type="number"
                style="width: 60px"
                @change="spacesRange = [+$event, spacesRange[1]]"
              />
            </template>

            <template #append>
              <v-text-field
                :value="spacesRange[1]"
                :min="0"
                class="mt-0 pt-0"
                hide-details
                single-line
                type="number"
                style="width: 60px"
                @change="spacesRange = [spacesRange[0], +$event]"
              />
            </template>
          </v-range-slider>
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('monitor')" class="mt-0">
        <v-col class="pt-0">
          <v-select
            :value="spacesServices"
            :items="spaceItems"
            :label="$t('spaces.spaces')"
            prepend-icon="mdi-tab"
            multiple
            hide-details
            @change="spacesServices = $event"
          >
            <template #append-outer>
              <v-tooltip top>
                <template #activator="{attrs, on}">
                  <v-btn
                    icon
                    v-bind="attrs"
                    @click="onFilterUpdate('spaces', { exclusive: !value.spaces.exclusive })"
                    v-on="on"
                  >
                    {{ value.spaces.exclusive ? '1' : '1..n' }}
                  </v-btn>
                </template>

                {{
                  $t(
                    value.spaces.exclusive
                      ? 'institutions.filters.exclusiveHint'
                      : 'institutions.filters.inclusiveHint'
                  )
                }}
              </v-tooltip>
            </template>
          </v-select>
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
    selectedTableHeaders: {
      type: Array,
      default: () => [],
    },
    maxMembershipsCount: {
      type: Number,
      default: 0,
    },
    maxChildInstitutionsCount: {
      type: Number,
      default: 0,
    },
    maxRepositoriesCount: {
      type: Number,
      default: 0,
    },
    maxSpacesCount: {
      type: Number,
      default: 0,
    },
  },
  emits: ['input', 'update:show'],
  data: () => ({
    repositoryItems: [
      { value: 'repository:ezpaarse', text: 'ezpaarse' },
      { value: 'repository:counter5', text: 'counter5' },
    ],
    spaceItems: [
      { value: 'space:ezpaarse', text: 'ezpaarse' },
      { value: 'space:counter5', text: 'counter5' },
    ],
  }),
  computed: {
    possibleFiltersSet() {
      return new Set(this.selectedTableHeaders);
    },

    membershipsRange: {
      get() {
        return this.partialToRange(this.value.membershipsRange?.value, this.maxMembershipsCount);
      },
      set(val) {
        this.updateRangeWithPartial('membershipsRange', val, this.maxMembershipsCount);
      },
    },

    contactItems() {
      const isDisabled = this.contactServices.includes('contact:') ?? false;

      return [
        { value: 'contact:', text: this.$t('institutions.members.noCorrespondent'), disabled: !isDisabled && this.contactServices.length > 0 },
        { value: 'contact:tech', text: this.$t('institutions.members.technicalCorrespondent'), disabled: isDisabled },
        { value: 'contact:doc', text: this.$t('institutions.members.documentaryCorrespondent'), disabled: isDisabled },
      ];
    },
    contactServices: {
      get() {
        return this.value.contacts?.value ?? [];
      },
      set(val) {
        this.onFilterUpdate('contacts', { value: val.length > 0 ? val : undefined });
      },
    },

    childInstitutionsRange: {
      get() {
        return this.partialToRange(
          this.value.childInstitutionsRange?.value,
          this.maxChildInstitutionsCount,
        );
      },
      set(val) {
        this.updateRangeWithPartial('childInstitutionsRange', val, this.maxChildInstitutionsCount);
      },
    },

    repositoriesRange: {
      get() {
        return this.partialToRange(this.value.repositoriesRange?.value, this.maxRepositoriesCount);
      },
      set(val) {
        this.updateRangeWithPartial('repositoriesRange', val, this.maxRepositoriesCount);
      },
    },
    repositoriesServices: {
      get() {
        return this.value.repositories?.value ?? [];
      },
      set(val) {
        this.onFilterUpdate('repositories', { value: val.length > 0 ? val : undefined });
      },
    },

    spacesRange: {
      get() {
        return this.partialToRange(this.value.spacesRange?.value, this.maxSpacesCount);
      },
      set(val) {
        this.updateRangeWithPartial('spacesRange', val, this.maxSpacesCount);
      },
    },
    spacesServices: {
      get() {
        return this.value.spaces?.value ?? [];
      },
      set(val) {
        this.onFilterUpdate('spaces', { value: val.length > 0 ? val : undefined });
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

.slider-label {
  position: absolute !important;
  max-width: 133%;
  transform-origin: top left;
  transform: translateY(-16px) scale(.75);
  left: 16px !important;
  top: 16px;
}

.slider-label.slider-label-withicon {
  left: 44px !important;
  top: 22px;
}

.slider-label + *::v-deep(.v-slider) {
  transform: translateY(5px)
}
</style>
