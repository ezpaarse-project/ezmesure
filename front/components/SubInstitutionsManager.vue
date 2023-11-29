<template>
  <v-card :loading="loading" v-bind="$attrs">
    <v-card-title class="headline">
      {{ $t('components.components') }}

      <v-spacer />

      <v-menu
        v-model="showSearchForm"
        :close-on-content-click="false"
        :nudge-width="200"
        offset-y
        bottom
        left
        @input="resetForm"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            color="primary"
            text
            :loading="savingSubInstitution"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon left>
              mdi-plus
            </v-icon>
            {{ $t('add') }}
          </v-btn>
        </template>

        <v-card>
          <v-card-text>
            <v-alert
              type="error"
              dense
              outlined
              :value="!!saveErrorMessage"
            >
              {{ saveErrorMessage }}
            </v-alert>

            <v-form
              id="subInstitutionForm"
              ref="subInstitutionForm"
              v-model="formIsValid"
              @submit.prevent="saveSubInstitution"
            >
              <v-autocomplete
                v-model="selectedSubInstitution"
                :items="availableInstitutions"
                :label="`${$t('institutions.title')} *`"
                :rules="[v => !!v || $t('fieldIsRequired')]"
                item-text="name"
                :search-input.sync="institutionSearch"
                :loading="loadingInstitutions"
                hide-no-data
                hide-details
                clearable
                outlined
                required
                autofocus
                return-object
              >
                <template #item="{ item }">
                  <v-list-item-avatar v-if="item.logoId" rounded>
                    <v-img :src="`/api/assets/logos/${item.logoId}`" contain />
                  </v-list-item-avatar>

                  <v-list-item-avatar v-else color="grey lighten-2" rounded>
                    <v-icon>
                      mdi-office-building
                    </v-icon>
                  </v-list-item-avatar>

                  <v-list-item-content>
                    <v-list-item-title>
                      {{ item.name }}
                    </v-list-item-title>

                    <v-list-item-subtitle>
                      {{ item.city }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </v-autocomplete>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer />

            <v-btn
              text
              @click="showSearchForm = false"
            >
              {{ $t('cancel') }}
            </v-btn>
            <v-btn
              type="submit"
              form="subInstitutionForm"
              color="primary"
              :loading="savingSubInstitution"
              :disabled="!formIsValid"
            >
              {{ $t('add') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>
    </v-card-title>

    <v-alert
      class="mx-4 my-2"
      type="error"
      dense
      outlined
      :value="!!errorMessage"
    >
      {{ errorMessage }}
    </v-alert>

    <v-list v-if="hasSubInstitutions">
      <v-list-item
        v-for="subInstitution in sortedSubInstitutions"
        :key="subInstitution.id"
        :to="`/institutions/${subInstitution.id}`"
      >
        <v-list-item-avatar v-if="subInstitution.logoId" rounded>
          <v-img :src="`/api/assets/logos/${subInstitution.logoId}`" contain />
        </v-list-item-avatar>

        <v-list-item-avatar v-else color="grey lighten-2" rounded>
          <v-icon>
            mdi-office-building
          </v-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>{{ subInstitution.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ subInstitution.type }}</v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-progress-circular
            v-if="removing[subInstitution.id]"
            indeterminate
            size="24"
            width="2"
          />
          <ConfirmPopover
            v-else
            :message="$t('areYouSure')"
            :agree-text="$t('delete')"
            bottom
            right
            offset-y
            @agree="removeSubInstitution(subInstitution.id)"
          >
            <template #activator="{ on: { click, ...on }, attrs }">
              <v-icon
                v-bind="attrs"
                @click.prevent="click"
                v-on="on"
              >
                mdi-delete
              </v-icon>
            </template>
          </ConfirmPopover>
        </v-list-item-action>
      </v-list-item>
    </v-list>

    <v-card-text v-else class="text-center py-5">
      <v-progress-circular
        v-if="loading"
        indeterminate
        width="2"
      />
      <div v-else class="text-grey">
        {{ $t('components.noComponent') }}
      </div>
    </v-card-text>

    <slot name="actions" />
  </v-card>
</template>

<script>
import debounce from 'lodash.debounce';
import ConfirmPopover from '~/components/ConfirmPopover.vue';

export default {
  components: {
    ConfirmPopover,
  },
  props: {
    institutionId: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      loading: false,
      removing: {},

      errorMessage: '',
      saveErrorMessage: '',

      subInstitutions: [],

      availableInstitutions: [],
      institutionSearch: '',
      selectedSubInstitution: null,
      loadingInstitutions: false,
      savingSubInstitution: false,
      showSearchForm: false,
      formIsValid: false,
    };
  },
  computed: {
    hasSubInstitutions() {
      return Array.isArray(this.subInstitutions) && this.subInstitutions.length > 0;
    },
    sortedSubInstitutions() {
      if (!Array.isArray(this.subInstitutions)) { return []; }

      return this.subInstitutions.slice().sort(
        (a, b) => (a?.name?.toLowerCase?.() < b?.name?.toLowerCase?.() ? -1 : 1),
      );
    },
  },
  watch: {
    institutionId: {
      immediate: true,
      handler() { this.reset(); },
    },
    institutionSearch(newValue) {
      if (newValue) {
        this.queryInstitutions(newValue);
      }
    },
  },
  methods: {
    reset() {
      this.subInstitutions = [];
      this.removing = {};
      this.errorMessage = '';
      this.refreshSubInstitutions();
    },
    onChange() {
      this.$emit('change', this.subInstitutions);
    },

    resetForm() {
      this.$refs.subInstitutionForm?.resetValidation?.();
      this.selectedSubInstitution = null;
    },

    async refreshSubInstitutions() {
      if (!this.institutionId) { return; }

      this.loading = true;
      this.errorMessage = '';

      try {
        this.subInstitutions = await this.$axios.$get(
          `/institutions/${this.institutionId}/subinstitutions`,
          { params: { institutionId: this.institutionId } },
        );
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.loading = false;
    },

    queryInstitutions: debounce(async function queryInstitutions() {
      this.loadingInstitutions = true;
      try {
        this.availableInstitutions = await this.$axios.$get('/institutions', { params: { q: this.institutionSearch, size: 10 } });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('searchFailed'));
      }
      this.loadingInstitutions = false;
    }, 500),

    async saveSubInstitution() {
      const selectedInstitition = this.selectedSubInstitution;

      if (!selectedInstitition?.id) { return; }

      this.savingSubInstitution = true;
      this.saveErrorMessage = '';

      try {
        await this.$axios.$put(`/institutions/${this.institutionId}/subinstitutions/${selectedInstitition.id}`);

        if (!this.subInstitutions.some((i) => i?.id === selectedInstitition.id)) {
          this.subInstitutions.push(selectedInstitition);
        }
        this.institutionSearch = '';
        this.showSearchForm = false;
        this.onChange();
      } catch (e) {
        this.saveErrorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.savingSubInstitution = false;
    },

    async removeSubInstitution(institutionId) {
      this.$set(this.removing, institutionId, true);
      this.errorMessage = '';

      try {
        await this.$axios.$delete(`/institutions/${this.institutionId}/subinstitutions/${institutionId}`);
        this.subInstitutions = this.subInstitutions.filter((i) => i?.id !== institutionId);
        this.onChange();
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.$set(this.removing, institutionId, false);
    },
  },
};
</script>
