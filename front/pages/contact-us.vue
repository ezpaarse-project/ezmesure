<template>
  <v-container
    fluid
    fill-height
  >
    <v-row
      align="center"
      justify="center"
    >
      <v-col style="max-width: 800px">
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
                v-model="email"
                :rules="emailRules"
                :label="$t('contact.email')"
                name="email"
                outlined
                required
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

              <template v-if="endpointSubject">
                <v-text-field
                  v-model="endpointVendor"
                  :label="$t('contact.endpointVendor')"
                  :hint="$t('contact.pleaseEnterFullVendorName')"
                  :rules="[v => !!v || $t('fieldIsRequired')]"
                  requried
                  outlined
                />
                <v-text-field
                  v-model="endpointUrl"
                  :label="$t('contact.endpointUrl')"
                  :rules="[v => !!v || $t('fieldIsRequired')]"
                  requried
                  outlined
                />

                <p>{{ $t('contact.endpointDetails') }}</p>
              </template>

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
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  asyncData({ $auth }) {
    return {
      email: $auth?.user?.email || '',
      message: '',
      endpointVendor: '',
      endpointUrl: '',
      subject: {},
      sendBrowser: true,
      valid: true,
      loading: false,
    };
  },
  computed: {
    user() { return this.$auth.user; },
    endpointSubject() { return this.subject?.value === 'sushi-endpoint'; },
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
        {
          value: 'sushi-endpoint',
          text: this.$t('contact.declareSushiEndpoint'),
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

        let { message } = this;

        if (this.endpointSubject) {
          message = [
            this.$t('contact.endpointVendor'),
            this.endpointVendor,
            '',
            this.$t('contact.endpointUrl'),
            this.endpointUrl,
            '',
            message,
          ].join('\n');
        }

        try {
          await this.$axios.post('/contact', {
            email: this.user?.email || this.email,
            subject: this.subject?.text,
            message,
            browser: this.sendBrowser && this.subject.value === 'bugs' ? navigator.userAgent : null,
          });
          this.$store.dispatch('snacks/success', this.$t('contact.emailSent'));

          this.email = '';
          this.subject = {};
          this.message = '';
          this.endpointVendor = '';
          this.endpointUrl = '';
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
