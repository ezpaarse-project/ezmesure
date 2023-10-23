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
      <v-row>
        <v-col>
          <v-text-field
            :value="search || value.name"
            :disabled="!!search"
            :messages="search ? [$t('institutions.filters.searchHint')] : []"
            :label="$t('institutions.institution.name')"
            prepend-icon="mdi-domain"
            hide-details="auto"

            @change="onFilterUpdate('name', $event)"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-text-field
            :value="search || value.acronym"
            :disabled="!!search"
            :messages="search ? [$t('institutions.filters.searchHint')] : []"
            :label="$t('institutions.institution.acronym')"
            prepend-icon="mdi-alphabetical-variant"
            hide-details="auto"

            @change="onFilterUpdate('acronym', $event)"
          />
        </v-col>

        <v-col>
          <v-input
            prepend-icon="mdi-check-all"
            hide-details
            style="padding-top: 12px; margin-top: 4px;"
          >
            <v-label class="button-group-label">
              {{ $t('institutions.institution.status') }}
            </v-label>

            <v-btn-toggle
              :value="value.validated"
              dense
              rounded
              color="primary"
              @change="onFilterUpdate('validated', $event)"
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

      <v-row class="px-0">
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

      <v-row class="px-0">
        <v-col style="position: relative;">
          <v-label class="slider-label slider-label-withicon">
            {{ $t('subinstitutions.subinstitutions') }}
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

      <v-row class="px-0">
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

      <v-row class="px-0">
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
  computed: {
    membershipsRange: {
      get() {
        return this.partialToRange(this.value.memberships, this.maxMembershipsCount);
      },
      set(val) {
        this.updateFilterWithPartial('memberships', val, this.maxMembershipsCount);
      },
    },
    childInstitutionsRange: {
      get() {
        return this.partialToRange(this.value.childInstitutions, this.maxChildInstitutionsCount);
      },
      set(val) {
        this.updateFilterWithPartial('childInstitutions', val, this.maxChildInstitutionsCount);
      },
    },
    repositoriesRange: {
      get() {
        return this.partialToRange(this.value.repositories, this.maxRepositoriesCount);
      },
      set(val) {
        this.updateFilterWithPartial('repositories', val, this.maxRepositoriesCount);
      },
    },
    spacesRange: {
      get() {
        return this.partialToRange(this.value.spaces, this.maxSpacesCount);
      },
      set(val) {
        this.updateFilterWithPartial('spaces', val, this.maxSpacesCount);
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
    updateFilterWithPartial(field, val, max) {
      if (
        !val
        || (val[0] === 0 && val[1] === max)
      ) {
        this.onFilterUpdate(field, undefined);
        return;
      }

      this.onFilterUpdate(field, this.partialToRange(val, max));
    },
    onFilterUpdate(field, val) {
      const filters = { ...this.value };
      filters[field] = val;
      this.$emit('input', filters);
    },
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
