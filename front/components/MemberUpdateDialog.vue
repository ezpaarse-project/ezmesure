<template>
  <v-dialog
    ref="dialog"
    v-model="show"
    max-width="500px"
  >
    <v-card ref="dialogTitle">
      <v-card-title>
        {{ $t('institutions.members.permissionsOf', { name: fullName }) }}
      </v-card-title>

      <v-alert
        type="info"
        dense
        outlined
        :value="readonly"
        class="ma-4"
      >
        {{ $t('institutions.members.notEditable') }}
      </v-alert>

      <v-card-text>
        <v-treeview
          v-model="permissions"
          :items="availablePermissions"
          :disabled="readonly"
          selection-type="leaf"
          color="primary"
          selected-color="primary"
          selectable
          dense
          open-all
        />
      </v-card-text>

      <template v-if="isAdmin">
        <v-divider />

        <v-card-title>
          {{ $t('institutions.members.roles') }}
        </v-card-title>

        <v-card-text>
          <v-checkbox
            v-model="roles"
            :label="$t('institutions.members.documentaryCorrespondent')"
            value="contact:doc"
            hide-details
            @change="handleContactChange"
          />
          <v-checkbox
            v-model="roles"
            :label="$t('institutions.members.technicalCorrespondent')"
            value="contact:tech"
            hide-details
            @change="handleContactChange"
          />
        </v-card-text>

        <v-divider />

        <v-card-text>
          <v-checkbox
            v-model="locked"
            :label="$t('institutions.members.locked')"
            hide-details
          />
        </v-card-text>
      </template>

      <v-alert
        type="error"
        dense
        outlined
        :value="!!saveError"
        class="ma-4"
      >
        {{ saveError }}
      </v-alert>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" :loading="saving" :disabled="readonly" @click="save">
          <v-icon left>
            mdi-content-save
          </v-icon>
          {{ $t('save') }}
        </v-btn>
        <v-btn outlined @click="show = false">
          {{ $t('cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    institutionId: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      show: false,
      saving: false,
      saveError: null,
      username: '',
      fullName: '',
      roles: [],
      permissions: [],
      locked: false,
    };
  },
  computed: {
    isAdmin() {
      return this.$auth?.user?.isAdmin;
    },
    readonly() {
      return (this.locked === true) && !this.isAdmin;
    },
    availablePermissions() {
      const createPermissonItem = (featureId, permissionId) => ({
        id: `${featureId}:${permissionId}`,
        name: this.$t(`institutions.members.permissionLabels.${featureId}:${permissionId}`),
      });
      const createFeatureItem = (featureId, permissionIds) => ({
        id: featureId,
        name: this.$t(`institutions.members.featureLabels.${featureId}`),
        children: permissionIds?.map((id) => createPermissonItem(featureId, id)),
      });

      return [
        createFeatureItem('institution', ['read', 'write']),
        createFeatureItem('memberships', ['read', 'write', 'revoke']),
        createFeatureItem('sushi', ['read', 'write', 'delete']),
        createFeatureItem('reporting', ['read', 'write']),
      ];
    },
  },
  methods: {
    updateMember(memberData = {}) {
      this.username = memberData?.user?.username || '';
      this.fullName = memberData?.user?.fullName || '';
      this.roles = Array.isArray(memberData?.roles) ? memberData.roles.slice() : [];
      this.locked = (memberData?.locked === true);
      this.permissions = Array.isArray(memberData?.permissions) ? memberData.permissions.slice() : [
        'institution:read',
        'memberships:read',
      ];

      this.show = true;
      this.saveError = null;

      this.$nextTick().then(() => {
        this.$refs?.dialogTitle?.$el?.scrollIntoView?.();
      });
    },

    async save() {
      if (!this.username || !this.institutionId) { return; }

      this.saving = true;
      this.saveError = null;

      const url = `/institutions/${this.institutionId}/memberships/${this.username}`;

      try {
        await this.$axios.$put(url, {
          roles: this.roles,
          permissions: this.permissions,
          locked: this.isAdmin ? this.locked : undefined,
        });
        this.show = false;
        this.$emit('updated');
      } catch (e) {
        const message = e?.response?.data?.error;
        this.saveError = message || this.$t('institutions.members.failedToUpdatePerms');
      }

      this.saving = false;
    },
  },
};
</script>
