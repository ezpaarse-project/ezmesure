<template>
  <v-card :loading="loading" v-bind="$attrs">
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
        @input="$refs.repoCreateForm?.resetForm?.()"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            color="primary"
            text
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

        <RepositoriesCreateForm
          ref="repoCreateForm"
          :institution-id="institutionId"
          @submit="onRepositoryCreate"
          @cancel="showCreationForm = false"
          @loading="creating = $event"
        />
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
      <v-list-item v-for="repository in repositories" :key="repository.pattern">
        <v-list-item-content>
          <v-list-item-title>{{ repository.pattern }}</v-list-item-title>
          <v-list-item-subtitle>{{ repository.type }}</v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-progress-circular
            v-if="deleting[repository.pattern]"
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
            @agree="deleteRepository(repository.pattern)"
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

    <slot name="actions" />
  </v-card>
</template>

<script>
import ConfirmPopover from '~/components/ConfirmPopover.vue';
import RepositoriesCreateForm from '~/components/repositories/RepositoriesCreateForm.vue';

export default {
  components: {
    ConfirmPopover,
    RepositoriesCreateForm,
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
      creating: false,
      formIsValid: false,
      showCreationForm: false,
      deleting: {},

      repositories: [],

      errorMessage: '',
    };
  },
  computed: {
    hasRepositories() {
      return Array.isArray(this.repositories) && this.repositories.length > 0;
    },
  },
  watch: {
    institutionId: {
      immediate: true,
      handler() { this.reset(); },
    },
  },
  methods: {
    reset() {
      this.repositories = [];
      this.deleting = {};
      this.errorMessage = '';
      this.creationErrorMessage = '';
      this.show = true;
      this.refreshRepositories();
    },

    onChange() {
      this.$emit('change', this.repositories);
    },

    async refreshRepositories() {
      if (!this.institutionId) { return; }

      this.loading = true;
      this.errorMessage = '';

      try {
        this.repositories = await this.$axios.$get(`/institutions/${this.institutionId}/repositories`);
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.loading = false;
    },

    async deleteRepository(pattern) {
      this.$set(this.deleting, pattern, true);
      this.errorMessage = '';

      try {
        await this.$axios.$delete(`/institutions/${this.institutionId}/repositories/${pattern}`);
        this.repositories = this.repositories.filter((r) => r?.pattern !== pattern);
        this.onChange();
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.$set(this.deleting, pattern, false);
    },

    onRepositoryCreate(newRepository) {
      this.repositories.push(newRepository);
      this.showCreationForm = false;
      this.onChange();
    },
  },
};
</script>
