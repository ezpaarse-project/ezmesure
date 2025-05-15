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
                  :title="errorMessage.title"
                  :text="errorMessage.text"
                  type="error"
                  density="compact"
                  closable
                  @update:model-value="() => (errorMessage = undefined)"
                />
              </v-col>
            </v-row>

            <v-row v-if="success">
              <v-col>
                <v-alert
                  :title="$t('password.checkYourEmail')"
                  :text="$t('password.waitFewMinutes')"
                  type="success"
                  density="compact"
                >
                  <template #append>
                    <v-btn
                      :text="$t('password.backToLogin')"
                      prepend-icon="mdi-arrow-left"
                      to="/authenticate"
                      variant="tonal"
                    />
                  </template>
                </v-alert>
              </v-col>
            </v-row>

            <v-form v-model="valid" @submit.prevent="resetPassword()">
              <v-row>
                <v-col>
                  <p>
                    {{ $t('password.enterUser') }}
                  </p>
                </v-col>
              </v-row>

              <v-row>
                <v-col>
                  <v-text-field
                    v-model="username"
                    :label="$t('password.user')"
                    :rules="[
                      (v) => !!v || $t('fieldIsRequired'),
                    ]"
                    prepend-icon="mdi-account"
                    variant="underlined"
                    required
                    class="mb-2"
                  />
                </v-col>
              </v-row>

              <v-row class="align-center">
                <v-col>
                  <nuxt-link to="/authenticate">
                    {{ $t('password.backToLogin') }}
                  </nuxt-link>
                </v-col>

                <v-col>
                  <v-btn
                    :text="$t('password.reset')"
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
import { getErrorMessage } from '@/lib/errors';

const { t } = useI18n();
const { data: user } = useAuthState();

const valid = ref(false);
const loading = ref(false);
const success = ref(false);
const errorMessage = ref(undefined);
const username = ref(user.value?.username);

async function resetPassword() {
  errorMessage.value = undefined;
  loading.value = true;
  try {
    await $fetch('/api/profile/password/_get_token', {
      method: 'POST',
      body: {
        username: username.value,
      },
    });

    success.value = true;
  } catch (err) {
    if (err.statusCode >= 400 && err.statusCode < 500) {
      errorMessage.value = { text: t('authenticate.loginFailed') };
    } else {
      errorMessage.value = {
        title: t('authenticate.failed'),
        text: getErrorMessage(err),
      };
    }
  }
  loading.value = false;
}
</script>
