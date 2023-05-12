<template>
  <v-dialog
    v-model="show"
    scrollable
    width="800"
  >
    <v-card :loading="loading">
      <v-card-title class="headline">
        {{ $t('institutions.members.accessRights') }}
      </v-card-title>

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

      <v-divider />

      <v-card-title>
        {{ $t('repositories.repositories') }}
      </v-card-title>

      <v-card-text v-if="hasRepositories">
        <v-container fluid class="px-0">
          <v-row v-for="repository in repositories" :key="repository.id" align="center">
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
                <v-icon v-if="successfulSaves[repository.id]" color="success">
                  mdi-check
                </v-icon>
              </v-slide-x-reverse-transition>
            </v-col>

            <v-col class="shrink">
              <v-btn-toggle
                :value="repoPermissions[repository.id]"
                color="primary"
                mandatory
                dense
                rounded
                @change="savePermission(repository.id)"
              >
                <v-btn
                  v-for="permission in permissions"
                  :key="permission.value"
                  :value="permission.value"
                  :loading="loadingPerms[repository.id]"
                  small
                  outlined
                >
                  {{ permission.text }}
                </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

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
export default {
  data() {
    return {
      show: false,
      loading: false,
      repoPermissions: {},
      loadingPerms: {},
      successfulSaves: {},
      repositories: [],
      errorMessage: '',
      permissionsChanged: false,
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
    show(visible) {
      if (!visible && this.permissionsChanged) {
        this.$emit('change');
      }
    },
  },
  methods: {
    display(institution, member) {
      this.institution = institution;
      this.member = member;
      this.repoPermissions = {};
      this.repositories = [];
      this.errorMessage = '';
      this.show = true;
      this.permissionsChanged = false;
      this.refresh();
    },

    async refresh() {
      this.loading = true;
      this.errorMessage = '';

      try {
        this.repositories = await this.$axios.$get(`/institutions/${this.institution.id}/repositories`, {
          params: { include: ['permissions'] },
        });
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      const newPermissions = {};

      if (Array.isArray(this.repositories)) {
        this.repositories.forEach((repository) => {
          const perm = repository?.permissions?.find?.(
            (p) => p?.username === this.member?.username,
          );
          if (typeof perm?.readonly === 'boolean') {
            newPermissions[repository.id] = perm.readonly ? 'read' : 'write';
          } else {
            newPermissions[repository.id] = 'none';
          }
        });
      }

      this.$set(this, 'repoPermissions', newPermissions);
      this.loading = false;
    },

    async savePermission(repositoryId) {
      this.$set(this.loadingPerms, repositoryId, true);
      this.errorMessage = '';

      const permission = this.repoPermissions[repositoryId];

      try {
        if (permission === 'read' || permission === 'write') {
          await this.$axios.$put(`/repositories/${repositoryId}/permissions/${this.member.username}`, {
            readonly: permission !== 'write',
          });
        } else {
          await this.$axios.$delete(`/repositories/${repositoryId}/permissions/${this.member.username}`);
        }

        this.permissionsChanged = true;
        this.$set(this.successfulSaves, repositoryId, true);
        setTimeout(() => { this.$set(this.successfulSaves, repositoryId, undefined); }, 1000);
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.$set(this.loadingPerms, repositoryId, false);
    },

  },
};
</script>
