<template>
  <v-app light>
    <AppBar/>

    <main>
      <nuxt />
    </main>
  </v-app>
</template>

<script>
  import AppBar from '~/components/AppBar'

  export default {
    components: {
      AppBar
    }
  }
</script>
