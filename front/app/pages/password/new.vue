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

            <v-expand-transition>
              <v-row v-if="success">
                <v-col>
                  <v-alert
                    :title="$t('password.updated')"
                    type="success"
                    density="compact"
                  >
                    <template #text>
                      <p class="pt-2">
                        {{ $t('password.youCanNowLogin') }}
                      </p>

                      <div class="d-flex justify-end">
                        <v-btn
                          :text="$t('authenticate.logIn')"
                          prepend-icon="mdi-arrow-left"
                          to="/authenticate"
                          variant="tonal"
                        />
                      </div>
                    </template>
                  </v-alert>
                </v-col>
              </v-row>
            </v-expand-transition>

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
                    prepend-icon="mdi-pencil"
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

const { currentRoute } = useRouter();
const { t } = useI18n();

if (!currentRoute.value.query?.token) {
  await navigateTo('/');
}

const valid = shallowRef(false);
const loading = shallowRef(false);
const success = shallowRef(false);
const password = shallowRef('');
const passwordRepeat = shallowRef('');
const showPassword = shallowRef(false);
const errorMessage = ref(undefined);

async function replacePassword() {
  loading.value = true;
  errorMessage.value = undefined;
  success.value = false;
  try {
    await $fetch('/api/profile/password/_reset', {
      method: 'POST',
      body: {
        password: password.value,
        token: currentRoute.value.query?.token,
      },
    });

    success.value = true;
  } catch (err) {
    errorMessage.value = {
      title: t('authenticate.failed'),
      text: getErrorMessage(err),
    };
  }
  loading.value = false;
}
</script>
