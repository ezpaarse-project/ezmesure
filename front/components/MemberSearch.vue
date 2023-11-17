<template>
  <v-menu
    :value="value"
    :close-on-content-click="false"
    :nudge-width="250"
    @input="$emit('input', $event)"
  >
    <template #activator="{ on, attrs }">
      <v-btn
        color="primary"
        v-bind="attrs"
        v-on="on"
      >
        <v-icon left>
          mdi-account-plus
        </v-icon>
        {{ $t('institutions.members.addMember') }}
      </v-btn>
    </template>

    <v-card :loading="loading" min-height="250">
      <v-card-title primary-title>
        {{ $t('institutions.members.addMember') }}

        <v-spacer />

        <v-btn icon @click="closeMenu">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-form>
          <v-text-field
            v-model="search"
            :label="$t('search')"
            :error="failedToSearch"
            :error-messages="errorMessages"
            prepend-inner-icon="mdi-account-search"
            hide-details
            dense
            outlined
            autofocus
          />
        </v-form>
      </v-card-text>

      <v-list v-if="hasUsers">
        <v-list-item
          v-for="user in users"
          :key="user.username"
          :disabled="!isAdmin && isConnectedUser(user)"
        >
          <v-list-item-avatar>
            <v-icon>mdi-account-circle</v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>
              {{ user.fullName }}
            </v-list-item-title>

            <v-list-item-subtitle v-if="user.email">
              {{ user.email }}
            </v-list-item-subtitle>
          </v-list-item-content>

          <!-- Membership list -->
          <v-menu
            v-if="Array.isArray(user.memberships) && user.memberships.length"
            :close-on-content-click="false"
            open-on-hover
            bottom
            offset-y
          >
            <template #activator="{ on, attrs }">
              <v-chip v-bind="attrs" v-on="on">
                {{ user.memberships.length }}

                <v-icon right>
                  mdi-domain
                </v-icon>
              </v-chip>
            </template>

            <v-list>
              <v-list-item
                v-for="({ institution }) in user.memberships"
                :key="`${user.username}:member:${institution.id}`"
                :to="isAdmin ? `/institutions/${institution.id}` : undefined"
              >
                <v-list-item-avatar>
                  <v-img
                    v-if="institution.logoId"
                    :src="`/api/assets/logos/${institution.logoId}`"
                  />
                  <v-icon v-else>
                    mdi-domain
                  </v-icon>
                </v-list-item-avatar>

                <v-list-item-title>{{ institution.name }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <slot name="action" :user="user" :close-menu="closeMenu" />
        </v-list-item>
      </v-list>

      <v-card-text v-else class="text-center">
        <div v-if="hasSearched" class="text-center">
          {{ $t('institutions.members.personNotRegistered') }}
        </div>

        <v-icon v-else size="64" color="grey lighten-2">
          mdi-account-search
        </v-icon>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script>
import debounce from 'lodash.debounce';

export default {
  props: {
    value: {
      type: Boolean,
      default: () => false,
    },
    institutionId: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      loading: false,
      failedToSearch: false,
      hasSearched: false,
      search: null,
      users: [],
    };
  },
  computed: {
    isAdmin() {
      return this.$auth?.user?.isAdmin;
    },
    errorMessages() {
      return this.failedToSearch ? [this.$t('institutions.members.failedToSearch')] : [];
    },
    hasUsers() {
      return Array.isArray(this.users) && this.users.length > 0;
    },
  },
  watch: {
    search(value) {
      if (value) {
        this.doSearch(value);
      }
    },
    value(isVisible, wasVisible) {
      if (isVisible && !wasVisible) {
        this.resetForm();
      }
    },
  },
  methods: {
    closeMenu() {
      this.$emit('input', false);
    },

    resetForm() {
      this.search = null;
      this.failedToSearch = false;
      this.hasSearched = false;
      this.users = [];
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
        const { data } = await this.$axios.get(
          '/users',
          {
            params: {
              q: this.search,
              source: '*',
              include: 'memberships.institution',
            },
          },
        );
        this.users = Array.isArray(data) ? data : [];
      } catch (e) {
        this.failedToSearch = true;
      }

      this.hasSearched = true;
      this.loading = false;
    }, 500),
  },
};
</script>
