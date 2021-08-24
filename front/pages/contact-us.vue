<template>
  <v-container
    fluid
    fill-height
  >
    <v-layout
      align-center
      justify-center
    >
      <v-flex
        xs12
        sm8
        md4
      >
        <v-card class="elevation-12">
          <v-toolbar
            color="primary"
            dark
            flat
            dense
          >
            <v-toolbar-title v-text="$t('contact.contactUs')" />
            <v-spacer />
            <v-icon>mdi-email-edit</v-icon>
          </v-toolbar>

          <v-card-text>
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
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn color="error" @click="$router.go(-1)" v-text="$t('cancel')" />
            <v-btn
              :disabled="!valid"
              :loading="loading"
              color="primary"
              @click="validate"
              v-text="$t('send')"
            />
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
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
