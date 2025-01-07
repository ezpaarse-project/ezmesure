<template>
  <div>
    <SkeletonPageBar :title="$t('files.title')">
      <template #extension>
        <v-tabs v-model="tab" color="primary" grow>
          <v-tab prepend-icon="mdi-format-list-bulleted">
            {{ $t('files.list') }}
          </v-tab>

          <v-tab prepend-icon="mdi-tray-arrow-down">
            {{ $t('files.submit') }}
          </v-tab>
        </v-tabs>
      </template>
    </SkeletonPageBar>

    <v-divider class="mb-2" />

    <v-tabs-window v-model="tab">
      <v-tabs-window-item>
        <CurrentUserFileList />
      </v-tabs-window-item>

      <v-tabs-window-item>
        <CurrentUserFileUploader />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'space',
  middleware: ['sidebase-auth', 'terms'],
});

const tab = ref(0);
</script>
