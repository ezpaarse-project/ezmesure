<template>
  <v-container v-if="hasSpaces" fluid>
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

    <v-row v-for="space in spaces" :key="space.id" align="center">
      <v-col>
        <div class="body-1">
          {{ space.name || space.id }}

          <v-chip small label outlined>
            {{ space.type }}
          </v-chip>
        </div>
      </v-col>

      <v-col class="shrink pr-0">
        <v-slide-x-reverse-transition>
          <v-icon v-if="successfulSaves[space.id]" color="success">
            mdi-check
          </v-icon>
        </v-slide-x-reverse-transition>
      </v-col>

      <v-col class="shrink">
        <v-btn-toggle
          v-model="spacesPermissions[space.id]"
          color="primary"
          mandatory
          dense
          rounded
          @change="savePermission(space.id)"
        >
          <v-btn
            v-for="permission in permissions"
            :key="permission.value"
            :value="permission.value"
            :loading="loadingPerms[space.id]"
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
      {{ $t('spaces.noSpace') }}
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
      spacesPermissions: {},
      loadingPerms: {},
      successfulSaves: {},
      spaces: [],
      errorMessage: '',
    };
  },
  computed: {
    hasSpaces() {
      return Array.isArray(this.spaces) && this.spaces.length > 0;
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
      this.spacesPermissions = {};
      this.spaces = [];
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
        this.spaces = await this.$axios.$get(
          `/institutions/${this.institutionId}/spaces`,
          {
            params: {
              include: ['permissions'],
              sort: 'name',
              size: 0,
            },
          },
        );
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      const newPermissions = {};

      if (Array.isArray(this.spaces)) {
        this.spaces.forEach((space) => {
          const perm = space?.permissions?.find?.(
            (p) => p?.username === this.username,
          );
          if (typeof perm?.readonly === 'boolean') {
            newPermissions[space.id] = perm.readonly ? 'read' : 'write';
          } else {
            newPermissions[space.id] = 'none';
          }
        });
      }

      // this.$set(this, 'spacesPermissions', newPermissions);
      this.spacesPermissions = newPermissions;
      this.loading = false;
      this.$emit('update:spaces', this.spaces);
      this.$emit('update:permissions', newPermissions);
    },

    async savePermission(spaceId) {
      if (!this.username || this.readonly) {
        return;
      }

      this.$set(this.loadingPerms, spaceId, true);
      this.errorMessage = '';

      const permission = this.spacesPermissions[spaceId];

      try {
        if (permission === 'read' || permission === 'write') {
          await this.$axios.$put(`/kibana-spaces/${spaceId}/permissions/${this.username}`, {
            readonly: permission !== 'write',
          });
        } else {
          await this.$axios.$delete(`/kibana-spaces/${spaceId}/permissions/${this.username}`);
        }

        this.$emit('change');
        this.$set(this.successfulSaves, spaceId, true);
        setTimeout(() => { this.$set(this.successfulSaves, spaceId, undefined); }, 1000);
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.$set(this.loadingPerms, spaceId, false);
    },

  },
};
</script>
