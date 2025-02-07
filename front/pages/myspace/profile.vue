<template>
  <div>
    <SkeletonPageBar :title="$t('myspace.title')" />

    <v-container>
      <v-row>
        <v-col>
          <v-card :title="$t('myspace.title')">
            <template v-if="refreshShibUrl" #append>
              <v-btn :href="refreshShibUrl" variant="text">
                <v-icon left>
                  mdi-refresh
                </v-icon>
                {{ $t('refresh') }}
              </v-btn>
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
definePageMeta({
  layout: 'space',
  middleware: ['sidebase-auth', 'terms'],
});

const { public: config } = useRuntimeConfig();
const { data: user } = useAuthState();

const refreshShibUrl = computed(() => {
  if (config.shibbolethDisabled) {
    return '';
  }

  const currentLocation = encodeURIComponent(window.location.href);
  return `/login?refresh=1&origin=${currentLocation}`;
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
</script>
