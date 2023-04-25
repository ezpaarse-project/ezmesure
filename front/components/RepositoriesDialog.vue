<template>
  <v-dialog
    v-model="show"
    scrollable
    width="500"
  >
    <v-card :loading="loading">
      <v-card-title class="headline">
        {{ $t('repositories.repositories') }}
        <v-spacer />

        <v-menu
          v-model="showCreationForm"
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
              dark
              :loading="creating"
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
                :value="!!creationErrorMessage"
              >
                {{ creationErrorMessage }}
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
                @click="showCreationForm = false"
              >
                {{ $t('cancel') }}
              </v-btn>
              <v-btn
                type="submit"
                form="creationForm"
                color="primary"
                :loading="creating"
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

      <v-list v-if="hasRepositories">
        <v-list-item v-for="repository in repositories" :key="repository.id">
          <v-list-item-content>
            <v-list-item-title>{{ repository.pattern }}</v-list-item-title>
            <v-list-item-subtitle>{{ repository.type }}</v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-progress-circular
              v-if="deleting[repository.id]"
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
              @agree="deleteRepository(repository.id)"
            >
              <template #activator="{ on, attrs }">
                <v-icon
                  v-bind="attrs"
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
          {{ $t('repositories.noRepository') }}
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          {{ $t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import ConfirmPopover from '~/components/ConfirmPopover.vue';

export default {
  components: {
    ConfirmPopover,
  },
  data() {
    return {
      show: false,
      loading: false,
      creating: false,
      formIsValid: false,
      showCreationForm: false,
      deleting: {},

      repositories: [],

      errorMessage: '',
      creationErrorMessage: '',

      repositoryPattern: '',
      repositoryType: 'ezpaarse',

      repositoryTypes: [
        { text: 'ezPAARSE', value: 'ezpaarse' },
        { text: 'COUNTER 5', value: 'counter5' },
      ],
    };
  },
  computed: {
    hasRepositories() {
      return Array.isArray(this.repositories) && this.repositories.length > 0;
    },
  },
  methods: {
    resetForm() {
      this.$refs.creationForm?.resetValidation?.();
      this.repositoryPattern = '';
      this.repositoryType = 'ezpaarse';
    },

    display(institution) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institution = institution;
      this.repositories = [];
      this.deleting = {};
      this.errorMessage = '';
      this.creationErrorMessage = '';
      this.show = true;
      this.refreshRepositories();
    },

    async refreshRepositories() {
      this.loading = true;
      this.errorMessage = '';

      try {
        this.repositories = await this.$axios.$get('/repositories', { params: { institutionId: this.institution.id } });
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.loading = false;
    },

    async deleteRepository(repositoryId) {
      this.$set(this.deleting, repositoryId, true);
      this.errorMessage = '';

      try {
        await this.$axios.$delete(`/repositories/${repositoryId}`);
        this.repositories = this.repositories.filter((r) => r?.id !== repositoryId);
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.$set(this.deleting, repositoryId, false);
    },

    async createRepository() {
      this.creating = true;
      this.creationErrorMessage = '';

      try {
        const newRepository = await this.$axios.$post('/repositories', {
          pattern: this.repositoryPattern,
          type: this.repositoryType,
          institutionId: this.institution.id,
        });

        this.repositories.push(newRepository);
        this.repositoryPattern = '';
        this.showCreationForm = false;
      } catch (e) {
        this.creationErrorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.creating = false;
    },
  },
};
</script>
