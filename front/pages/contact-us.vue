<template>
  <v-container fluid fill-height>
    <v-layout
      id="privacy"
      row
      wrap
      align-center
      align-content-start
      justify-center
      class="text-center"
    >
      <v-flex xs12>
        <v-icon size="100">
          mdi-email-edit
        </v-icon>
        <h1
          class="display-1 mb-2"
          v-text="$t('contact.contactUs')"
        />
      </v-flex>

      <v-flex xs12 sm6 md5 lg4 class="ma-2">
        <v-form
          ref="form"
          v-model="valid"
        >
          <v-text-field
            v-if="!user"
            v-model="email"
            :rules="emailRules"
            label="Email"
            name="email"
            outlined
            clearable
            required
          />
          <v-text-field
            v-else
            :value="user.email"
            :rules="emailRules"
            :label="$t('contact.email')"
            name="email"
            outlined
            clearable
            required
            disabled
          />
          <v-select
            v-model="subject"
            :items="subjects"
            :rules="subjectRules"
            :label="$t('contact.subject')"
            name="subject"
            outlined
            required
            return-object
          />
          <v-textarea
            v-model="message"
            :rules="messageRules"
            :label="$t('contact.content')"
            name="message"
            outlined
            required
          />
          <v-checkbox
            v-if="subject.value === 'bugs'"
            v-model="sendBrowser"
            :label="$t('contact.sendNavigatorVersion')"
          />
          <v-btn
            :disabled="!valid"
            :loading="loading"
            color="primary"
            type="submit"
            block
            @click="validate"
            v-text="$t('send')"
          />
        </v-form>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  layout: 'home',
  data: () => ({
    email: '',
    message: '',
    subject: {},
    sendBrowser: true,
    valid: true,
    loading: false,
  }),
  computed: {
    user() { return this.$auth.user; },
    subjects() {
      return [
        {
          value: 'informations',
          text: this.$t('contact.requestInformation'),
        },
        {
          value: 'bugs',
          text: this.$t('contact.bugReport'),
        },
      ];
    },
    emailRules() {
      return [
        v => !!v || this.$t('contact.emailIsRequired'),
        v => /.+@.+\..+/.test(v) || this.$t('contact.emailMustBeValid'),
      ];
    },
    messageRules() { return [v => !!v || this.$t('contact.contentIsRequired')]; },
    subjectRules() { return [v => !!v || this.$t('contact.subjectIsRequired')]; },
  },
  methods: {
    async validate() {
      this.$refs.form.validate();

      if (this.valid) {
        this.loading = true;
        try {
          await this.$axios.post('/contact', {
            email: this.user?.email || this.email,
            subject: this.subject?.text,
            message: this.message,
            browser: this.sendBrowser && this.subject.value === 'bugs' ? navigator.userAgent : null,
          });
          this.$store.dispatch('snacks/success', this.$t('contact.emailSent'));

          this.email = '';
          this.subject = {};
          this.message = '';
          this.sendBrowser = true;
          this.$refs.form.resetValidation();
          this.loading = false;
        } catch (e) {
          this.$store.dispatch('snacks/error', this.$t('contact.failed'));
          this.loading = false;
        }
      }
    },
  },
};
</script>
