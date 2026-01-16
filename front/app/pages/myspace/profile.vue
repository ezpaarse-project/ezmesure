<template>
  <div>
    <SkeletonPageBar :title="$t('menu.myspace.credentials')" />

    <v-container>
      <v-row>
        <v-col>
          <v-card :title="$t('kibana.title')">
            <template #text>
              <v-row>
                <v-col>
                  <i18n-t keypath="kibana.whatDoesUsername.text" tag="p">
                    <template #accountLink>
                      <a :href="kibanaProfileUrl" @click.prevent="openInTab(kibanaProfileUrl, 'changePassword')">
                        {{ $t('kibana.whatDoesUsername.accountLink') }}
                      </a>
                    </template>
                  </i18n-t>
                </v-col>
              </v-row>

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
                    />
                  </v-col>
                </v-row>
              </v-expand-transition>

              <v-form id="passwordForm" v-model="valid" @submit.prevent="replacePassword()">
                <v-row>
                  <v-col>
                    <v-text-field
                      :model-value="user.username"
                      :label="$t('kibana.username')"
                      prepend-icon="mdi-account-key"
                      variant="underlined"
                      hide-details
                      disabled
                      readonly
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col>
                    <v-text-field
                      v-model="actualPassword"
                      :label="$t('password.actualPassword')"
                      :type="showPassword ? 'text' : 'password'"
                      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      :messages="[$t('password.forgot')]"
                      prepend-icon="mdi-form-textbox-password"
                      variant="underlined"
                      @click:append="showPassword = !showPassword"
                    >
                      <template #message="{ message }">
                        <nuxt-link to="/password/reset">
                          {{ message }}
                        </nuxt-link>
                      </template>
                    </v-text-field>
                  </v-col>
                </v-row>

                <v-row>
                  <v-col>
                    <v-text-field
                      v-model="password"
                      :label="$t('password.newPassword')"
                      :type="showPassword ? 'text' : 'password'"
                      :hint="$t('password.pattern')"
                      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      :disabled="actualPassword.length === 0"
                      :rules="[
                        (v) => v.length >= 6 || $t('password.length'),
                      ]"
                      prepend-icon="mdi-lock"
                      variant="underlined"
                      persistent-hint
                      @click:append="showPassword = !showPassword"
                    />
                  </v-col>

                  <v-col>
                    <v-text-field
                      v-model="passwordRepeat"
                      :label="$t('password.repeatNewPassword')"
                      :type="showPassword ? 'text' : 'password'"
                      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      :disabled="actualPassword.length === 0"
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
              </v-form>
            </template>

            <template #actions>
              <v-spacer />

              <v-btn
                :text="$t('password.update')"
                :disabled="!valid"
                :loading="loading"
                prepend-icon="mdi-pencil"
                type="submit"
                form="passwordForm"
                color="primary"
              />
            </template>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-card :title="$t('myspace.title')">
            <template #append>
              <ConfirmPopover
                :agree="() => deleteAccount()"
                :text="$t('myspace.profile.actions.delete.confirm.text', { duration: deleteDuration })"
                max-width="600"
              >
                <template #activator="{ props: confirm }">
                  <v-btn
                    :text="$t('myspace.profile.actions.delete.title')"
                    prepend-icon="mdi-delete"
                    color="red"
                    variant="text"
                    v-bind="confirm"
                  />
                </template>
              </ConfirmPopover>

              <v-btn
                v-if="refreshShibUrl"
                :text="$t('refreshShib')"
                :href="refreshShibUrl"
                prepend-icon="mdi-refresh"
                variant="text"
              />
            </template>

            <template #text>
              <v-list density="compact">
                <v-list-item
                  v-for="field in fields"
                  :key="field.name"
                  :prepend-icon="field.icon"
                  :title="field.value"
                  :subtitle="$t(`myspace.${field.name}`)"
                  lines="two"
                />
              </v-list>
            </template>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { millisecondsInDay } from 'date-fns/constants';
import { getErrorMessage } from '@/lib/errors';

definePageMeta({
  layout: 'space',
  middleware: ['sidebase-auth', 'terms'],
});

const { public: config } = useRuntimeConfig();
const { data: apiConfig } = await useApiConfig();
const { data: user, signOut } = useAuth();
const { openInTab } = useSingleTabLinks('profile');
const { t, locale } = useI18n();

const { spacesPermissions } = storeToRefs(useCurrentUserStore());

const valid = shallowRef(false);
const loading = shallowRef(false);
const success = shallowRef(false);
const actualPassword = shallowRef('');
const password = shallowRef('');
const passwordRepeat = shallowRef('');
const showPassword = shallowRef(false);
const errorMessage = ref(undefined);

const deleteDuration = computed(() => {
  const deleteDurationDays = apiConfig?.value?.users?.deleteDurationDays;
  return timeAgo(deleteDurationDays * millisecondsInDay, locale.value) ?? '...';
});

const refreshShibUrl = computed(() => {
  if (config.shibbolethDisabled) {
    return '';
  }

  const currentLocation = encodeURIComponent(window.location.href);
  return `/login?refresh=1&origin=${currentLocation}`;
});

const kibanaProfileUrl = computed(() => {
  const firstSpace = spacesPermissions.value.at(0);
  if (firstSpace) {
    return `/kibana/s/${firstSpace.spaceId}/security/account`;
  }
  return '/kibana/';
});

const fields = computed(
  () => [
    { name: 'name', value: user.value.fullName, icon: 'mdi-account' },
    { name: 'mail', value: user.value.email, icon: 'mdi-email' },
    { name: 'idp', value: user.value.metadata?.idp, icon: 'mdi-web' },
    { name: 'organization', value: user.value.metadata?.org, icon: 'mdi-domain' },
    { name: 'unit', value: user.value.metadata?.unit, icon: 'mdi-account-group' },
  ].filter((f) => f.value),
);

async function replacePassword() {
  loading.value = true;
  errorMessage.value = undefined;
  success.value = false;
  try {
    await $fetch('/api/profile/password', {
      method: 'PUT',
      body: {
        actualPassword: actualPassword.value,
        password: password.value,
      },
    });

    success.value = true;
  } catch (err) {
    if (err?.statusCode === 401) {
      errorMessage.value = { text: t('authenticate.loginFailed') };
    } else {
      errorMessage.value = {
        title: t('anErrorOccurred'),
        text: getErrorMessage(err),
      };
    }
  }
  loading.value = false;
}

async function deleteAccount() {
  await $fetch('/api/profile', {
    method: 'DELETE',
  });

  if (!config.shibbolethDisabled) {
    await navigateTo('/Shibboleth.sso/Logout?return=/logout', { external: true });
    return;
  }

  await signOut({ callbackUrl: '/' });
}
</script>
