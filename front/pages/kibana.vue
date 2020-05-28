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
    <v-card-text>
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
          <v-toolbar-title v-text="$t('kibana.passwordLost')" />
          <v-spacer />
          <v-icon>mdi-lock-question</v-icon>
        </v-toolbar>

        <v-card-text>
          <v-alert
            :value="resetError"
            dismissible
            prominent
            dense
            type="error"
          >
            {{ resetErrorText }}
          </v-alert>
          <v-alert
            :value="resetSuccess"
            dismissible
            prominent
            dense
            type="success"
            v-text="$t('kibana.newPasswordSentByEmail')"
          />

          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-html="$t('kibana.resetPassword')" />
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showPasswordReset = false" v-text="$t('close')" />
          <v-btn
            color="primary"
            text
            :loading="resettingPassword"
            @click="resetPassword"
            v-text="$t('reset')"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';

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
        await this.$axios.$put('/profile/password/reset');
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
