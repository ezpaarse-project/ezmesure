<template>
  <v-menu
    v-model="showMemberMenu"
    :close-on-content-click="false"
    :nudge-width="200"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        color="primary"
        v-bind="attrs"
        v-on="on"
        @click="resetForm"
      >
        <v-icon left>
          mdi-account-plus
        </v-icon>
        {{ $t('institutions.members.addMember') }}
      </v-btn>
    </template>

    <v-card>
      <v-card-text>
        <v-form>
          <v-autocomplete
            v-model="selected"
            :items="users"
            :loading="loading"
            :search-input.sync="search"
            :item-disabled="isConnectedUser"
            item-text="full_name"
            :label="$t('search')"
            prepend-inner-icon="mdi-account-search"
            :error="failedToSearch"
            :error-messages="errorMessages"
            no-filter
            clearable
            hide-no-data
            dense
            outlined
            return-object
            autofocus
          >
            <template v-slot:item="{ item }">
              <v-list-item-avatar>
                <v-icon>mdi-account-circle</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-text="item.full_name" />
              </v-list-item-content>
            </template>
          </v-autocomplete>

          <v-select
            v-model="selectedPermission"
            :items="permissions"
            :label="$t('institutions.members.permissions')"
            dense
            outlined
          />

          <v-alert
            type="error"
            dense
            outlined
            :value="!!addMemberError"
          >
            {{ addMemberError }}
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          color="primary"
          :disabled="!selected"
          :loading="addingMember"
          @click="addSelectedMember"
        >
          <v-icon left>
            mdi-account-plus
          </v-icon>
          {{ $t('add') }}
        </v-btn>

        <v-btn outlined @click="closeMenu">
          {{ $t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import debounce from 'lodash.debounce';

export default {
  props: {
    institutionId: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      showMemberMenu: false,
      loading: false,
      addingMember: false,
      addMemberError: null,
      failedToSearch: false,
      search: null,
      selected: null,
      selectedPermission: 'read',
      users: [],
    };
  },
  computed: {
    errorMessages() {
      return this.failedToSearch ? [this.$t('institutions.members.failedToSearch')] : [];
    },
    permissions() {
      return [
        {
          value: 'read',
          text: this.$t('institutions.members.read'),
        },
        {
          value: 'write',
          text: `${this.$t('institutions.members.read')} / ${this.$t('institutions.members.write')}`,
        },
      ];
    },
  },
  watch: {
    search(value) {
      // eslint-disable-next-line camelcase
      if (this.selected?.full_name !== value) {
        this.doSearch(value);
      }
    },
  },
  methods: {
    closeMenu() {
      this.showMemberMenu = false;
    },

    resetForm() {
      this.search = null;
      this.selected = null;
      this.selectedPermission = 'read';
      this.addMemberError = null;
      this.failedToSearch = false;
    },

    isConnectedUser(item) {
      return item?.username === this.$auth?.user?.username;
    },

    doSearch: debounce(async function doSearch() {
      if (!this.search) {
        this.users = [];
        return;
      }

      this.loading = true;
      this.failedToSearch = false;

      try {
        const { data } = await this.$axios.get('/users', { params: { q: this.search } });
        this.users = Array.isArray(data) ? data : [];
      } catch (e) {
        this.failedToSearch = true;
      }

      this.loading = false;
    }, 500),

    async addSelectedMember() {
      if (!this.selected?.username || !this.institutionId) { return; }

      this.addingMember = true;
      this.addMemberError = null;

      const { username } = this.selected;
      const readonly = this.selectedPermission !== 'write';

      try {
        await this.$axios.put(`/institutions/${this.institutionId}/members/${username}`, { readonly });
        this.showMemberMenu = false;
        this.$emit('added');
      } catch (e) {
        const message = e?.response?.data?.error;
        this.addMemberError = message || this.$t('institutions.members.failedToAdd');
      }

      this.addingMember = false;
    },
  },
};
</script>
