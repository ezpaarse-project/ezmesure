<template>
  <v-container class="fill-height">
    <v-row class="justify-center">
      <v-empty-state
        :title="$t('pleaseWait')"
        :text="$t('authenticate.loadingDesc')"
      >
        <template #media>
          <v-progress-circular
            color="primary"
            size="128"
            indeterminate
            class="mb-4"
          >
            <v-icon icon="mdi-login" />
          </v-progress-circular>
        </template>

        <template #actions>
          <v-slide-y-transition>
            <v-row v-if="userIsWaiting" class="text-center mx-auto" style="max-width: 500px;">
              <v-col cols="12" class="text-body-2">
                {{ $t('authenticate.longLoadingDesc') }}
              </v-col>

              <v-col>
                <v-btn
                  :text="$t('authenticate.longLoadingBtn')"
                  :href="redirectUrl.href"
                  append-icon="mdi-login-variant"
                  variant="outlined"
                  color="primary"
                />
              </v-col>
            </v-row>
          </v-slide-y-transition>
        </template>
      </v-empty-state>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({
  auth: {
    unauthenticatedOnly: true,
  },
});

const { status } = useAuth();
const { query } = useRoute();

if (status.value === 'authenticated') {
  await navigateTo(query?.redirect || '/myspace');
}

let timeoutId;
const userIsWaiting = shallowRef(false);

const redirectUrl = computed(() => {
  const url = new URL('/api/auth/oauth/login', window.location);
  if (query?.redirect) { url.searchParams.set('origin', query.redirect); }

  return url;
});

async function goToLogin() {
  userIsWaiting.value = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  await navigateTo(
    { path: redirectUrl.value.pathname, query: Object.fromEntries(redirectUrl.value.searchParams) },
    { external: true },
  );

  timeoutId = setTimeout(() => {
    userIsWaiting.value = true;
  }, 5000);
}

onMounted(async () => {
  await goToLogin();
});
</script>
