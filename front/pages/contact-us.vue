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
            <v-toolbar-title>
              {{ $t('contact.contactUs') }}
            </v-toolbar-title>
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

              <v-row v-if="endpointSubject" class="mt-2">
                <v-col cols="12">
                  <v-text-field
                    v-model="endpointVendor"
                    :label="$t('contact.endpointVendor')"
                    :hint="$t('contact.pleaseEnterFullVendorName')"
                    :rules="[v => !!v || $t('fieldIsRequired')]"
                    hide-details="auto"
                    requried
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="endpointUrl"
                    :label="$t('contact.endpointUrl')"
                    :rules="[v => !!v || $t('fieldIsRequired')]"
                    hide-details="auto"
                    requried
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <p class="mb-0">
                    {{ $t('contact.sushiDetails') }}
                  </p>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="sushiRequestorId"
                    :label="$t('institutions.sushi.requestorId')"
                    :rules="[sushiRule]"
                    hide-details="auto"
                    outlined
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="sushiCustomerId"
                    :label="$t('institutions.sushi.customerId')"
                    :rules="[sushiRule]"
                    hide-details="auto"
                    outlined
                  />
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="sushiApiKey"
                    :label="$t('institutions.sushi.apiKey')"
                    :rules="[sushiRule]"
                    hide-details="auto"
                    outlined
                  />
                </v-col>

                <v-col cols="12">
                  <p>{{ $t('contact.endpointDetails') }}</p>

                  <v-textarea
                    v-model="message"
                    :label="$t('contact.additionalInformation')"
                    name="message"
                    outlined
                  />
                </v-col>
              </v-row>

              <v-textarea
                v-else
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
            <v-btn color="error" @click="$router.go(-1)">
              {{ $t('cancel') }}
            </v-btn>
            <v-btn
              :disabled="!valid"
              :loading="loading"
              color="primary"
              @click="validate"
            >
              {{ $t('send') }}
            </v-btn>
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
      sushiRequestorId: '',
      sushiCustomerId: '',
      sushiApiKey: '',
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
        (v) => !!v || this.$t('contact.emailIsRequired'),
        (v) => /.+@.+\..+/.test(v) || this.$t('contact.emailMustBeValid'),
      ];
    },
    messageRules() { return [(v) => !!v || this.$t('contact.contentIsRequired')]; },
    subjectRules() { return [(v) => !!v || this.$t('contact.subjectIsRequired')]; },
    sushiRule() { return (!!this.sushiRequestorId || !!this.sushiCustomerId || !!this.sushiApiKey) || this.$t('contact.sushiIsRequired'); },
  },
  methods: {
    async validate() {
      this.$refs.form.validate();

      if (this.valid) {
        this.loading = true;

        let { message } = this;

        if (this.endpointSubject) {
          message = [
            `${this.$t('contact.endpointVendor')}:`,
            this.endpointVendor,
            `${this.$t('contact.endpointUrl')}:`,
            this.endpointUrl,
            '',
            `${this.$t('institutions.sushi.requestorId')}:`,
            this.sushiRequestorId,
            `${this.$t('institutions.sushi.customerId')}:`,
            this.sushiCustomerId,
            `${this.$t('institutions.sushi.apiKey')}:`,
            this.sushiApiKey,
            '',
            message,
          ].join('\n');
        }

        try {
          await this.$axios.post('/contact', {
            email: this.user?.email || this.email,
            subject: this.subject?.text,
            message,
            browser: this.sendBrowser || this.subject.value === 'bugs' ? navigator.userAgent : null,
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
