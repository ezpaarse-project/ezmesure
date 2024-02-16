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

        <v-btn :href="userListMailLink" target="_blank" rel="noopener noreferrer" text>
          <v-icon left>
            mdi-email-multiple
          </v-icon>
          {{ $t('users.createMailUserList') }}
        </v-btn>

        <v-btn text @click="deleteUsers()">
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
          <v-badge
            :value="filtersCount > 0"
            :content="filtersCount"
            overlap
            left
          >
            <v-icon>
              mdi-filter
            </v-icon>
          </v-badge>
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
      :loading="refreshing"
      sort-by="username"
      item-key="username"
      show-select
      @pagination="currentItemCount = $event.itemsLength"
    >
      <template #[`item.isAdmin`]="{ item }">
        <v-icon v-if="item.isAdmin">
          mdi-security
        </v-icon>
      </template>

      <template #[`item.memberships`]="{ item }">
        <v-chip
          v-if="Array.isArray(item.memberships)"
          :outlined="item.memberships?.length <= 0"
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

    <ConfirmDialog ref="confirmDialog" />
    <UserForm ref="userForm" @update="refreshUsers" />
    <UsersFiltersDrawer
      v-model="filters"
      :show.sync="showUsersFiltersDrawer"
      :search="search"
      :institutions="availableMembershipsData.institutions"
      :roles="availableMembershipsData.roles"
      :permissions="availableMembershipsData.permissions"
    />
    <MembershipsDialog ref="membershipsDialog" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import UserForm from '~/components/users/UserForm.vue';
