<template>
  <v-card v-bind="$attrs">
    <v-card-title class="headline">
      {{ $t('repositories.institutions') }}

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
            :loading="savingInstitution"
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
              id="institutionForm"
              ref="institutionForm"
              v-model="formIsValid"
              @submit.prevent="saveInstitution"
            >
              <v-autocomplete
                v-model="selectedInstitution"
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
              form="institutionForm"
              color="primary"
              :loading="savingInstitution"
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

    <v-list v-if="hasInstitutions">
      <v-list-item
        v-for="institution in sortedInstitutions"
        :key="institution.id"
        :to="`/institutions/${institution.id}`"
      >
        <v-list-item-avatar v-if="institution.logoId" rounded>
          <v-img :src="`/api/assets/logos/${institution.logoId}`" contain />
        </v-list-item-avatar>

        <v-list-item-avatar v-else color="grey lighten-2" rounded>
          <v-icon>
            mdi-office-building
          </v-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>{{ institution.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ institution.type }}</v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-progress-circular
            v-if="removing[institution.id]"
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
            @agree="removeInstitution(institution.id)"
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
      <div class="text-grey">
        {{ $t('repositories.noInstitutions') }}
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
    repository: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      removing: {},

      errorMessage: '',
      saveErrorMessage: '',

      institutions: [],

      availableInstitutions: [],
      institutionSearch: '',
      selectedInstitution: null,
      loadingInstitutions: false,
      savingInstitution: false,
      showSearchForm: false,
      formIsValid: false,
    };
  },
  computed: {
    hasInstitutions() {
      if (!Array.isArray(this.institutions)) {
        return false;
      }
      return this.institutions.length > 0;
    },
    sortedInstitutions() {
      if (!Array.isArray(this.institutions)) { return []; }

      return this.institutions.slice().sort(
        (a, b) => (a?.name?.toLowerCase?.() < b?.name?.toLowerCase?.() ? -1 : 1),
      );
    },
  },
  watch: {
    repository: {
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
      this.institutions = this.repository?.institutions;
      this.removing = {};
      this.errorMessage = '';
    },
    onChange() {
      this.$emit('change', this.repository?.institutions ?? []);
    },

    resetForm() {
      this.$refs.institutionForm?.resetValidation?.();
      this.selectedSubInstitution = null;
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

    async saveInstitution() {
      if (!this.selectedInstitution?.id || !this.repository) { return; }

      this.savingInstitution = true;
      this.saveErrorMessage = '';

      try {
        await this.$axios.$put(
          `/institutions/${this.selectedInstitution.id}/repositories/${this.repository.pattern}`,
          { type: this.repository.type },
        );

        if (!this.institutions.some((i) => i?.pattern === this.selectedInstitution.id)) {
          this.institutions = [...this.institutions, this.selectedInstitution];
        }
        this.institutionSearch = '';
        this.showSearchForm = false;
        this.onChange();
      } catch (e) {
        this.saveErrorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.savingInstitution = false;
    },

    async removeInstitution(institutionId) {
      if (!institutionId || !this.repository?.pattern) { return; }

      this.$set(this.removing, institutionId, true);
      this.errorMessage = '';

      try {
        await this.$axios.$delete(`/institutions/${institutionId}/repositories/${this.repository.pattern}`);
        this.institutions = this.institutions.filter((i) => i?.id !== institutionId);
        this.onChange();
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.$set(this.removing, institutionId, false);
    },
  },
};
</script>
