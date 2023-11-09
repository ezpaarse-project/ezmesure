<template>
  <v-container v-if="hasRepositories" fluid>
    <v-alert
      class="mx-4 my-2"
      type="error"
      dense
      outlined
      closable
      :value="!!errorMessage"
    >
      {{ errorMessage }}
    </v-alert>

    <v-row v-for="repository in repositories" :key="repository.pattern" align="center">
      <v-col>
        <div class="body-1">
          {{ repository.pattern }}

          <v-chip small label outlined>
            {{ repository.type }}
          </v-chip>
        </div>
      </v-col>

      <v-col class="shrink pr-0">
        <v-slide-x-reverse-transition>
          <v-icon v-if="successfulSaves[repository.pattern]" color="success">
            mdi-check
          </v-icon>
        </v-slide-x-reverse-transition>
      </v-col>

      <v-col class="shrink">
        <v-btn-toggle
          v-model="repoPermissions[repository.pattern]"
          color="primary"
          mandatory
          dense
          rounded
          @change="savePermission(repository.pattern)"
        >
          <v-btn
            v-for="permission in permissions"
            :key="permission.value"
            :value="permission.value"
            :loading="loadingPerms[repository.pattern]"
            :disabled="readonly"
            small
            outlined
          >
            {{ permission.text }}
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
  </v-container>

  <div v-else class="text-center py-5">
    <v-progress-circular
      v-if="loading"
      indeterminate
      width="2"
    />
    <div v-else class="text-grey">
      {{ $t('repositories.noRepository') }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    institutionId: {
      type: String,
      default: () => '',
    },
    username: {
      type: String,
      default: () => '',
    },
    readonly: {
      type: Boolean,
      default: () => false,
    },
  },
  data() {
    return {
      loading: false,
      repoPermissions: {},
      loadingPerms: {},
      successfulSaves: {},
      repositories: [],
      errorMessage: '',
    };
  },
  computed: {
    hasRepositories() {
      return Array.isArray(this.repositories) && this.repositories.length > 0;
    },
    permissions() {
      return [
        { text: this.$t('permissions.none'), value: 'none' },
        { text: this.$t('permissions.read'), value: 'read' },
        { text: this.$t('permissions.write'), value: 'write' },
      ];
    },
  },
  watch: {
    institutionId() { this.reset(); },
    username() { this.reset(); },
  },
  mounted() {
    this.reset();
  },
  methods: {
    reset() {
      this.repoPermissions = {};
      this.repositories = [];
      this.errorMessage = '';
      this.refresh();
    },

    async refresh() {
      if (!this.institutionId || !this.username || this.loading) {
        return;
      }

      this.loading = true;
      this.errorMessage = '';

      try {
        this.repositories = await this.$axios.$get(`/institutions/${this.institutionId}/repositories`, {
          params: { include: ['permissions'] },
        });
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      const newPermissions = {};

      if (Array.isArray(this.repositories)) {
        this.repositories.forEach((repository) => {
          const perm = repository?.permissions?.find?.(
            (p) => p?.username === this.username,
          );
          if (typeof perm?.readonly === 'boolean') {
            newPermissions[repository.pattern] = perm.readonly ? 'read' : 'write';
          } else {
            newPermissions[repository.pattern] = 'none';
          }
        });
      }

      this.$set(this, 'repoPermissions', newPermissions);
      this.loading = false;
    },

    async savePermission(pattern) {
      if (!this.username || this.readonly) {
        return;
      }

      this.$set(this.loadingPerms, pattern, true);
      this.errorMessage = '';

      const permission = this.repoPermissions[pattern];

      try {
        if (permission === 'read' || permission === 'write') {
          await this.$axios.$put(`/repositories/${pattern}/permissions/${this.username}`, {
            readonly: permission !== 'write',
          });
        } else {
          await this.$axios.$delete(`/repositories/${pattern}/permissions/${this.username}`);
        }

        this.$emit('change');
        this.$set(this.successfulSaves, pattern, true);
        setTimeout(() => { this.$set(this.successfulSaves, pattern, undefined); }, 1000);
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.$set(this.loadingPerms, pattern, false);
    },

  },
};
</script>
