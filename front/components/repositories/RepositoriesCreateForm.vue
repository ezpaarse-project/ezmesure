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
        <v-text-field
          v-model="repositoryPattern"
          :label="$t('repositories.pattern')"
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

    repositoryTypes: [
      { text: 'ezPAARSE', value: 'ezpaarse' },
      { text: 'COUNTER 5', value: 'counter5' },
    ],
  }),
  watch: {
    loading(val) {
      this.$emit('loading', val);
    },
  },
  methods: {
    resetForm() {
      this.$refs.creationForm?.resetValidation?.();
      this.repositoryPattern = '';
      this.repositoryType = 'ezpaarse';
    },

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
