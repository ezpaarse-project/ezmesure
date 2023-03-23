<template>
  <v-dialog
    v-model="show"
    scrollable
    persistent
    width="900"
  >
    <v-card>
      <v-card-title class="headline">
        {{ $t(editMode ? 'users.updateUser' : 'users.newUser') }}
      </v-card-title>

      <v-card-text>
        <v-form id="userForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-card outlined>
            <v-card-title>
              {{ $t('users.user.general') }}
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="user.username"
                    :label="`${$t('users.user.username')} *`"
                    :rules="[v => !!v || $t('fieldIsRequired')]"
                    :disabled="editMode"
                    hide-details
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="user.fullName"
                    :label="$t('users.user.fullName')"
                    hide-details
                    outlined
                    required
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="user.email"
                    :label="`${$t('users.user.email')} *`"
                    :rules="[v => !!v || $t('fieldIsRequired')]"
                    hide-details
                    outlined
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card v-if="isAdmin" outlined class="mt-4">
            <v-card-title>
              {{ $t('administration') }}
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12">
                  <v-checkbox
                    v-model="user.isAdmin"
                    :label="$t('users.user.isAdmin')"
                    hide-details
                    class="mt-0"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          {{ $t('cancel') }}
        </v-btn>

        <v-btn
          type="submit"
          form="userForm"
          color="primary"
          :disabled="!valid"
          :loading="saving"
        >
          <v-icon left>
            mdi-content-save
          </v-icon>
          {{ editMode ? $t('update') : $t('create') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      saving: false,
      valid: false,

      editMode: false,

      user: {},
    };
  },
  computed: {
    hasRoles() {
      return Array.isArray(this.$auth?.user?.roles) && this.$auth.user.roles.length > 0;
    },
    isAdmin() {
      return this.$auth?.user?.isAdmin;
    },
  },
  methods: {
    editUser(user) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.user = JSON.parse(JSON.stringify(user));

      this.editMode = !!this.user.username;
      this.show = true;
    },

    createUser(opts = {}) {
      this.editUser({}, opts);
    },

    async save() {
      this.saving = true;

      try {
        const { username, ...user } = this.user;
        await this.$axios.$put(`/users/${username}`, user);
        this.$emit('update');
      } catch (e) {
        if (e?.response?.data?.error) {
          this.$store.dispatch('snacks/error', e.response.data.error);
        } else {
          this.$store.dispatch('snacks/error', this.$t('users.user.unableToUpate'));
        }
        this.saving = false;
        return;
      }

      this.$store.dispatch('snacks/success', this.$t('users.user.updated'));
      this.saving = false;
      this.show = false;
    },
  },
};
</script>
