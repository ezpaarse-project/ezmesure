<template>
  <v-card>
    <v-card-text>
      <v-alert
        type="error"
        dense
        outlined
        :value="!!errorMessage"
      >
        {{ errorMessage }}
      </v-alert>

      <v-form
        id="creationForm"
        ref="creationForm"
        v-model="formIsValid"
        @submit.prevent="createRepository"
      >
        <template v-if="institutionId">
          <v-autocomplete
            v-model="selectedRepository"
            :items="availableRepositories"
            :label="$t('repositories.repositories')"
            :search-input.sync="repositoriesSearch"
            :loading="loadingRepositories"
            item-text="pattern"
            hide-no-data
            hide-details
            clearable
            outlined
            return-object
          >
            <template #item="{ item }">
              <v-list-item-content>
                <v-list-item-title>
                  {{ item.pattern }}
                </v-list-item-title>

                <v-list-item-subtitle>
                  {{ item.type }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </v-autocomplete>

          <v-divider v-if="!repositoriesSearch" class="my-4" />
        </template>

        <template v-if="!repositoriesSearch">
          <v-text-field
            v-model="repositoryPattern"
            :label="`${$t('repositories.pattern')} *`"
            :rules="[v => !!v || $t('fieldIsRequired')]"
            outlined
            autofocus
            required
          />
          <v-select
            v-model="repositoryType"
            :items="repositoryTypes"
            :label="$t('repositories.type')"
            outlined
            hide-details
          />
        </template>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />

      <v-btn
        text
        @click="$emit('cancel')"
      >
        {{ $t('cancel') }}
      </v-btn>

      <v-btn
        type="submit"
        form="creationForm"
        color="primary"
        :loading="loading"
        :disabled="!formIsValid"
      >
        {{ $t('add') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import debounce from 'lodash.debounce';

export default {
  props: {
    institutionId: {
      type: String,
      default: undefined,
    },
  },
  emits: ['submit', 'cancel', 'loading'],
  data: () => ({
    loading: false,
    formIsValid: false,
    errorMessage: '',

    repositoryPattern: '',
    repositoryType: 'ezpaarse',
    selectedRepository: null,

    repositoriesSearch: '',
    loadingRepositories: false,
    availableRepositories: [],

    repositoryTypes: [
      { text: 'ezPAARSE', value: 'ezpaarse' },
      { text: 'COUNTER 5', value: 'counter5' },
    ],
  }),
  watch: {
    loading(val) {
      this.$emit('loading', val);
    },
    repositoriesSearch(newValue) {
      if (newValue) {
        this.queryRepositories(newValue);
      }
    },
  },
  methods: {
    resetForm() {
      this.$refs.creationForm?.resetValidation?.();
      this.repositoryPattern = '';
      this.repositoryType = 'ezpaarse';
      this.repositoriesSearch = '';
      this.selectedRepository = null;
    },

    queryRepositories: debounce(async function queryRepositories() {
      this.loadingRepositories = true;
      try {
        this.availableRepositories = await this.$axios.$get('/repositories', { params: { q: this.repositoriesSearch } });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('searchFailed'));
      }
      this.loadingRepositories = false;
    }, 500),

    async createRepository() {
      this.loading = true;
      this.creationErrorMessage = '';

      try {
        let newRepository;
        if (this.institutionId) {
          const repo = this.selectedRepository ?? {
            pattern: this.repositoryPattern,
            type: this.repositoryType,
          };

          newRepository = await this.$axios.$put(
            `/institutions/${this.institutionId}/repositories/${repo.pattern}`,
            { type: repo.type },
          );
        } else {
          newRepository = await this.$axios.$post(
            '/repositories',
            { type: this.repositoryType, pattern: this.repositoryPattern },
          );
        }

        this.repositoryPattern = '';
        this.$emit('submit', newRepository);
      } catch (e) {
        this.creationErrorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.loading = false;
    },
  },
};
</script>

<style lang="scss" scoped>

</style>
