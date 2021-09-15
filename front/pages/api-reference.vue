<template>
  <v-container>
    <div id="swagger" />
  </v-container>
</template>

<script>
import SwaggerUI from 'swagger-ui';

export default {
  layout: 'home',
  mounted() {
    SwaggerUI({
      url: '/api/openapi.json',
      dom_id: '#swagger',
      deepLinking: false,
      docExpansion: 'none',
    });
  },
};
</script>

<style>
  #swagger .info {
    background-color: transparent !important;
    border-color: transparent !important;
  }
  #swagger .col {
    width: auto;
    max-width: 20%;
  }
</style>
