<template>
  <v-app>
    <client-only>
      <NuxtLoadingIndicator color="#3B8070" />

      <SkeletonAppBar @model-value:menu="updateVisibleMenu()" />
      <SkeletonSnacks />
      <SkeletonDialog />
      <SkeletonConfirmDialog />

      <nuxt-layout>
        <nuxt-page />
      </nuxt-layout>

      <SkeletonSushiQueueStatus />
    </client-only>
  </v-app>
</template>

<script setup>
useHead({
  title: 'ezMESURE - Plateforme des tableaux de bord ezPAARSE de l’ESR',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { hid: 'description', name: 'description', content: 'ezMESURE est un entrepôt national centralisant les statistiques d’usage de la documentation scientifique numérique des établissements de l’enseignement supérieur et de la recherche (ESR). ezMESURE aggrege les données produites par les installations ezPAARSE des établissements de l’ESR.' },
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
  ],
});

const visible = shallowRef(false);

const emit = defineEmits({
  updated: () => true,
});

async function updateVisibleMenu() {
  visible.value = !visible.value;
  emit('updated');
}
</script>

<style>
  @layer vuetify-core.reset {
    ul, ol, figure, details, summary { padding: 0; margin: 0; }
    h1, h2, h3, h4, h5, h6, p { margin: 0; }

    a { color: rgb(var(--v-theme-primary)); }
  }
</style>
