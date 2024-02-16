<template>
  <div v-if="loading" class="text-center py-5">
    <v-progress-circular
      indeterminate
      width="2"
    />
  </div>

  <v-container v-else-if="hasPermissions" fluid>
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

    <v-row v-for="feature in features" :key="feature.scope" align="center">
      <v-col>
        <div class="body-1">
          {{ feature.text }}
        </div>
      </v-col>

      <v-col class="shrink pr-0">
        <v-slide-x-reverse-transition>
          <v-icon v-if="successfulSave" color="success">
            mdi-check
          </v-icon>
        </v-slide-x-reverse-transition>
      </v-col>

      <v-col class="shrink">
        <v-btn-toggle
          v-model="permissions[feature.scope]"
          color="primary"
          mandatory
          dense
          rounded
          @change="savePermissions"
        >
          <v-btn
            v-for="permissionLevel in permissionLevels"
            :key="permissionLevel.value"
            :value="permissionLevel.value"
            :loading="saving"
            :disabled="readonly"
            small
            outlined
          >
            {{ permissionLevel.text }}
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export const featureScopes = [
  'institution',
  'memberships',
  'sushi',
  'reporting',
];

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
      permissions: {},
      saving: false,
      successfulSave: false,
      errorMessage: '',
    };
  },
  computed: {
    features() {
      return featureScopes.map((scope) => ({
        scope,
        text: this.$t(`institutions.members.featureLabels.${scope}`),
      }));
    },
    permissionLevels() {
      return [
        { text: this.$t('permissions.none'), value: 'none' },
        { text: this.$t('permissions.read'), value: 'read' },
        { text: this.$t('permissions.write'), value: 'write' },
      ];
    },
    hasPermissions() {
      return Object.keys(this.permissions).length > 0;
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
      this.permissions = {};
      this.errorMessage = '';
      this.refresh();
    },

    async refresh() {
      if (!this.institutionId || !this.username || this.loading) {
        return;
      }

      this.loading = true;
      this.errorMessage = '';
      let membership;

      try {
        membership = await this.$axios.$get(`/institutions/${this.institutionId}/memberships/${this.username}`);
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      const permissions = new Set(membership?.permissions);
      const newPermissions = Object.fromEntries(featureScopes.map((scope) => {
        if (permissions.has(`${scope}:write`)) {
          return [scope, 'write'];
        }
        if (permissions.has(`${scope}:read`)) {
          return [scope, 'read'];
        }
        return [scope, 'none'];
      }));

      this.permissions = newPermissions;
      this.loading = false;
      this.$emit('update:permissions', newPermissions);
    },

    async savePermissions() {
      if (!this.username || !this.institutionId || this.readonly) {
        return;
      }

      this.saving = true;
      this.saveError = null;

      const permissions = featureScopes.flatMap((scope) => {
        const level = this.permissions[scope];

        if (level === 'read') { return [`${scope}:read`]; }
        if (level === 'write') { return [`${scope}:read`, `${scope}:write`]; }

        return [];
      });

      try {
        await this.$axios.$put(
          `/institutions/${this.institutionId}/memberships/${this.username}`,
          { permissions },
        );

        this.$emit('change', permissions);
        this.successfulSave = true;
        setTimeout(() => { this.successfulSave = false; }, 1000);
      } catch (e) {
        const message = e?.response?.data?.error;
        this.saveError = message || this.$t('institutions.members.failedToUpdatePerms');
      }

      this.saving = false;
    },

  },
};
</script>
