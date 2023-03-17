<template>
  <section>
    <ToolBar :title="$t('kibana.title')">
      <slot>
        <v-spacer />

        <v-btn text @click="showPasswordReset = true">
          <v-icon left>
            mdi-lock-question
          </v-icon>
          {{ $t('kibana.passwordLost') }}
        </v-btn>
      </slot>
    </ToolBar>
    <v-card-text class="w-800 mx-auto">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p v-html="$t('kibana.whatDoesUsername')" />

      <v-text-field
        :value="user.username"
        append-icon="mdi-account"
        :label="$t('kibana.username')"
        readonly
        outlined
      />
    </v-card-text>

    <v-dialog v-model="showPasswordReset" width="500">
      <v-card>
        <v-toolbar
          color="primary"
          dark
          flat
          dense
        >
          <v-toolbar-title>
            {{ $t('kibana.passwordLost') }}
          </v-toolbar-title>

          <v-spacer />

          <v-icon>mdi-lock-question</v-icon>
        </v-toolbar>

        <v-card-text>
          <v-alert
            class="mt-1"
            :value="resetError"
            dismissible
            prominent
            dense
            type="error"
          >
            {{ resetErrorText }}
          </v-alert>
          <v-alert
            class="mt-1"
            :value="resetSuccess"
            dismissible
            prominent
            dense
            type="success"
          >
            {{ $t('kibana.newPasswordSentByEmail') }}
          </v-alert>

          <!-- eslint-disable-next-line vue/no-v-html -->
          <p class="mt-2" v-html="$t('kibana.resetPassword')" />
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />

          <v-btn text @click="showPasswordReset = false">
            {{ $t('close') }}
          </v-btn>

          <v-btn
            color="primary"
            text
            :loading="resettingPassword"
            @click="resetPassword"
          >
            {{ $t('reset') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
  },
  data() {
    return {
      showPasswordReset: false,
      resettingPassword: false,
      resetSuccess: false,
      resetError: null,
      resetErrorText: '',
      selectedFiles: [],
    };
  },
  computed: {
    user() { return this.$auth.user; },
    nbSelectedFiles() { return this.selectedFiles.length; },
  },
  methods: {
    async resetPassword() {
      this.resetError = null;
      this.resetSuccess = false;
      this.resettingPassword = true;

      try {
        await this.$axios.$post('/profile/password/_get_token', { username: this.user.username });
        this.resetSuccess = true;
      } catch (e) {
        this.resetError = true;
        if (e.response.status >= 400 && e.response.status < 500) {
          this.resetErrorText = e.response.body;
        } else if (e.response.statusText) {
          this.resetErrorText = e.response.statusText;
        } else {
          this.resetErrorText = e.message;
        }
      }

      this.resettingPassword = false;
    },
  },
};
</script>
