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
        <v-combobox
          :value="selectedRepository"
          :items="availableRepositories"
          :label="`${$t('repositories.pattern')} *`"
          :rules="[v => !!v || $t('fieldIsRequired')]"
          :search-input.sync="repositoryPattern"
          :loading="loadingRepositories"
          item-text="pattern"
          hide-no-data
          clearable
          outlined
          autofocus
          required
          return-object
          @change="selectRepo"
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
        </v-combobox>

        <v-select
          :value="selectedRepository?.type || repositoryType"
          :items="repositoryTypes"
          :label="$t('repositories.type')"
          :disabled="selectedRepository?.pattern === repositoryPattern"
          outlined
          hide-details
          @change="repositoryType = $event"
        />
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
    repositoryPattern(newValue) {
      if (newValue && this.institutionId) {
        this.queryRepositories(newValue);
      }
    },
  },
  methods: {
    resetForm() {
      this.$refs.creationForm?.resetValidation?.();
      this.repositoryPattern = '';
      this.repositoryType = 'ezpaarse';
      this.selectedRepository = null;
    },

    selectRepo(repo) {
      this.selectedRepository = repo;
      if (repo?.type) {
        this.repositoryType = repo.type;
      }
    },

    queryRepositories: debounce(async function queryRepositories() {
      this.loadingRepositories = true;
      try {
        this.availableRepositories = await this.$axios.$get('/repositories', { params: { q: this.repositoryPattern } });
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
          newRepository = await this.$axios.$put(
            `/institutions/${this.institutionId}/repositories/${this.repositoryPattern}`,
            { type: this.repositoryType },
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
