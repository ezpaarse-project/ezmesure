<template>
  <v-container class="fill-height">
    <v-row class="justify-center">
      <v-empty-state
        :title="$t('authenticate.loading.title')"
        :text="$t('authenticate.loading.text')"
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

onMounted(async () => {
  await navigateTo(
    { path: '/api/auth/oauth/login', query: { origin: query?.redirect } },
    { external: true },
  );
});
</script>
