<template>
  <v-app light>
    <AppBar/>

    <main>
      <v-container fluid class="text-xs-center">
        <h1 class="display-1" v-if="error.statusCode === 404">Page introuvable</h1>
        <h1 class="display-1" v-else>Une erreur est survenue</h1>
      </v-container>
    </main>
  </v-app>
</template>

<script>
  import AppBar from '~/components/AppBar'

  export default {
    props: ['error'],
    components: {
      AppBar
    }
  }
</script>
