<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card class="elevation-10">
          <v-card-title class="bg-primary d-flex">
            {{ $t('authenticate.restrictedAccess') }}

            <v-spacer />

            <v-icon icon="mdi-lock" />
          </v-card-title>

          <v-card-text class="pa-0">
            <v-expansion-panels variant="accordion" :value="provider">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div>
                    <img
                      src="/images/kibana-logo-color-horizontal.svg"
                      alt="Kibana"
                      height="35"
                    >
                  </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                  <p class="pb-2">
                    {{ $t('authenticate.kibanaAuth') }}
                  </p>

                  <v-alert
                    v-if="errorMessage"
                    :value="errorMessage"
                    dismissible
                    prominent
                    dense
                    type="error"
                    class="mb-4"
                    @update:model-value="() => (errorMessage = '')"
                  >
                    {{ errorMessage }}
                  </v-alert>

                  <v-form v-model="valid" class="mb-4" @submit.prevent="login()">
                    <v-text-field
                      v-model="credentials.username"
                      :label="$t('authenticate.user')"
                      :rules="[() => !!credentials.username || ($t('authenticate.fieldIsRequired'))]"
                      prepend-inner-icon="mdi-account"
                      variant="outlined"
                      required
                    />

                    <v-text-field
                      v-model="credentials.password"
                      :label="$t('authenticate.password')"
                      :type="showPassword ? 'text' : 'password'"
                      :rules="[() => !!credentials.password || ($t('authenticate.fieldIsRequired'))]"
                      prepend-inner-icon="mdi-lock"
                      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      variant="outlined"
                      required
                      @click:append="showPassword = !showPassword"
                    />

                    <v-row>
                      <a href="/password/reset" class="text-left ml-5 mt-2">
                        {{ $t('password.forgot') }}
                      </a>

                      <v-spacer />

                      <v-btn
                        class="mr-5"
                        color="primary"
                        type="submit"
                        :loading="loading"
                        :disabled="!valid"
                      >
                        {{ $t('authenticate.logIn') }}
                      </v-btn>
                    </v-row>
                  </v-form>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel v-if="config.shibbolethEnabled">
                <v-expansion-panel-title>
                  <div>
                    <img
                      src="/images/shibboleth_logowordmark_color.png"
                      alt="Shibboleth"
                      height="40"
                    >
                  </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                  <p>
                    {{ $t('authenticate.logInWithProvider') }}
                  </p>

                  <p class="text-center">
                    <v-btn
                      color="primary"
                      :href="`/login?origin=/myspace`"
                    >
                      {{ $t('authenticate.logIn') }}
                    </v-btn>
                  </p>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/myspace',
  },
});

const { public: config } = useRuntimeConfig();
const { t } = useI18n();
const { signIn } = useAuth();
const { query } = useRoute();

let provider = config.shibbolethEnabled ? 1 : 0;
if (query?.provider === 'kibana') {
  provider = 0;
}

const valid = ref(false);
const loading = ref(false);
const showPassword = ref(false);
const errorMessage = ref('');
const credentials = ref({
  username: '',
  password: '',
});

async function login() {
  loading.value = true;

  try {
    await signIn(credentials.value, { callbackUrl: '/myspace' });
  } catch (err) {
    if (!(err instanceof Error)) {
      errorMessage.value = t('authenticate.failed');
      return;
    }

    if (err.statusCode >= 400 && err.statusCode < 500) {
      errorMessage.value = t('authenticate.loginFailed');
    } else {
      errorMessage.value = t('authenticate.failed');
    }
  }

  loading.value = false;
}
</script>

<style scoped lang="scss">

</style>
