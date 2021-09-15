<template>
  <v-container fluid fill-height>
    <v-layout
      id="privacy"
      row
      wrap
      align-center
      align-content-start
      justify-center
      class="text-center"
    >
      <v-flex xs12>
        <v-icon size="100">
          mdi-shield-lock-outline
        </v-icon>
        <h1
          class="display-1 mb-2"
          v-text="$t('privacy.title')"
        />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  layout: 'home',
};
</script>
