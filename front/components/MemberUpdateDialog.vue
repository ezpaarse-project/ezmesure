<template>
  <v-dialog
    ref="dialog"
    v-model="show"
    max-width="900px"
  >
    <v-card ref="dialogTitle">
      <v-card-title>
        {{ $t('institutions.members.permissionsOf', { name: fullName }) }}
      </v-card-title>

      <v-divider />

      <v-alert
        type="info"
        dense
        outlined
        :value="readonly"
        class="ma-4"
      >
        {{ $t('institutions.members.notEditable') }}
      </v-alert>

      <v-card-title>
        {{ $t('institutions.members.institutionManagement') }}
      </v-card-title>

      <v-card-text>
        <MemberInstitutionPermissions
          :institution-id="institutionId"
          :username="username"
          :readonly="readonly"
          class="px-0"
          @change="hasChanged = true"
        />
      </v-card-text>

      <v-divider />

      <v-card-title>
        {{ $t('repositories.repositories') }}
      </v-card-title>

      <v-card-text>
        <MemberRepoPermissions
          :institution-id="institutionId"
          :username="username"
          :readonly="readonly"
          class="px-0"
          @change="hasChanged = true"
        />
      </v-card-text>

      <v-divider />

      <v-card-title>
        {{ $t('spaces.spaces') }}
      </v-card-title>

      <v-card-text>
        <MemberSpacePermissions
          :institution-id="institutionId"
          :username="username"
          :readonly="readonly"
          class="px-0"
          @change="hasChanged = true"
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
            value="contact:doc"
            hide-details
            :disabled="saving"
            @click="save"
          >
            <template #label>
              {{ $t('institutions.members.documentaryCorrespondent') }}
              <v-slide-x-transition mode="out-in">
                <v-icon v-if="successfulSave" key="icon-success" color="success" right>
                  mdi-check
                </v-icon>
                <v-progress-circular
                  v-else-if="saving"
                  key="loader"
                  class="ml-2"
                  indeterminate
                  size="18"
                  width="2"
                />
              </v-slide-x-transition>
            </template>
          </v-checkbox>

          <v-checkbox
            v-model="roles"
            value="contact:tech"
            hide-details
            :disabled="saving"
            @click="save"
          >
            <template #label>
              {{ $t('institutions.members.technicalCorrespondent') }}
              <v-slide-x-transition mode="out-in">
                <v-icon v-if="successfulSave" key="icon-success" color="success" right>
                  mdi-check
                </v-icon>
                <v-progress-circular
                  v-else-if="saving"
                  key="loader"
                  class="ml-2"
                  indeterminate
                  size="18"
                  width="2"
                />
              </v-slide-x-transition>
            </template>
          </v-checkbox>
        </v-card-text>

        <v-divider />

        <v-card-text>
          <v-checkbox
            v-model="locked"
            hide-details
            :disabled="saving"
            @click="save"
          >
            <template #label>
              {{ $t('institutions.members.locked') }}
              <v-slide-x-transition mode="out-in">
                <v-icon v-if="successfulSave" key="icon-success" color="success" right>
                  mdi-check
                </v-icon>
                <v-progress-circular
                  v-else-if="saving"
                  key="loader"
                  class="ml-2"
                  indeterminate
                  size="18"
                  width="2"
                />
              </v-slide-x-transition>
            </template>
          </v-checkbox>
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
        <v-btn outlined @click="show = false">
          {{ $t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import MemberRepoPermissions from '~/components/MemberRepoPermissions.vue';
import MemberSpacePermissions from '~/components/MemberSpacePermissions.vue';
import MemberInstitutionPermissions from '~/components/MemberInstitutionPermissions.vue';

export default {
  components: {
    MemberRepoPermissions,
    MemberSpacePermissions,
    MemberInstitutionPermissions,
  },
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
      successfulSave: false,
      hasChanged: false,
      username: '',
      fullName: '',
      roles: [],
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
  },
  watch: {
    show(visible) {
      if (!visible && this.hasChanged) {
        this.$emit('updated');
      }
    },
  },
  methods: {
    updateMember(memberData = {}) {
      this.username = memberData?.user?.username || '';
      this.fullName = memberData?.user?.fullName || '';
      this.roles = Array.isArray(memberData?.roles) ? memberData.roles.slice() : [];
      this.locked = (memberData?.locked === true);

      this.show = true;
      this.saveError = null;
      this.hasChanged = false;

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
          locked: this.isAdmin ? this.locked : undefined,
        });
        this.successfulSave = true;
        this.hasChanged = true;
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
