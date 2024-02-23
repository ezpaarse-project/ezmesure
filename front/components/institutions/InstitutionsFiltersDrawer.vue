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
          <BooleanFilter
            :value="value.validated?.value"
            :label="$t('institutions.institution.status')"
            :true-text="$t('institutions.institution.validated')"
            :false-text="$t('institutions.institution.notValidated')"
            @input="onFilterUpdate('validated', { value: $event })"
          />
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('memberships')" class="px-0 mt-8">
        <v-col style="position: relative;">
          <RangeFilter
            :value="value.membershipsRange?.value"
            :label="$t('institutions.institution.members')"
            :max="maxMembershipsCount"
            icon="mdi-account-multiple"
            @input="onFilterUpdate('membershipsRange', { value: $event })"
          />
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('monitor')" class="mt-0">
        <v-col class="pt-0">
          <SelectFilter
            :value="value.contacts?.value"
            :items="contactItems"
            :label="$t('institutions.members.roles')"
            icon="mdi-tag"
            multiple
            @input="onFilterUpdate('contacts', { value: $event})"
          >
            <template #append-outer>
              <ExclusiveBtnFilter
                :value="value.contacts?.exclusive"
                :exclusive-hint="$t('institutions.filters.exclusiveHint')"
                :inclusive-hint="$t('institutions.filters.inclusiveHint')"
                @input="onFilterUpdate('contacts', { exclusive: $event })"
              />
            </template>
          </SelectFilter>
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('childInstitutions')" class="px-0 mt-8">
        <v-col style="position: relative;">
          <RangeFilter
            :value="value.childInstitutionsRange?.value"
            :label="$t('components.components')"
            :max="maxChildInstitutionsCount"
            icon="mdi-family-tree"
            @input="onFilterUpdate('childInstitutionsRange', { value: $event })"
          />
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('repositories')" class="px-0 mt-8">
        <v-col style="position: relative;">
          <RangeFilter
            :value="value.repositoriesRange?.value"
            :label="$t('repositories.repositories')"
            :max="maxRepositoriesCount"
            icon="mdi-database-outline"
            @input="onFilterUpdate('repositoriesRange', { value: $event })"
          />
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('monitor')" class="mt-0">
        <v-col class="pt-0">
          <SelectFilter
            :value="value.repositories?.value"
            :items="repositoryItems"
            :label="$t('repositories.repositories')"
            icon="mdi-database-outline"
            multiple
            @input="onFilterUpdate('repositories', { value: $event})"
          >
            <template #append-outer>
              <ExclusiveBtnFilter
                :value="value.repositories?.exclusive"
                :exclusive-hint="$t('institutions.filters.exclusiveHint')"
                :inclusive-hint="$t('institutions.filters.inclusiveHint')"
                @input="onFilterUpdate('repositories', { exclusive: $event })"
              />
            </template>
          </SelectFilter>
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('spaces')" class="px-0 mt-8">
        <v-col style="position: relative;">
          <RangeFilter
            :value="value.spacesRange?.value"
            :label="$t('spaces.spaces')"
            :max="maxSpacesCount"
            icon="mdi-tab"
            @input="onFilterUpdate('spacesRange', { value: $event })"
          />
        </v-col>
      </v-row>

      <v-row v-if="possibleFiltersSet.has('monitor')" class="mt-0">
        <v-col class="pt-0">
          <SelectFilter
            :value="value.spaces?.value"
            :items="spaceItems"
            :label="$t('spaces.spaces')"
            icon="mdi-tab"
            multiple
            @input="onFilterUpdate('spaces', { value: $event})"
          >
            <template #append-outer>
              <ExclusiveBtnFilter
                :value="value.spaces?.exclusive"
                :exclusive-hint="$t('institutions.filters.exclusiveHint')"
                :inclusive-hint="$t('institutions.filters.inclusiveHint')"
                @input="onFilterUpdate('spaces', { exclusive: $event })"
              />
            </template>
          </SelectFilter>
        </v-col>
      </v-row>

      <template v-if="possibleFiltersSet.has('sushiCredentials')">
        <v-row class="px-0 mt-8">
          <v-col style="position: relative;">
            <RangeFilter
              :value="value.credsSuccessRange?.value"
              :label="$t('institutions.sushi.connectionSuccessful')"
              :max="maxCredentialsStatusCounts.success"
              icon="mdi-key"
              color="success"
              @input="onFilterUpdate('credsSuccessRange', { value: $event })"
            />
          </v-col>
        </v-row>
        <v-row class="px-0">
          <v-col style="position: relative;">
            <RangeFilter
              :value="value.credsUnauthorizedRange?.value"
              :label="$t('institutions.sushi.connectionUnauthorized')"
              :max="maxCredentialsStatusCounts.unauthorized"
              icon="mdi-key-alert"
              color="warning"
              @input="onFilterUpdate('credsUnauthorizedRange', { value: $event })"
            />
          </v-col>
        </v-row>
        <v-row class="px-0">
          <v-col style="position: relative;">
            <RangeFilter
              :value="value.credsFailedRange?.value"
              :label="$t('institutions.sushi.connectionFailed')"
              :max="maxCredentialsStatusCounts.failed"
              icon="mdi-key-remove"
              color="error"
              @input="onFilterUpdate('credsFailedRange', { value: $event })"
            />
          </v-col>
        </v-row>
      </template>
    </v-container>
  </v-navigation-drawer>
</template>

<script>
import SelectFilter from '../filters-form/SelectFilter.vue';
import ExclusiveBtnFilter from '../filters-form/ExclusiveBtnFilter.vue';
import RangeFilter from '../filters-form/RangeFilter.vue';
import BooleanFilter from '../filters-form/BooleanFilter.vue';

export default {
  components: {
    SelectFilter,
    ExclusiveBtnFilter,
    RangeFilter,
    BooleanFilter,
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
    maxCredentialsStatusCounts: {
      type: Object,
      default: () => ({
        success: 0,
        unauthorized: 0,
        failed: 0,
      }),
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

    contactItems() {
      const contactServices = this.value.contacts?.value ?? [];
      const isDisabled = contactServices.includes('contact:') ?? false;

      return [
        { value: 'contact:', text: this.$t('institutions.members.noCorrespondent'), disabled: !isDisabled && contactServices.length > 0 },
        { value: 'contact:tech', text: this.$t('institutions.members.technicalCorrespondent'), disabled: isDisabled },
        { value: 'contact:doc', text: this.$t('institutions.members.documentaryCorrespondent'), disabled: isDisabled },
      ];
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
