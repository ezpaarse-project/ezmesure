<template>
  <v-card :loading="loading" v-bind="$attrs">
    <v-card-title class="headline">
      {{ $t('group.group') }}

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
            :loading="savingParentInstitution"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon left>
              {{ hasParentInstitution ? 'mdi-pencil' : 'mdi-plus' }}
            </v-icon>
            {{ $t(hasParentInstitution ? 'modify' : 'add') }}
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
              id="parentInstitutionForm"
              ref="parentInstitutionForm"
              v-model="formIsValid"
              @submit.prevent="saveParentInstitution"
            >
              <v-autocomplete
                v-model="selectedParentInstitution"
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
              form="parentInstitutionForm"
              color="primary"
              :loading="savingParentInstitution"
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

    <v-list v-if="hasParentInstitution">
      <v-list-item
        :to="`/admin/institutions/${parentInstitution.id}`"
      >
        <v-list-item-avatar v-if="parentInstitution.logoId" rounded>
          <v-img :src="`/api/assets/logos/${parentInstitution.logoId}`" contain />
        </v-list-item-avatar>

        <v-list-item-avatar v-else color="grey lighten-2" rounded>
          <v-icon>
            mdi-office-building
          </v-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>{{ parentInstitution.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ parentInstitution.type }}</v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-progress-circular
            v-if="removing[parentInstitution.id]"
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
            @agree="removeParentInstitution(parentInstitution.id)"
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
        {{ $t('group.noGroup') }}
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
    parentId: {
      type: String,
      default: () => '',
    },
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

      parentInstitution: {},

      availableInstitutions: [],
      institutionSearch: '',
      selectedParentInstitution: null,
      loadingInstitutions: false,
      savingParentInstitution: false,
      showSearchForm: false,
      formIsValid: false,
    };
  },
  computed: {
    hasParentInstitution() {
      return !!this.parentInstitution?.id;
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
      this.parentInstitution = {};
      this.removing = {};
      this.errorMessage = '';
      this.refreshParentInstitution();
    },
    onChange() {
      this.$emit('change', this.parentInstitution);
    },

    resetForm() {
      this.$refs.parentInstitutionForm?.resetValidation?.();
      this.selectedParentInstitution = null;
    },

    async refreshParentInstitution() {
      if (!this.parentId) { return; }

      this.loading = true;
      this.errorMessage = '';

      try {
        this.parentInstitution = await this.$axios.$get(
          `/institutions/${this.parentId}`,
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

    async saveParentInstitution() {
      const selectedInstitution = this.selectedParentInstitution;

      if (!selectedInstitution?.id) { return; }

      this.savingParentInstitution = true;
      this.saveErrorMessage = '';

      try {
        const parent = await this.$axios.$put(`/institutions/${selectedInstitution.id}/subinstitutions/${this.institutionId}`);

        this.parentInstitution = parent;
        this.institutionSearch = '';
        this.showSearchForm = false;
        this.onChange();
      } catch (e) {
        this.saveErrorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.savingParentInstitution = false;
    },

    async removeParentInstitution(institutionId) {
      this.$set(this.removing, institutionId, true);
      this.errorMessage = '';

      try {
        await this.$axios.$delete(`/institutions/${institutionId}/subinstitutions/${this.institutionId}`);

        this.parentInstitution = {};
        this.onChange();
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.$set(this.removing, institutionId, false);
    },
  },
};
</script>