import UsersFiltersDrawer from '~/components/users/UsersFiltersDrawer.vue';
import MembershipsDialog from '~/components/users/MembershipsDialog.vue';
import ConfirmDialog from '~/components/ConfirmDialog.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    UserForm,
    MembershipsDialog,
    UsersFiltersDrawer,
    ConfirmDialog,
  },
  data() {
    return {
      showUsersFiltersDrawer: false,

      selected: [],
      search: '',
      refreshing: false,
      users: [],
      filters: {},
      currentItemCount: 0,
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

      let count = this.users?.length;
      if (count != null && this.currentItemCount !== count) {
        count = `${this.currentItemCount}/${count}`;
      }

      return this.$t('users.toolbarTitle', { count: count ?? '?' });
    },
    tableHeaders() {
      return [
        {
          text: this.$t('users.user.fullName'),
          value: 'fullName',
          filter: (_value, _search, item) => this.columnStringFilter('fullName', item),
        },
        {
          text: this.$t('users.user.username'),
          value: 'username',
          filter: (_value, _search, item) => this.columnStringFilter('username', item),
        },
        {
          text: this.$t('users.user.email'),
          value: 'email',
          filter: (_value, _search, item) => this.columnStringFilter('email', item),
        },
        {
          text: this.$t('users.user.isAdmin'),
          value: 'isAdmin',
          filter: (value) => this.basicBoolFilter('isAdmin', value),
          align: 'center',
          width: '200px',
        },
        {
          text: this.$t('users.user.memberships'),
          value: 'memberships',
          filter: (value) => this.membershipsFilter(value),
          align: 'center',
          width: '200px',
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
        permissions: [...data.permissions],
        roles: [...data.roles],
        institutions: [...data.institutions.values()],
      };
    },
    userListMailLink() {
      const addresses = this.selected.map((user) => user.email).join(',');
      const teamMail = this.$config.supportMail;
      return `mailto:${teamMail}?bcc=${addresses}`;
    },
    filtersCount() {
      return Object.values(this.filters)
        .reduce(
          (prev, filter) => {
            // skipping if undefined or empty
            if (filter == null || filter === '') {
              return prev;
            }
            // skipping if empty array
            if (Array.isArray(filter) && filter.length <= 0) {
              return prev;
            }

            return prev + 1;
          },
          0,
        );
    },
  },
  methods: {
    /**
     * Basic filter applied by default to v-data-table
     *
     * @param {string} value The item's value
     * @param {string} search The value searched
     */
    basicFilter(value, search) {
      return value.toLowerCase().includes(search.toLowerCase());
    },
    /**
     * Basic filter applied to string fields using filter popups
     *
     * @param {string} field The filter's field
     * @param {string} value The item's value
     *
     * @return {boolean} If the item must be showed or not
     */
    basicStringFilter(field, value) {
      if (!this.filters[field]) {
        return true;
      }
      return this.basicFilter(value, this.filters[field]);
    },
    /**
     * Basic filter applied to bool fields using filter popups
     *
     * @param {string} field The filter's field
     * @param {boolean} value The item's value
     *
     * @return {boolean} If the item must be showed or not
     */
    basicBoolFilter(field, value) {
      if (this.filters[field] == null) {
        return true;
      }
      return this.filters[field] === value;
    },
    /**
     * Filter for string column using search, fallbacks to filters
     *
     * @param {string} field The item's field
     * @param {*} item The item
     *
     * @return {boolean} If the item must be showed or not
     */
    columnStringFilter(field, item) {
      if (this.search) {
        const isFullName = this.basicFilter(item.fullName, this.search);
        const isUsername = this.basicFilter(item.username, this.search);
        const isEmail = this.basicFilter(item.email, this.search);
        return isFullName || isUsername || isEmail;
      }
      return this.basicStringFilter(field, item[field]);
    },
    /**
     * Filter applied to memberships
     *
     * @param {any[]} value
     *
     * @return {boolean} If the item must be showed or not
     */
    membershipsFilter(value) {
      const data = this.extractMembershipsData(value);

      let shouldItemShow = true;
      // Filter by permissions
      if (this.filters.permissions?.length > 0 && shouldItemShow) {
        // '' actually means: no permissions
        if (this.filters.permissions.includes('')) {
          shouldItemShow = data.permissions.size === 0;
        } else {
          shouldItemShow = this.filters.permissions.some((p) => data.permissions.has(p));
        }
      }

      // Filter by roles
      if (this.filters.roles?.length > 0 && shouldItemShow) {
        // '' actually means: no roles
        if (this.filters.roles.includes('')) {
          shouldItemShow = data.roles.size === 0;
        } else {
          shouldItemShow = this.filters.roles.some((p) => data.roles.has(p));
        }
      }

      // Filter by institution
      if (this.filters.institutions?.length > 0 && shouldItemShow) {
        // '' actually means: no institutions
        if (this.filters.institutions.includes('')) {
          shouldItemShow = data.institutions.size === 0;
        } else {
          shouldItemShow = this.filters.institutions.some((p) => data.institutions.has(p));
        }
      }

      return shouldItemShow;
    },
    /**
     * Parse user's memberships to extract some data about user
     *
     * @param {any[]} memberships The user's memberships
     *
     * @typedef {Object} MembershipData
     * @property {Set} permissions
     * @property {Set} roles
     * @property {Map<string, *>} institutions
     *
     * @returns {MembershipData} user's permissions, roles, institutions
     */
    extractMembershipsData(memberships) {
      const permissions = [];
      const roles = [];
      const institutions = new Map();
      // eslint-disable-next-line no-restricted-syntax
      for (const membership of (memberships ?? [])) {
        permissions.push(...(membership.permissions ?? []));
        roles.push(...(membership.roles ?? []));

        if (membership.institution) {
          institutions.set(membership.institution.id, membership.institution);
        }
      }

      return {
        permissions: new Set(permissions),
        roles: new Set(roles),
        institutions,
      };
    },
    async refreshUsers() {
      this.refreshing = true;

      try {
        this.users = await this.$axios.$get('/users', {
          params: {
            size: 10000,
            source: '*',
            include: 'memberships.institution',
          },
        });
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
    async deleteUsers(items) {
      const users = items || this.selected;
      if (users.length === 0) {
        return;
      }

      const confirmed = await this.$refs.confirmDialog?.open({
        title: this.$t('areYouSure'),
        message: this.$tc(
          'users.deleteNbUsers',
          users.length,
        ),
        agreeText: this.$t('delete'),
        agreeIcon: 'mdi-delete',
      });

      if (!confirmed) {
        return;
      }

      this.removing = true;

      const requests = users.map(async (item) => {
        let deleted = false;
        try {
          await this.$axios.$delete(`/users/${item.username}`);
          deleted = true;
        } catch (e) {
          deleted = false;
        }
        return { item, deleted };
      });

      const results = await Promise.all(requests);

      const { deleted, failed } = results.reduce((acc, result) => {
        const { item } = result;

        if (result.deleted) {
          acc.deleted.push(item);
        } else {
          this.$store.dispatch('snacks/error', this.$t('cannotDeleteItem', { id: item.fullName || item.username }));
          acc.failed.push(item);
        }
        return acc;
      }, { deleted: [], failed: [] });

      if (failed.length > 0) {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItems', { count: failed.length }));
      }
      if (deleted.length > 0) {
        this.$store.dispatch('snacks/success', this.$t('itemsDeleted', { count: deleted.length }));
      }

      this.removing = false;
      this.show = false;
      const removedIds = deleted.map((d) => d.username);

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
    clearSelection() {
      this.selected = [];
    },
  },
};
</script>
