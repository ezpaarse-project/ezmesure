<template>
  <div>
    <SkeletonPageBar :title="$t('menu.myspace.settings')" />

    <v-container>
      <v-row>
        <v-col>
          <CurrentUserSettingsNotificationsForm />
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
</script>
