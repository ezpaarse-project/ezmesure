<template>
  <section>
    <ToolBar :title="institutionName">
      <v-tooltip v-if="isAdmin" right>
        <template #activator="{ attrs, on }">
          <v-btn
            class="ml-2"
            icon
            v-bind="attrs"
            @click="goToInstitutionPage"
            v-on="on"
          >
            <v-icon>
              mdi-page-previous-outline
            </v-icon>
          </v-btn>
        </template>

        {{ $t('institutions.institution.goToPage') }}
      </v-tooltip>

      <v-spacer />

      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        :label="$t('search')"
        solo
        dense
        hide-details
        autocomplete="off"
        style="max-width: 200px"
      />

      <v-btn text :loading="refreshing" @click="refreshMembers">
        <v-icon left>
          mdi-refresh
        </v-icon>
        {{ $t('refresh') }}
      </v-btn>

      <MemberSearch
        v-if="canEditMemberships"
        v-model="showMemberSearch"
        :institution-id="institutionId"
      >
        <template #action="{ user }">
          <v-list-item-action>
            <v-btn
              :loading="addingUser === user?.username"
              :disabled="addingUser && addingUser !== user?.username"
              small
              color="primary"
              @click="addMember(user)"
            >
              <v-icon>
                mdi-account-plus
              </v-icon>
            </v-btn>
          </v-list-item-action>
        </template>
      </MemberSearch>
    </ToolBar>

    <v-data-table
      v-if="hasInstitution"
      :headers="tableHeaders"
      :items="members"
      :loading="refreshing"
      :search.sync="search"
      sort-by="user.fullName"
      item-key="username"
    >
      <template #top="{ originalItemsLength }">
        <v-toolbar flat>
          <v-toolbar-title>
            {{ $t('institutions.members.title', { total: originalItemsLength }) }}
          </v-toolbar-title>
        </v-toolbar>
      </template>

      <template #[`item.roles`]="{ item }">
        <v-chip
          v-for="role in item.roles"
          :key="role"
          small
          label
          color="secondary"
          class="mr-1"
        >
          {{ $t(`institutions.members.roleNames.${role}`) }}
        </v-chip>
      </template>

      <template #[`item.repositoryPermissions`]="{ item }">
        <v-chip
          v-if="Array.isArray(item.repositoryPermissions)"
          small
          class="elevation-1"
          @click="updateMember(item)"
        >
          {{ $tc('repositories.xRepositories', item.repositoryPermissions.length) }}

          <v-icon right small>
            mdi-security
          </v-icon>
        </v-chip>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>
                mdi-cog
              </v-icon>
            </v-btn>
          </template>

          <v-list min-width="200">
            <v-list-item
              v-for="action in actions"
              :key="action.icon"
              :disabled="action.disabled"
              @click="action.callback(item)"
            >
              <v-list-item-icon>
                <v-icon>{{ action.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ action.label }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

    <v-card-text v-else>
      <div class="mb-2">
        {{ $t('institutions.notAttachedToAnyInstitution') }}
      </div>

      <a :href="'/info/institution'">
        {{ $t('institutions.reportInstitutionInformation') }}
      </a>
    </v-card-text>

    <ConfirmDialog ref="confirmDialog" />
    <MemberUpdateDialog
      ref="updateDialog"
      :institution-id="institutionId"
      @updated="refreshMembers"
    />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import MemberSearch from '~/components/MemberSearch.vue';
import MemberUpdateDialog from '~/components/MemberUpdateDialog.vue';
import ConfirmDialog from '~/components/ConfirmDialog.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    MemberSearch,
    MemberUpdateDialog,
    ConfirmDialog,
  },
  async asyncData({
    $axios,
    store,
    params,
    app,
  }) {
    let institution = null;

    try {
      institution = await $axios.$get(`/institutions/${params.id}`);
    } catch (e) {
      if (e.response?.status === 404) {
        institution = {};
      } else {
        store.dispatch('snacks/error', app.i18n.t('institutions.unableToRetriveInformations'));
      }
    }

    return {
      showMemberSearch: false,
      refreshing: false,
      institution,
      members: [],
      addingUser: null,
      search: '',
    };
  },
  computed: {
    hasInstitution() {
      return !!this.institution?.id;
    },
    institutionName() {
      return this.institution?.name;
    },
    institutionId() {
      return this.institution?.id;
    },
    isAdmin() {
      return this.$auth.user?.isAdmin;
    },
    userPermissions() {
      const membership = this.$auth.user?.memberships?.find(
        (m) => m?.institutionId === this.institution?.id,
      );
      return new Set(membership?.permissions);
    },
    canEditMemberships() {
      return this.isAdmin || this.userPermissions.has('memberships:write');
    },
    isReadonly() {
      return !this.isAdmin && !this.canEditMemberships;
    },
    actions() {
      return [
        {
          icon: 'mdi-shield',
          label: this.$t('institutions.members.changePermissions'),
          callback: this.updateMember,
          disabled: !this.canEditMemberships,
        },
        {
          icon: 'mdi-account-off',
          label: this.$t('revoke'),
          callback: this.removeMember,
          disabled: !this.canEditMemberships,
        },
      ];
    },
    tableHeaders() {
      const headers = [
        {
          text: this.$t('institutions.members.name'),
          value: 'user.fullName',
        },
        {
          text: this.$t('institutions.members.username'),
          value: 'username',
        },
        {
          text: this.$t('users.user.email'),
          value: 'user.email',
        },
        {
          text: this.$t('institutions.members.accessRights'),
          value: 'repositoryPermissions',
        },
        {
          text: this.$t('institutions.members.roles'),
          value: 'roles',
        },
        {
          text: this.$t('actions'),
          value: 'actions',
          sortable: false,
          width: '85px',
          align: 'center',
          visible: !this.isReadonly,
        },
      ];

      return headers.filter((h) => h.visible !== false);
    },
  },
  mounted() {
    return this.refreshMembers();
  },
  methods: {
    async refreshMembers() {
      if (!this.hasInstitution) { return; }

      this.refreshing = true;

      try {
        this.members = await this.$axios.$get(`/institutions/${this.institution.id}/memberships`, {
          params: {
            include: ['user', 'repositoryPermissions'],
            size: 0,
          },
        });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.members.unableToRetriveMembers'));
      }

      this.refreshing = false;
    },

    async addMember(user) {
      if (!user?.username) { return; }

      let member = this.members.find((m) => m?.username === user?.username);

      if (!member) {
        this.addingUser = user.username;
        try {
          member = await this.$axios.$put(`/institutions/${this.institution.id}/memberships/${user.username}`, {});
          this.members.push(member);
        } catch (e) {
          this.$store.dispatch('snacks/error', this.$t('institutions.members.cannotAddMember'));
        }
        this.addingUser = null;
      }

      if (member) {
        this.showMemberSearch = false;
        this.updateMember(member);
      }
    },
    updateMember(member) {
      this.$refs.updateDialog.updateMember(member);
    },
    async removeMember(member) {
      if (!member.username || !this.institutionId) { return; }

      const confirmed = await this.$refs.confirmDialog?.open({
        title: this.$t('areYouSure'),
        message: this.$t(
          'institutions.members.removeFromMember',
          { name: member.user?.fullName || member.username },
        ),
        agreeText: this.$t('delete'),
        agreeIcon: 'mdi-delete',
      });

      if (!confirmed) {
        return;
      }

      this.removing = true;

      try {
        await this.$axios.$delete(`/institutions/${this.institutionId}/memberships/${member.username}`);
        this.show = false;
        this.refreshMembers();
      } catch (e) {
        const msg = e?.response?.data?.error;
        this.$store.dispatch('snacks/error', msg || this.$t('institutions.members.failedToRemoveMember'));
      }

      this.removing = false;
    },

    goToInstitutionPage() {
      this.$router.push({ path: `/institutions/${this.institutionId}` });
    },
  },
};
</script>
