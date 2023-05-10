<template>
  <section>
    <ToolBar
      :title="toolbarTitle"
      :dark="hasSelection"
    >
      <template v-if="hasSelection" #nav-icon>
        <v-btn icon @click="clearSelection">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

      <template v-if="hasSelection" #default>
        <v-spacer />

        <v-btn :href="userListMailLink" text>
          <v-icon left>
            mdi-email-multiple
          </v-icon>
          {{ $t('users.createMailUserList') }}
        </v-btn>

        <v-btn text @click="deleteUsers">
          <v-icon left>
            mdi-delete
          </v-icon>
          {{ $t('delete') }}
        </v-btn>
      </template>

      <template v-else #default>
        <v-spacer />

        <v-btn text @click="createUser">
          <v-icon left>
            mdi-plus
          </v-icon>
          {{ $t('add') }}
        </v-btn>
        <v-btn text :loading="refreshing" @click="refreshUsers">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>

        <v-btn
          text
          color="black"
          @click="showUsersFiltersDrawer = true"
        >
          <v-icon left>
            mdi-filter
          </v-icon>
          {{ $t('filter') }}
        </v-btn>

        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          :label="$t('search')"
          solo
          dense
          hide-details
          style="max-width: 200px"
        />
      </template>
    </ToolBar>

    <v-data-table
      v-model="selected"
      :headers="tableHeaders"
      :items="users"
      :search="search"
      :loading="refreshing"
      :custom-filter="basicFilter"
      sort-by="username"
      item-key="username"
      show-select
    >
      <template #[`item.isAdmin`]="{ item }">
        <v-icon v-if="item.isAdmin">
          mdi-security
        </v-icon>
      </template>

      <template #[`item.memberships`]="{ item }">
        <v-chip
          v-if="Array.isArray(item.memberships) && item.memberships.length > 0"
          small
          class="elevation-1"
          @click="$refs.membershipsDialog.display(item)"
        >
          {{ $tc('users.user.membershipsCount', item.memberships.length) }}

          <v-icon right small>
            mdi-domain
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

          <v-list>
            <v-list-item @click="editUser(item)">
              <v-list-item-icon>
                <v-icon>mdi-pencil</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t('modify') }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

    <UserForm ref="userForm" @update="refreshUsers" />
    <UsersDeleteDialog ref="deleteDialog" @removed="onUsersRemove" />
    <UsersFiltersDrawer
      v-model="filters"
      :show.sync="showUsersFiltersDrawer"
      :roles="availableMembershipsData.roles"
      :permissions="availableMembershipsData.permissions"
    />
    <MembershipsDialog ref="membershipsDialog" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import UserForm from '~/components/users/UserForm.vue';
