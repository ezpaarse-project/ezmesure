<template>
  <v-container class="fill-height">
    <v-row class="justify-center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="10">
          <v-card-title class="bg-primary d-flex">
            {{ $t('account.title') }}

            <v-spacer />

            <v-icon icon="mdi-text" />
          </v-card-title>

          <v-card-text class="pt-4">
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

            <v-form v-model="valid" @submit.prevent="activateProfile()">
              <v-row>
                <v-col>
                  <v-text-field
                    v-model="password"
                    :label="$t('password.password')"
                    :type="showPassword ? 'text' : 'password'"
                    :hint="$t('password.pattern')"
                    :rules="[
                      (v) => !!v.length || $t('password.passwordIsRequired'),
                      (v) => v.length >= 6 || $t('password.length'),
                    ]"
                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    prepend-icon="mdi-lock"
                    variant="underlined"
                    persistent-hint
                    required
                    class="mb-2"
                    @click:append="showPassword = !showPassword"
                  />
                </v-col>
              </v-row>

              <v-row>
                <v-col>
                  <v-text-field
                    v-model="passwordRepeat"
                    :label="$t('password.repeatPassword')"
                    :type="showPassword ? 'text' : 'password'"
                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    :rules="[
                      (v) => !!v.length || $t('password.passwordIsRequired'),
                      () => passwordRepeat === password || $t('password.notEqual'),
                      (v) => v.length >= 6 || $t('password.length'),
                    ]"
                    prepend-icon="mdi-lock"
                    variant="underlined"
                    required
                    @click:append="showPassword = !showPassword"
                  />
                </v-col>
              </v-row>

              <v-row>
                <v-col>
                  <i18n-t keypath="account.description.text" tag="p">
                    <template #regulationLink>
                      <a href="https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A32016R0679#PP2" target="_blank" rel="noopener noreferrer">
                        {{ $t('account.description.regulationLink') }}
                      </a>
                    </template>
                  </i18n-t>
                </v-col>
              </v-row>

              <v-row>
                <v-col>
                  <v-checkbox
                    v-model="accepted"
                    :label="$t('account.readAndAccept')"
                    density="compact"
                    hide-details
                  />
                </v-col>
              </v-row>

              <v-row>
                <v-col>
                  <v-btn
                    :text="$t('account.activate')"
                    :disabled="!valid"
                    :loading="loading"
                    type="submit"
                    color="primary"
                    block
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const { currentRoute } = useRouter();
const { t } = useI18n();
const { status: authStatus, refresh: authRefresh } = useAuth();

if (authStatus.value === 'unauthenticated' && !currentRoute.value.query?.token) {
  await navigateTo('/');
}

const valid = ref(false);
const loading = ref(false);
const password = ref('');
const passwordRepeat = ref('');
const accepted = ref(false);
const showPassword = ref(false);
const errorMessage = ref('');

async function activateProfile() {
  errorMessage.value = '';
  if (!accepted.value) {
    errorMessage.value = t('account.acceptTerms');
    return;
  }

  const { token, username } = currentRoute.value.query ?? {};

  loading.value = true;
  try {
    await $fetch('/api/profile/_activate', {
      method: 'POST',
      body: {
        password: password.value,
        acceptTerms: accepted.value,
        username,
      },
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });

    await authRefresh();
    await navigateTo('/myspace');
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
