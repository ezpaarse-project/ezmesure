<template>
  <v-container>
    <div id="swagger" />
  </v-container>
</template>

<script>
import SwaggerUI from 'swagger-ui';

export default {
  mounted() {
    SwaggerUI({
      url: '/api/openapi.json',
      dom_id: '#swagger',
      deepLinking: false,
    });
  },
};
</script>

<style>
  #swagger .info {
    background-color: transparent !important;
    border-color: transparent !important;
  }
  #swagger .btn.execute {
    background-color: #4990e2;
  }
</style>
