<template>
  <div>
    <SkeletonPageBar :title="$t('menu.myspace.credentials')" />

    <v-container>
      <v-row>
        <v-col>
          <v-card :title="$t('myspace.title')">
            <template #append>
              <v-btn
                v-if="oidcProfileUri"
                :text="$t('myspace.iamAccount')"
                :href="oidcProfileUri"
                target="_blank"
                rel="noopener noreferrer"
                prepend-icon="mdi-key"
                append-icon="mdi-open-in-new"
                color="primary"
                variant="tonal"
                class="mr-2"
              />

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
                :text="$t('refreshShib')"
                :href="refreshProfileURL"
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

definePageMeta({
  layout: 'space',
  middleware: ['sidebase-auth', 'terms'],
});

const { oidcProfileUri } = useRuntimeConfig().public;
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

const refreshProfileURL = computed(() => {
  const currentLocation = encodeURIComponent(window.location.href);
  return `/api/auth/oauth/login?refresh=1&origin=${currentLocation}`;
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
