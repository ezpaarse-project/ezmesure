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
            <v-toolbar-title>{{ $t('validation.title') }}</v-toolbar-title>
            <v-spacer />
            <v-icon>mdi-text</v-icon>
          </v-toolbar>

          <v-card-text>
            <v-alert
              v-model="error"
              dismissible
              prominent
              dense
              type="error"
            >
              {{ $t('errors.generic') }}
            </v-alert>
            <v-alert
              v-model="pleaseAccept"
              dismissible
              prominent
              dense
              type="error"
            >
              {{ $t('validation.acceptTerms') }}
            </v-alert>

            <PasswordForm @save="save">
              <slot>
                <!-- eslint-disable-next-line -->
                <p v-html="$t('validation.description')" />

                <v-checkbox
                  v-model="accepted"
                  :rules="[() => !!accepted || ($t('validation.acceptTerms'))]"
                  :label="$t('validation.readAndAccept')"
                />

                <v-btn
                  block
                  color="primary"
                  type="submit"
                  class="my-2"
                  :disabled="!accepted"
                  :loading="loading"
                >
                  {{ $t('validation.activate') }}
                </v-btn>
              </slot>
            </PasswordForm>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import PasswordForm from '~/components/PasswordForm';

export default {
  middleware: ['auth'],
  components: {
    PasswordForm,
  },
  data() {
    return {
      pleaseAccept: false,
      accepted: false,
      error: false,
      loading: false,
      activated: false,
    };
  },
  methods: {
    async save() {
      this.loading = true;

      this.error = false;
      this.pleaseAccept = false;

      if (!this.accepted) {
        this.pleaseAccept = true;
        return;
      }

      try {
        await this.$axios.$post('/profile/terms/accept');
        await this.$auth.fetchUser();
        this.$router.replace({ path: '/myspace' });
      } catch (e) {
        this.error = true;
      }

      this.loading = false;
    },
  },
};
</script>
