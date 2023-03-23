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
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import UserForm from '~/components/users/UserForm.vue';
import UsersDeleteDialog from '~/components/users/UsersDeleteDialog.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    UserForm,
    UsersDeleteDialog,
  },
  data() {
    return {
      selected: [],
      search: '',
      refreshing: false,
      types: ['tech', 'doc'],
      logo: null,
      logoPreview: null,
      users: [],
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
        { text: this.$t('users.user.fullName'), value: 'fullName' },
        { text: this.$t('users.user.username'), value: 'username' },
        { text: this.$t('users.user.email'), value: 'email' },
        { text: this.$t('users.user.isAdmin'), value: 'isAdmin' },
        {
          text: this.$t('actions'),
          value: 'actions',
          sortable: false,
          width: '85px',
          align: 'center',
        },
      ];
    },
  },
  methods: {
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
