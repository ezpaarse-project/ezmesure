<template>
  <v-container class="fill-height">
    <v-row class="justify-center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="10">
          <v-card-title class="bg-primary d-flex">
            {{ $t('password.forgot') }}

            <v-spacer />

            <v-icon icon="mdi-lock" />
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

            <v-form v-model="valid" @submit.prevent="replacePassword()">
              <v-row>
                <v-col>
                  <v-text-field
                    v-model="password"
                    :label="$t('password.password')"
                    :type="showPassword ? 'text' : 'password'"
                    :hint="$t('password.pattern')"
                    :rules="[
                      (v) => !!v || $t('password.passwordIsRequired'),
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
                      (v) => !!v || $t('password.passwordIsRequired'),
                      (v) => v.length >= 6 || $t('password.length'),
                      () => passwordRepeat === password || $t('password.notEqual'),
                      (v) => v >= 6 || $t('password.length'),
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
                  <v-btn
                    :text="$t('password.update')"
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
const { currentRoute, push: goTo } = useRouter();
const { t } = useI18n();

if (!currentRoute.value.query?.token) {
  goTo('/');
}

const valid = ref(false);
const loading = ref(false);
const password = ref('');
const passwordRepeat = ref('');
const showPassword = ref(false);
const errorMessage = ref('');

async function replacePassword() {
  loading.value = true;
  try {
    await $fetch('/api/profile/password/_reset', {
      method: 'POST',
      body: {
        password: password.value,
      },
      headers: {
        Authorization: `Bearer ${currentRoute.value.query?.token}`,
      },
    });

    success.value = true;
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
