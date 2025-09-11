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
                  :title="errorMessage.title"
                  :text="errorMessage.text"
                  type="error"
                  density="compact"
                  closable
                  @update:model-value="() => (errorMessage = undefined)"
                />
              </v-col>
            </v-row>

            <v-form v-model="valid" @submit.prevent="activateProfile()">
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
import { getErrorMessage } from '@/lib/errors';

const currentRoute = useRoute();
const { t } = useI18n();
const { status: authStatus, getSession } = useAuth();

if (authStatus.value === 'unauthenticated' && !currentRoute.query?.token) {
  await navigateTo('/');
}

const valid = shallowRef(false);
const loading = shallowRef(false);
const accepted = shallowRef(false);
const errorMessage = ref(undefined);

async function activateProfile() {
  errorMessage.value = undefined;
  if (!accepted.value) {
    errorMessage.value = { text: t('account.acceptTerms') };
    return;
  }

  loading.value = true;
  try {
    await $fetch('/api/auth/_activate', {
      method: 'POST',
      body: {
        acceptTerms: accepted.value,
      },
    });

    await getSession({ force: true });
    await navigateTo('/myspace');
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
