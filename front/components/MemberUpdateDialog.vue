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

      <v-alert
        type="info"
        dense
        outlined
        :value="readonly"
        class="ma-4"
      >
        {{ $t('institutions.members.notEditable') }}
      </v-alert>

      <v-divider />

      <template v-if="rolesItems.length > 0">
        <v-card-title>
          {{ $t('institutions.members.roles') }}
        </v-card-title>

        <v-card-text>
          <ItemTree :items="rolesItems">
            <template #group="{ item }">
              <v-label>
                {{ item.text }}
              </v-label>
            </template>

            <template #item="{item}">
              <v-checkbox
                :input-value="item.isActive"
                :disabled="saving"
                hide-details
                @click="changeRole(item.value, item.permissions)"
              >
                <template #label>
                  {{ item.text }}
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
            </template>
          </ItemTree>
        </v-card-text>

        <v-divider />
      </template>

      <v-card-title>
        {{ $t('institutions.members.institutionManagement') }}
      </v-card-title>

      <v-card-text>
        <MemberInstitutionPermissions
          ref="institutionPermissions"
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
          ref="repoPermissions"
          :institution-id="institutionId"
          :username="username"
          :readonly="readonly"
          class="px-0"
          @update:repositories="repositories = $event"
          @change="hasChanged = true"
        />
      </v-card-text>

      <v-divider />

      <v-card-title>
        {{ $t('spaces.spaces') }}
      </v-card-title>

      <v-card-text>
        <MemberSpacePermissions
          ref="spacePermissions"
          :institution-id="institutionId"
          :username="username"
          :readonly="readonly"
          class="px-0"
          @update:spaces="spaces = $event"
          @change="hasChanged = true"
        />
      </v-card-text>

      <template v-if="isAdmin">
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
import MemberInstitutionPermissions, { featureScopes } from '~/components/MemberInstitutionPermissions.vue';
import MemberRepoPermissions from '~/components/MemberRepoPermissions.vue';
import MemberSpacePermissions from '~/components/MemberSpacePermissions.vue';
import ItemTree from '~/components/ItemTree.vue';

export default {
  components: {
    MemberRepoPermissions,
    MemberSpacePermissions,
    MemberInstitutionPermissions,
    ItemTree,
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

      repositories: [],
      spaces: [],
    };
  },
  computed: {
    isAdmin() {
      return this.$auth?.user?.isAdmin;
    },
    readonly() {
      return (this.locked === true) && !this.isAdmin;
    },
    rolesItems() {
      if (featureScopes.length <= 0 && this.repositories.length <= 0 && this.spaces.length <= 0) {
        return [];
      }

      const roles = new Set(this.roles);
      const genBaseItem = (value) => ({ value, isActive: roles.has(value) });

      const genPerms = (items, getId, value) => {
        if (items.length <= 0) {
          return undefined;
        }
        return Object.fromEntries(items.map((i) => [getId(i), value]));
      };

      const genFeaturesPerms = (value) => genPerms(featureScopes ?? [], (f) => f, value);
      const genReposPerms = (value) => genPerms(this.repositories ?? [], (r) => r.pattern, value);
      const genSpacesPerms = (value) => genPerms(this.spaces ?? [], (s) => s.id, value);

      return [
        {
          text: this.$t('institutions.members.correspondent'),
          hide: !this.isAdmin,
          items: [
            {
              ...genBaseItem('contact:doc'),
              text: this.$t('institutions.members.documentary'),
              permissions: {
                features: genFeaturesPerms('write'),
                repositories: genReposPerms('read'),
                spaces: genSpacesPerms('write'),
              },
            },
            {
              ...genBaseItem('contact:tech'),
              text: this.$t('institutions.members.technical'),
              permissions: {
                features: genFeaturesPerms('write'),
                repositories: genReposPerms('write'),
                spaces: genSpacesPerms('write'),
              },
            },
          ],
        },
        {
          ...genBaseItem('guest'),
          text: this.$t('institutions.members.roleNames.guest'),
          permissions: {
            features: {
              ...(genFeaturesPerms('none') ?? {}),
              institution: 'read',
            },
            repositories: genReposPerms('read'),
            spaces: genSpacesPerms('read'),
          },
        },
      ];
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

    changeAllInstitutionPermissions(permissions) {
      // using refs here to avoid rewriting all the component and move the fetch logic
      const { savePermissions } = this.$refs.institutionPermissions;

      this.$refs.institutionPermissions.permissions = permissions;
      return savePermissions();
    },

    changeAllRepoPermissions(permissions) {
      // using refs here to avoid rewriting all the component and move the fetch logic
      const { savePermission } = this.$refs.repoPermissions;

      this.$refs.repoPermissions.repoPermissions = permissions;
      return Promise.all(
        this.repositories.map((r) => savePermission(r.pattern)),
      );
    },

    changeAllSpacePermissions(permissions) {
      // using refs here to avoid rewriting all the component and move the fetch logic
      const { savePermission } = this.$refs.spacePermissions;

      this.$refs.spacePermissions.spacesPermissions = permissions;
      return Promise.all(
        this.spaces.map((s) => savePermission(s.id)),
      );
    },

    async changeRole(role, permissions) {
      const current = new Set(this.roles);

      if (current.has(role)) {
        current.delete(role);
      } else {
        current.add(role);
      }

      // If access provided
      if (permissions) {
        // If it's the first role added, add all perms to write
        if (current.size === 1 && this.roles.length === 0) {
          await Promise.all([
            permissions.features && this.changeAllInstitutionPermissions(permissions.features),
            permissions.repositories && this.changeAllRepoPermissions(permissions.repositories),
            permissions.spaces && this.changeAllSpacePermissions(permissions.spaces),
          ]);
        }
      }

      this.roles = [...current];
      await this.save();
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