import UsersDeleteDialog from '~/components/users/UsersDeleteDialog.vue';
import UsersFiltersDrawer from '~/components/users/UsersFiltersDrawer.vue';
import MembershipsDialog from '~/components/users/MembershipsDialog.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    UserForm,
    UsersDeleteDialog,
    MembershipsDialog,
    UsersFiltersDrawer,
  },
  data() {
    return {
      showUsersFiltersDrawer: false,

      selected: [],
      search: '',
      refreshing: false,
      users: [],
      filters: {},
    };
  },
  mounted() {
    return this.refreshUsers();
  },
  computed: {
    hasSelection() {
      return this.selected.length > 0;
    },
    toolbarTitle() {
      if (this.hasSelection) {
        return this.$t('nSelected', { count: this.selected.length });
      }
      return this.$t('users.toolbarTitle', { count: this.users?.length ?? '?' });
    },
    tableHeaders() {
      return [
        {
          text: this.$t('users.user.fullName'),
          value: 'fullName',
          filter: (value) => this.basicStringFilter('fullName', value),
        },
        {
          text: this.$t('users.user.username'),
          value: 'username',
          filter: (value) => this.basicStringFilter('username', value),
        },
        {
          text: this.$t('users.user.email'),
          value: 'email',
          filter: (value) => this.basicStringFilter('email', value),
        },
        {
          text: this.$t('users.user.isAdmin'),
          value: 'isAdmin',
          filter: (value) => this.filters.isAdmin === undefined || this.filters.isAdmin === value,
        },
        {
          text: this.$t('users.user.memberships'),
          value: 'memberships',
          filter: (value) => this.membershipsFilter(value),
        },
        {
          text: this.$t('actions'),
          value: 'actions',
          filterable: false,
          sortable: false,
          width: '85px',
          align: 'center',
        },
      ];
    },
    availableMembershipsData() {
      if (!Array.isArray(this.users)) {
        return [];
      }

      const memberships = this.users
        .filter((u) => Array.isArray(u.memberships))
        .map((u) => u.memberships)
        .flat();

      const data = this.extractMembershipsData(memberships);

      return {
        memberships,
        permissions: [...new Set(data.permissions)],
        roles: [...new Set(data.roles)],
      };
    },
    userListMailLink() {
      const addresses = this.selected.map((user) => user.email).join(',');
      return `mailto:${addresses}`;
    },
  },
  methods: {
    /**
     * Basic filter applied by default to v-data-table
     *
     * @param {*} value The item's value
     * @param {*} search The value searched
     */
    basicFilter(value, search) {
      return value.toLowerCase().includes(search.toLowerCase());
    },
    /**
     * Basic filter applied to fields using filter popups
     *
     * @param {string} field The filter's field
     * @param {*} value The item's value
     */
    basicStringFilter(field, value) {
      if (!this.filters[field]) {
        return true;
      }
      return this.basicFilter(value, this.filters[field]);
    },
    /**
     * Filter applied to memberships
     */
    membershipsFilter(value) {
      const data = this.extractMembershipsData(value);

      let shouldItemShow = true;
      // Filter by permissions
      if (this.filters.permissions?.length > 0 && shouldItemShow) {
        shouldItemShow = this.filters.permissions.some((p) => data.permissions.has(p));
      }

      // Filter by roles
      if (this.filters.roles?.length > 0 && shouldItemShow) {
        shouldItemShow = this.filters.roles.some((r) => data.roles.has(r));
      }

      return shouldItemShow;
    },
    /**
     * Parse user's memberships to extract some data about user
     *
     * @param {any[]} memberships The user's memberships
     *
     * @returns user's permissions, roles
     */
    extractMembershipsData(memberships) {
      const permissions = [];
      const roles = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const membership of memberships) {
        permissions.push(...(membership.permissions ?? []));
        roles.push(...(membership.roles ?? []));
      }

      return {
        permissions: new Set(permissions),
        roles: new Set(roles),
      };
    },
    async refreshUsers() {
      this.refreshing = true;

      try {
        this.users = await this.$axios.$get('/users', { params: { source: '*', include: 'memberships.institution' } });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('users.unableToFetchInformations'));
      }

      if (!Array.isArray(this.users)) {
        this.users = [];
      }

      this.refreshing = false;
    },
    editUser(item) {
      this.$refs.userForm.editUser(item);
    },
    createUser() {
      this.$refs.userForm.createUser({ addAsMember: false });
    },
    onUsersRemove(removedIds) {
      const removeDeleted = (user) => !removedIds.some((username) => user.username === username);
      this.users = this.users.filter(removeDeleted);
      this.selected = this.selected.filter(removeDeleted);
    },
    async copyUserId(item) {
      if (!navigator.clipboard) {
        this.$store.dispatch('snacks/error', this.$t('unableToCopyId'));
        return;
      }
      try {
        await navigator.clipboard.writeText(item.username);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('unableToCopyId'));
        return;
      }
      this.$store.dispatch('snacks/info', this.$t('idCopied'));
    },
    deleteUsers() {
      this.$refs.deleteDialog.confirmDelete(this.selected);
    },
    clearSelection() {
      this.selected = [];
    },
  },
};
</script>
