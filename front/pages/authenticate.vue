<template>
  <v-container class="fill-height">
    <v-row class="justify-center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="10">
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
                      src="/images/kibana_logo.svg"
                      alt="Kibana"
                      height="35"
                    >
                  </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                  <v-row>
                    <v-col>
                      <p>
                        {{ $t('authenticate.kibanaAuth') }}
                      </p>
                    </v-col>
                  </v-row>

                  <v-row v-if="errorMessage">
                    <v-col>
                      <v-alert
                        :text="errorMessage"
                        type="error"
                        density="compact"
                        closable
                        @update:model-value="() => (errorMessage = '')"
                      />
                    </v-col>
                  </v-row>

                  <v-form v-model="valid" class="mt-4" @submit.prevent="login()">
                    <v-row>
                      <v-col>
                        <v-text-field
                          v-model="credentials.username"
                          :label="$t('authenticate.user')"
                          :rules="[() => !!credentials.username || ($t('authenticate.fieldIsRequired'))]"
                          prepend-icon="mdi-account"
                          variant="underlined"
                          required
                        />
                      </v-col>
                    </v-row>

                    <v-row>
                      <v-col>
                        <v-text-field
                          v-model="credentials.password"
                          :label="$t('authenticate.password')"
                          :type="showPassword ? 'text' : 'password'"
                          :rules="[() => !!credentials.password || ($t('authenticate.fieldIsRequired'))]"
                          :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                          prepend-icon="mdi-lock"
                          variant="underlined"
                          required
                          @click:append="showPassword = !showPassword"
                        />
                      </v-col>
                    </v-row>

                    <v-row class="align-center">
                      <v-col>
                        <nuxt-link to="/password/reset">
                          {{ $t('password.forgot') }}
                        </nuxt-link>
                      </v-col>

                      <v-col style="text-align: end;">
                        <v-btn
                          :text="$t('authenticate.logIn')"
                          :loading="loading"
                          :disabled="!valid"
                          color="primary"
                          type="submit"
                        />
                      </v-col>
                    </v-row>
                  </v-form>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel v-if="config.shibbolethDisabled">
                <v-expansion-panel-title>
                  <div>
                    <img
                      src="/images/shibboleth_logo.png"
                      alt="Shibboleth"
                      height="40"
                    >
                  </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                  <v-row>
                    <v-col>
                      <p>
                        {{ $t('authenticate.logInWithProvider') }}
                      </p>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col>
                      <p class="text-center">
                        <v-btn
                          :text="$t('authenticate.logIn')"
                          :href="`/login?origin=/myspace`"
                          color="primary"
                        />
                      </p>
                    </v-col>
                  </v-row>
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
  },
});

const { public: config } = useRuntimeConfig();
const { t } = useI18n();
const { signIn, status } = useAuth();
const { query } = useRoute();

if (status.value === 'authenticated') {
  await navigateTo('/myspace');
}

let provider = config.shibbolethDisabled ? 0 : 1;
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
