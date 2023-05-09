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
      :custom-filter="(value, search) => basicFilter(value, search)"
      sort-by="username"
      item-key="username"
      show-select
    >
      <template #[`item.isAdmin`]="{ item }">
        <v-icon v-if="item.isAdmin">
          mdi-security
        </v-icon>
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
    <UsersFiltersDrawer v-model="filters" :show.sync="showUsersFiltersDrawer" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import UserForm from '~/components/users/UserForm.vue';
import UsersDeleteDialog from '~/components/users/UsersDeleteDialog.vue';
import UsersFiltersDrawer from '~/components/users/UsersFiltersDrawer.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    UserForm,
    UsersDeleteDialog,
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
      return this.$t('menu.users');
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
          text: this.$t('actions'),
          value: 'actions',
          filterable: false,
          sortable: false,
          width: '85px',
          align: 'center',
        },
      ];
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
    async refreshUsers() {
      this.refreshing = true;

      try {
        this.users = await this.$axios.$get('/users', { params: { source: '*' } });
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
